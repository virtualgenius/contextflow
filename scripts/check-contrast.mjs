#!/usr/bin/env node
// WCAG AA color-contrast gate. Runs axe-core's color-contrast rule in headless
// Chromium against the built app (light + dark, each view, issue labels on)
// and against every mockup in docs/mockups. Any violation fails the run.
//
//   node scripts/check-contrast.mjs            # app (serves dist/) + mockups
//   node scripts/check-contrast.mjs --app      # app only
//   node scripts/check-contrast.mjs --mockups  # mockups only
//   node scripts/check-contrast.mjs --url http://localhost:5173   # running dev server
//   node scripts/check-contrast.mjs --mockups --update-baseline   # ratchet legacy mockups down
//
// Requires `npm run build` first unless --url is given.
//
// Mockups predating this gate are listed with their violation counts in
// scripts/contrast-baseline.json. A mockup may never exceed its baseline, a
// new mockup must be clean, and when one improves, --update-baseline records
// the lower number so it cannot regress.

import { chromium } from 'playwright'
import { createRequire } from 'node:module'
import { readdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { spawn } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const AXE_SOURCE_PATH = require.resolve('axe-core/axe.min.js')

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const MOCKUPS_DIR = join(ROOT, 'docs', 'mockups')
const BASELINE_PATH = join(ROOT, 'scripts', 'contrast-baseline.json')
const PREVIEW_PORT = 4173
const PREVIEW_URL = `http://localhost:${PREVIEW_PORT}`
const SETTLE_MS = 600
const VIEW_TABS = ['Value Stream', 'Distillation', 'Strategic']
const THEMES = ['light', 'dark']

const args = new Set(process.argv.slice(2))
const urlArg = process.argv.find((a, i, all) => all[i - 1] === '--url')
const runApp = args.has('--app') || (!args.has('--mockups') && !args.has('--app')) || Boolean(urlArg)
const runMockups = args.has('--mockups') || (!args.has('--app') && !urlArg)
const updateBaseline = args.has('--update-baseline')

async function runAxe(page) {
  await page.addScriptTag({ path: AXE_SOURCE_PATH })
  return page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    return axe.run(document, { runOnly: ['color-contrast'], resultTypes: ['violations'] })
  })
}

// axe does not evaluate SVG <text>. Canvas-style mockups and the React Flow
// canvas put their labels there, so this pass checks each visible SVG text
// against whatever element is painted beneath its center.
const LARGE_TEXT_PX = 24
const LARGE_BOLD_TEXT_PX = 18.66
const BOLD_WEIGHT = 700

async function runSvgTextCheck(page) {
  return page.evaluate(
    ({ LARGE_TEXT_PX, LARGE_BOLD_TEXT_PX, BOLD_WEIGHT }) => {
      const parse = (c) => {
        const m = c && c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?/)
        if (!m) return null
        const a = m[4] === undefined ? 1 : Number(m[4])
        return a === 0 ? null : [Number(m[1]), Number(m[2]), Number(m[3])]
      }
      const lin = (v) => {
        const c = v / 255
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      }
      const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
      const ratio = (f, b) => {
        const lf = lum(f), lb = lum(b)
        return (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05)
      }
      const hex = ([r, g, b]) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
      const isInvisible = (node) => {
        for (let n = node; n && n !== document.body; n = n.parentElement) {
          const cs = getComputedStyle(n)
          if (cs.opacity === '0' || cs.visibility === 'hidden') return true
        }
        return false
      }
      // A path with no explicit fill computes to black without painting it.
      const isSurface = (n) => {
        if (!(n instanceof SVGElement)) return true
        if (/^(rect|circle|ellipse|polygon)$/i.test(n.tagName)) return true
        if (n.tagName.toLowerCase() === 'path') {
          const f = n.getAttribute('fill') || n.style.fill
          return Boolean(f) && f !== 'none'
        }
        return false
      }
      const paintedColor = (node) => {
        if (isInvisible(node) || !isSurface(node)) return null
        const cs = getComputedStyle(node)
        return parse(node instanceof SVGElement ? cs.fill : cs.backgroundColor)
      }
      const selectorFor = (node) => {
        const owner = node.closest('[data-id],[data-ctx],[data-testid]')
        const attr = owner ? ['data-id', 'data-ctx', 'data-testid'].find((a) => owner.hasAttribute(a)) : null
        const prefix = owner ? `${owner.tagName.toLowerCase()}[${attr}="${owner.getAttribute(attr)}"] ` : 'svg '
        return `${prefix}text "${node.textContent.trim().slice(0, 30)}"`
      }
      const SLACK = 1
      const containsBox = (n, box) => {
        const b = n.getBoundingClientRect()
        return b.left <= box.left + SLACK && b.top <= box.top + SLACK && b.right >= box.right - SLACK && b.bottom >= box.bottom - SLACK
      }
      // Walk outward through the text's SVG ancestors; the background is the
      // last painted shape drawn before the text that encloses its glyph box.
      const domSurface = (text, box) => {
        const owner = text.ownerSVGElement
        for (let scope = text.parentElement; scope && scope !== owner.parentElement; scope = scope.parentElement) {
          const shapes = [...scope.querySelectorAll('rect,circle,ellipse,polygon,path')].filter(
            (n) => !n.contains(text) && n.compareDocumentPosition(text) & Node.DOCUMENT_POSITION_FOLLOWING && paintedColor(n) && containsBox(n, box)
          )
          if (shapes.length) return shapes[shapes.length - 1]
        }
        return null
      }
      // Hit-test with the text made targetable: whatever paints above it means
      // it is covered (a modal scrim, an overlay badge), not a contrast case.
      const withHitTarget = (text, fn) => {
        const chain = []
        for (let n = text; n && n !== text.ownerSVGElement.parentElement; n = n.parentElement) {
          chain.push([n, n.style.pointerEvents])
          n.style.pointerEvents = 'all'
        }
        try {
          return fn()
        } finally {
          for (const [n, prev] of chain) n.style.pointerEvents = prev
        }
      }
      const failures = []
      for (const text of document.querySelectorAll('svg text')) {
        if (!text.textContent.trim() || !text.ownerSVGElement) continue
        const box = text.getBoundingClientRect()
        if (box.width === 0 || box.height === 0) continue
        if (box.bottom < 0 || box.right < 0 || box.top > innerHeight || box.left > innerWidth) continue
        const cs = getComputedStyle(text)
        const fg = parse(cs.fill)
        if (!fg) continue
        const cx = box.left + box.width / 2, cy = box.top + box.height / 2
        const stack = withHitTarget(text, () => document.elementsFromPoint(cx, cy))
        const textIndex = stack.findIndex((n) => n === text || text.contains(n))
        const above = textIndex === -1 ? stack : stack.slice(0, textIndex)
        if (above.some((n) => !n.contains(text) && paintedColor(n))) continue
        const below = textIndex === -1 ? [] : stack.slice(textIndex + 1)
        const behind = domSurface(text, box) ?? below.find((n) => !n.contains(text) && paintedColor(n))
        if (!behind) continue
        const bg = paintedColor(behind)
        const size = parseFloat(cs.fontSize)
        const weight = parseInt(cs.fontWeight, 10) || (cs.fontWeight === 'bold' ? BOLD_WEIGHT : 400)
        const large = size >= LARGE_TEXT_PX || (size >= LARGE_BOLD_TEXT_PX && weight >= BOLD_WEIGHT)
        const needed = large ? 3 : 4.5
        const r = ratio(fg, bg)
        if (r < needed) {
          failures.push({
            target: [selectorFor(text)],
            any: [{ data: { fgColor: hex(fg), bgColor: hex(bg), contrastRatio: r.toFixed(2), expectedContrastRatio: `${needed}:1` } }],
          })
        }
      }
      return failures
    },
    { LARGE_TEXT_PX, LARGE_BOLD_TEXT_PX, BOLD_WEIGHT }
  )
}

function describeNode(node) {
  const data = node.any?.[0]?.data ?? {}
  const where = node.target?.join(' ') ?? '?'
  const ratio = data.contrastRatio ? `${data.contrastRatio}:1` : 'n/a'
  const needed = data.expectedContrastRatio ?? ''
  return `  ${where}\n    fg ${data.fgColor ?? '?'} on bg ${data.bgColor ?? '?'} = ${ratio} (needs ${needed})`
}

async function violationsOn(page) {
  await page.waitForTimeout(SETTLE_MS)
  const results = await runAxe(page)
  const svgText = await runSvgTextCheck(page)
  return [...results.violations.flatMap((v) => v.nodes), ...svgText]
}

function report(label, nodes, allowed = 0) {
  if (nodes.length <= allowed) {
    const note = allowed > 0 ? ` (${nodes.length} legacy, baseline ${allowed})` : ''
    console.log(`ok    ${label}${note}`)
    return 0
  }
  console.log(`FAIL  ${label} (${nodes.length}${allowed ? `, baseline ${allowed}` : ''})`)
  for (const n of nodes) console.log(describeNode(n))
  return nodes.length - allowed
}

async function checkPage(page, label) {
  return report(label, await violationsOn(page))
}

async function setTheme(page, theme) {
  await page.addInitScript((t) => {
    localStorage.setItem('contextflow.theme', t)
    localStorage.setItem('contextflow.showIssueLabels', 'true')
    localStorage.setItem('contextflow.showTeamLabels', 'true')
  }, theme)
}

async function openSampleProject(page) {
  const card = page.getByRole('button', { name: /ACME/ }).first()
  await card.waitFor({ timeout: 15000 })
  await card.click()
  await page.locator('.react-flow__pane').waitFor({ timeout: 15000 })
}

async function checkApp(browser, baseUrl) {
  let failures = 0
  for (const theme of THEMES) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme })
    const page = await context.newPage()
    await setTheme(page, theme)
    await page.goto(baseUrl)
    failures += await checkPage(page, `app ${theme}: project list`)
    await openSampleProject(page)
    failures += await checkPage(page, `app ${theme}: getting started guide`)
    await page.getByRole('button', { name: 'Close getting started guide' }).click()
    for (const tab of VIEW_TABS) {
      await page.getByRole('button', { name: tab, exact: true }).click()
      failures += await checkPage(page, `app ${theme}: ${tab} view`)
    }
    await context.close()
  }
  return failures
}

function readBaseline() {
  if (!existsSync(BASELINE_PATH)) return {}
  return JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
}

function baselineKey(theme, file) {
  return `${theme}:${file}`
}

async function checkMockups(browser) {
  if (!existsSync(MOCKUPS_DIR)) return 0
  const files = readdirSync(MOCKUPS_DIR).filter((f) => f.endsWith('.html')).sort()
  const baseline = readBaseline()
  const observed = {}
  let failures = 0
  for (const theme of THEMES) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme })
    const page = await context.newPage()
    for (const file of files) {
      await page.goto(pathToFileURL(join(MOCKUPS_DIR, file)).href)
      const key = baselineKey(theme, file)
      const nodes = await violationsOn(page)
      observed[key] = nodes.length
      failures += report(`mockup ${theme}: ${file}`, nodes, baseline[key] ?? 0)
    }
    await context.close()
  }
  if (updateBaseline) {
    const next = Object.fromEntries(Object.entries(observed).filter(([, n]) => n > 0).sort())
    writeFileSync(BASELINE_PATH, JSON.stringify(next, null, 2) + '\n')
    console.log(`baseline written: ${Object.keys(next).length} legacy mockup entries`)
  } else {
    const improved = Object.entries(baseline).filter(([k, n]) => (observed[k] ?? 0) < n)
    if (improved.length) {
      console.log(`\n${improved.length} baseline entries improved; run with --update-baseline to lock them in.`)
    }
  }
  return failures
}

function startPreview() {
  if (!existsSync(join(ROOT, 'dist', 'index.html'))) {
    console.error('dist/index.html not found. Run `npm run build` first, or pass --url.')
    process.exit(2)
  }
  const child = spawn('npx', ['vite', 'preview', '--port', String(PREVIEW_PORT), '--strictPort'], {
    cwd: ROOT,
    stdio: 'ignore',
  })
  return child
}

async function waitForServer(url, attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(`Server at ${url} did not start`)
}

async function main() {
  const browser = await chromium.launch()
  let preview = null
  let failures = 0
  try {
    if (runApp) {
      let baseUrl = urlArg
      if (!baseUrl) {
        preview = startPreview()
        await waitForServer(PREVIEW_URL)
        baseUrl = PREVIEW_URL
      }
      failures += await checkApp(browser, baseUrl)
    }
    if (runMockups) failures += await checkMockups(browser)
  } finally {
    await browser.close()
    if (preview) preview.kill()
  }
  if (updateBaseline) return
  if (failures > 0) {
    console.error(`\n${failures} color-contrast violation(s). WCAG AA is a quality gate in this project.`)
    process.exit(1)
  }
  console.log('\nAll checked surfaces meet WCAG AA contrast.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
