# ContextFlow Licensing Decision

Status: **Decided. A lawyer reviews the wording once before the switch ships.**
Last updated: 2026-11-14
Owner: Paul Rayner

This page records how ContextFlow moves from a free MIT project to a licensed product, and why. The license text itself ships in `LICENSE` with the release that makes the switch.

## The decision

ContextFlow adopts the **Business Source License 1.1 (BSL) with free use for most people**. This is the model EventCatalog adopted with its version 5 in October 2026.

1. ContextFlow (the app and the collaboration worker) moves from MIT to BSL 1.1 at the next release. Releases up to and including 0.12.1 stay MIT, and a `NOTICE` file keeps that text.
2. Everyone gets every feature. There is no cut-down free edition and no paid-only module. Who pays depends on who you are, not on which features you use.
3. ContextFlow is free for individuals, for organisations below the size limits, for documenting public open source projects, and for teaching. The one condition is that you do not host it as a service for other people.
4. Organisations above the size limits pay for a license to use it in production.
5. Four years after each release, that release becomes MIT. (In BSL terms: change date four years, change license MIT.)
6. Self-hosted licensing comes first. The hosted instance at contextflow.virtualgenius.com is for trying the tool, for teaching, and for organisations that qualify for free use. A paid hosted plan is a later decision.

### Who qualifies for free use

An organisation qualifies when its annual revenue is under USD 10 million and the total funding it has raised is under USD 10 million. "Organisation" means the top-most company that controls (owns more than half of) every entity using the software, so a subsidiary counts together with its parent.

Ten million is a line developers already recognise. Docker Desktop uses the same figure, and EventCatalog put it into a BSL license. For ContextFlow it also matches who the buyer is: an organisation under that size rarely has many teams to integrate, so the people who have the problem pay and everyone else uses it free.

### Hosting it for other people

Free use does not include running ContextFlow as a hosted service for people outside your organisation. (The license calls this a "Hosted Offering".) Two situations are explicitly fine:

- Running ContextFlow for your own employees and contractors, including across subsidiaries. That is internal use.
- A consultancy using ContextFlow to facilitate work that a client will use internally. Consultants are a core part of the ContextFlow community, so this is spelled out rather than left to interpretation.

### The hosted instance

contextflow.virtualgenius.com has its own terms of use that match the license:

- Anyone can use it to evaluate the tool. It is free for teaching and workshops, and free for real work by organisations that qualify for free use, with no support or guarantees.
- Organisations above the size limits can use it for an evaluation period. Using it in production above the limits needs a paid license and, for now, a self-hosted install.

### What stays MIT

Pieces that other tools build against stay MIT, the way EventCatalog keeps its SDK and CLI under MIT:

- the export manifest schema and any published interchange formats
- the example projects
- any future CLI, SDK, or MCP server package

## Plans

| Plan | Who | What you get |
|------|-----|--------------|
| Community | Individuals, organisations under the size limits, open source documentation, teaching | Every feature, a free license key (you confirm you qualify, no proof needed), no support |
| Business | Organisations above the size limits | The right to use it in production, email support, standard terms |
| Enterprise | Organisations that need more than standard terms | A contract, help with SSO and self-hosted deployment, custom terms |

Prices are set outside this document and go on the pricing page when ready. Every organisation can evaluate before buying.

## Why this and not the alternatives

- **Open core (the earlier draft).** Keep the core MIT and sell a separate paid module. Dropped because it means deciding forever which features are paid, maintaining two codebases, and because EventCatalog, the closest comparable project, moved away from it in October 2026 for the same reasons.
- **Functional Source License.** Allows every use except building a competing product or service. It stops clones but creates no reason to pay, so a large company could self-host free forever. The wrong lever for a product whose buyer is a large company.
- **Copyleft licenses such as RPL.** These put pressure on companies that build ContextFlow's code into their own products. Companies use ContextFlow; they do not embed it. So copyleft gives little commercial leverage here.

BSL with free use keeps the tool free for the people who spread it, charges the organisations that can pay, needs one codebase, and sets a date on which every version becomes open source.

## Contributions

Code contributed to ContextFlow is licensed under MIT, which `CONTRIBUTING.md` already says. Because a contribution is MIT, it can ship inside a BSL release, be covered by a paid license, and become MIT with the rest of the release four years later, with the contributor's notice kept. MariaDB MaxScale runs BSL on the same arrangement, asking each contributor to paste one sentence into their pull request. When the switch ships, the pull request template gets one checkbox saying the same thing.

There is no Contributor License Agreement and no Developer Certificate of Origin. Both were considered and are more process than a project with one outside contributor needs.

The code today has one outside commit on `main`. It is MIT and stays MIT. Nobody else's permission is needed to change the license.

## Next steps, in order

- [ ] A lawyer reads the free-use terms once (size limits, the definition of organisation, the hosting rules, the consultant case) and the hosted instance's terms of use.
- [ ] `LICENSE` (BSL 1.1 with the terms above), `NOTICE` (MIT text for releases through 0.12.1), README badge, and a plain-English licensing page in `docs/`.
- [ ] One checkbox in the pull request template confirming the contribution is MIT.
- [ ] A license key field in Settings that records organisation and key, with no enforcement, and a form on the website that issues Community keys.
- [ ] Terms of use for the hosted instance.
- [ ] Pricing page, once prices are set.
- [ ] Ship the switch in one release with a changelog entry, before the first trial license goes out, so partners receive BSL terms from the start.

## Sources

The earlier options review (open core, RPL, FSL, with comparison tables) is kept privately as history. It predates EventCatalog's move to BSL.

External:
- EventCatalog license (BSL 1.1 with free use): https://github.com/event-catalog/eventcatalog/blob/main/LICENSE
- EventCatalog pricing: https://www.eventcatalog.dev/pricing
- Business Source License 1.1: https://mariadb.com/bsl11/
- MariaDB MaxScale contribution terms: https://github.com/mariadb-corporation/MaxScale/blob/develop/CONTRIBUTING.md
- Particular Small Business Program (definition of organisation, graduated discounts): https://github.com/Particular/SmallBusinessProgram
- Functional Source License, for comparison: https://fsl.software/
