import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { RepoCard } from '../ContextRepoCard'

const here = dirname(fileURLToPath(import.meta.url))
const APP_TSX_PATH = join(here, '../../../App.tsx')

const baseRepo = {
  id: 'repo-1',
  name: 'orders-service',
  teamIds: [],
  contributors: [],
  remoteUrl: 'https://github.com/example/orders-service-with-a-fairly-long-name',
}

const baseProject = {
  id: 'proj-1',
  teams: [],
  people: [],
}

describe('RepoCard scroll-safety in the inspector', () => {
  it('does not wrap its expanded content in an overflow-restricting container', () => {
    const onToggle = vi.fn()
    const { container } = render(
      <RepoCard
        repo={baseRepo}
        project={baseProject}
        useAPI={false}
        expandedTeamId={null}
        expandedRepoId={baseRepo.id}
        onToggleTeam={vi.fn()}
        onToggleRepo={onToggle}
        onUnassign={vi.fn()}
      />
    )

    const expandedNodes = container.querySelectorAll('div, a, span, ul')
    expandedNodes.forEach((node) => {
      const className = (node as HTMLElement).className || ''
      const classes = typeof className === 'string' ? className.split(/\s+/) : []
      expect(classes).not.toContain('overflow-hidden')
      expect(classes).not.toContain('overflow-y-auto')
      expect(classes).not.toContain('overflow-y-scroll')
      expect(classes).not.toContain('overflow-auto')
      expect(classes).not.toContain('overflow-scroll')
    })
  })

  it('does not attach wheel handlers that could swallow scroll events', () => {
    const onToggle = vi.fn()
    const onWheelSpy = vi.fn()
    const { container } = render(
      <div onWheel={onWheelSpy}>
        <RepoCard
          repo={baseRepo}
          project={baseProject}
          useAPI={false}
          expandedTeamId={null}
          expandedRepoId={baseRepo.id}
          onToggleTeam={vi.fn()}
          onToggleRepo={onToggle}
          onUnassign={vi.fn()}
        />
      </div>
    )

    const expanded = container.querySelector('a[href]')
    expect(expanded).not.toBeNull()

    fireEvent.wheel(expanded as Element, { deltaY: 100, bubbles: true })
    expect(onWheelSpy).toHaveBeenCalled()
  })

  it('App right-sidebar aside has a min-h-0 scroll container so grid items can shrink', () => {
    const source = readFileSync(APP_TSX_PATH, 'utf8')
    const asideMatch = source.match(
      /<aside[^>]*border-l[^>]*>[\s\S]*?<InspectorPanel\s*\/>[\s\S]*?<\/aside>/
    )
    expect(asideMatch, 'right-sidebar aside not found in App.tsx').not.toBeNull()
    const asideBlock = asideMatch![0]
    expect(asideBlock).toMatch(/overflow-y-auto/)
    expect(asideBlock).toMatch(/min-h-0/)
  })

  it('expanding a repo card keeps the URL truncatable in a 320px-wide inspector', () => {
    render(
      <div style={{ width: 320 }}>
        <RepoCard
          repo={baseRepo}
          project={baseProject}
          useAPI={false}
          expandedTeamId={null}
          expandedRepoId={baseRepo.id}
          onToggleTeam={vi.fn()}
          onToggleRepo={vi.fn()}
          onUnassign={vi.fn()}
        />
      </div>
    )

    const span = screen.getByText(baseRepo.remoteUrl)
    const flexParent = span.parentElement as HTMLElement
    expect(flexParent.className).toMatch(/flex/)
    expect(span.className).toMatch(/min-w-0/)
  })
})
