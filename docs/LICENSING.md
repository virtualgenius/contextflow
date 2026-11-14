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

An organisation qualifies when its annual revenue is under USD 10 million and the total funding it has raised is under USD 10 million.

- **Revenue** is the whole group's gross revenue for its last completed financial year, from consolidated accounts where they exist. A company with no completed year uses its projected first-year figure. Other currencies convert at that year's average rate.
- **Funding** is all outside equity investment taken since the organisation was formed, including convertible notes and SAFEs, at the amounts invested. Revenue, grants, and loans do not count, so a bootstrapped or grant-funded company has zero funding for this test.
- **Non-profits, charities, and public bodies** use the greater of their total income (including grants and donations) and their annual budget in place of revenue.
- **Organisation** means the whole group: every company that controls you, that you control, or that is under common control with you, at more than half the voting power. A subsidiary counts together with its parent. Two exceptions, taken from EventCatalog: a government ministry, agency, or local authority counts on its own, not as "the government"; and companies owned by the same investment fund are not one group unless the fund consolidates them in its accounts.

Ten million is a line developers already recognise. Docker Desktop has used it since 2021, CockroachDB since 2024, and EventCatalog put it into a BSL license in 2026. For ContextFlow it also matches who the buyer is: an organisation under that size rarely has many teams to integrate, so the people who have the problem pay and everyone else uses it free.

### What counts as production use

Production use is any use other than trying the tool with sample or throwaway content that nobody relies on, or developing and contributing to ContextFlow itself. Once a map of your real systems exists and anyone, including an automated system or an AI agent, looks at it or relies on it, that is production use, whatever the project is called: pilot, proof of concept, sandbox, or internal. This is EventCatalog's definition, and it is what gives "we are only evaluating" a clear edge.

### Evaluation, grace, and honest mistakes

- **Evaluation.** Every organisation, including its whole group, gets one 60-day evaluation of the full product, starting from its first production use of any BSL release. Upgrading, reinstalling, or creating another map does not restart it. Longer evaluations can be agreed in writing.
- **Growing past the limits.** An organisation that crosses a threshold keeps its free use for 90 days, starting from the end of the financial year in which revenue reached USD 10 million, the date funding reached USD 10 million, or the date an acquisition or merger took the group over either line. After that it has 30 more days to buy a license or stop.
- **Honest mistakes.** Anyone who discovers, or is told, that their use needs a license has 30 days to buy one or stop, and their past use is treated as permitted if they did not know and had no reason to know. This does not apply to someone who offered ContextFlow as a hosted service to others, or who had already been reminded in the product.
- **Nothing breaks.** Maps and installs keep working when an evaluation or grace period ends. Reminders appear in the product. There is no throttling and no kill switch.

### Hosting it for other people

Free use does not include running ContextFlow as a hosted, managed, or multi-tenant service that gives people outside your organisation access to it, whether or not you charge. (The license calls this a "Hosted Offering".) These situations are explicitly fine:

- Running ContextFlow for your own employees and contractors, including across subsidiaries. People in your own organisation are not third parties.
- Publishing a map of your own systems so that customers, partners, or the public can see it.
- Hosting ContextFlow for one specific client as part of services you provide to that client, where the maps describe that client's systems and you do not offer hosting as a standard self-service product.
- Hosting maps of public open source projects without charge.

### Working for clients

Consultants, contractors, agencies, and software vendors are a core part of the ContextFlow community, so this case is spelled out rather than left to interpretation.

- When you use ContextFlow for a client's benefit, whether you build the map, facilitate the workshop, host it, or hand it over, your use for that client is covered if the client qualifies for free use or holds a paid license. The client's size decides, not yours.
- You may rely on the client's written statement of its status unless you know it is wrong.
- Your own use of ContextFlow for your own systems is judged on your own size.
- If you own what you build (you are a software vendor rather than a service provider), your own size counts, following Particular Software's small business program.

### Your maps are yours

The content of a map (contexts, relationships, teams, repositories, notes, and everything else you create) belongs to you and is not part of the licensed work. The license covers the software, not what you make with it.

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

- [ ] A lawyer reads the free-use terms once (size limits, the definition of organisation, production use, evaluation and grace periods, the hosting rules, the client case, ownership of maps) and the hosted instance's terms of use.
- [ ] A plain-English license FAQ, published alongside the license, with a line in the license saying the FAQ is guidance only and the license text wins if they differ.
- [ ] `LICENSE` (BSL 1.1 with the terms above), `NOTICE` (MIT text for releases through 0.12.1), README badge, and a plain-English licensing page in `docs/`.
- [ ] One checkbox in the pull request template confirming the contribution is MIT.
- [ ] A license key field in Settings that records organisation and key, with no enforcement, and a form on the website that issues Community keys.
- [ ] Terms of use for the hosted instance.
- [ ] Pricing page, once prices are set.
- [ ] Ship the switch in one release with a changelog entry, before the first trial license goes out, so partners receive BSL terms from the start.

## Sources

The earlier options review (open core, RPL, FSL, with comparison tables) is kept privately as history. It predates EventCatalog's move to BSL. A comparison of free-use terms across fourteen source-available products (EventCatalog, CockroachDB, Docker, Directus, Akka, Particular, MaxScale, Outline, Redpanda, Couchbase, HashiCorp, Elastic, n8n, Sentry), read from the live license texts on 2026-11-14, informed the definitions above and is also kept privately.

External:
- EventCatalog license (BSL 1.1 with free use): https://github.com/event-catalog/eventcatalog/blob/main/LICENSE
- EventCatalog license FAQ: https://www.eventcatalog.dev/license-faq
- EventCatalog pricing: https://www.eventcatalog.dev/pricing
- CockroachDB licensing FAQ (free under USD 10M revenue, whole group): https://www.cockroachlabs.com/docs/stable/licensing-faqs
- Docker Subscription Service Agreement (under 250 employees and USD 10M revenue): https://www.docker.com/legal/docker-subscription-service-agreement/
- Outline license (hosted-service definition): https://github.com/outline/outline/blob/main/LICENSE
- Business Source License 1.1: https://mariadb.com/bsl11/
- MariaDB MaxScale contribution terms: https://github.com/mariadb-corporation/MaxScale/blob/develop/CONTRIBUTING.md
- Particular Small Business Program (definition of organisation, graduated discounts): https://github.com/Particular/SmallBusinessProgram
- Functional Source License, for comparison: https://fsl.software/
