# ContextFlow Roadmap

ContextFlow is a modeling tool for sociotechnical architecture. This page says where it is going and in what order. It lists themes, not dates. Each theme links to the GitHub issues that make it concrete; the issues are where ideas are discussed, and reactions and comments there help decide what comes next.

See [VISION.md](VISION.md) for who the tool is for and why, and [CHANGELOG.md](../CHANGELOG.md) for what has shipped.

## How work is tracked

- **Themes** live here, in priority order.
- **Ideas and feature requests** are [GitHub issues](https://github.com/virtualgenius/contextflow/issues), one per item, labeled with a `theme:` label. Open a new issue for anything you would like to see.
- **Work in progress** for the next release or two is tracked with [bd](https://github.com/steveyegge/beads) in `.beads/`, which points back at the relevant issue. See [AGENTS.md](../AGENTS.md).
- **Done** work moves to the changelog.

## Themes, in order

### 1. Run it where your data is allowed to be

Architecture maps describe what an organization is building and how its teams are arranged. Many organizations cannot put that in a third-party cloud. ContextFlow should install cleanly on your own infrastructure, work entirely offline when needed, and come with documentation an infosec reviewer can read.

[`theme: self-hosting`](https://github.com/virtualgenius/contextflow/issues?q=is%3Aissue+is%3Aopen+label%3A%22theme%3A+self-hosting%22): documented and tested install with a container option (#48), quickstart and learning resources (#49). Local-only projects that never touch the network and view-only share links are in progress.

### 2. Share and work together

A workspace holds many maps under one link, so a class or a team sees all its maps in one place. Inside a map, you can see who else is there and where they are pointing. Maps export as images for slides and documents.

[`theme: sharing`](https://github.com/virtualgenius/contextflow/issues?q=is%3Aissue+is%3Aopen+label%3A%22theme%3A+sharing%22): workspaces (#44), named presence and live cursors (#52), embeddable mode and facilitator dashboard (#53).

### 3. What lives inside a context

The landscape views answer how contexts relate. A context also needs its own page: key terms and business rules, capabilities and responsibilities, the role its model plays, which repository paths implement it. From there you can explore splitting a context that has grown too broad.

[`theme: context-detail`](https://github.com/virtualgenius/contextflow/issues?q=is%3Aissue+is%3Aopen+label%3A%22theme%3A+context-detail%22): key ubiquitous language terms and business rules (#32), context canvas view (#54), capabilities per context (#56), explore splitting a context (#57), repository subfolder per context (#58), domain roles (#55), project purpose and metadata (#59), focused map views (#36), interchange contexts and published language (#29), ACL and OHS as pattern instances (#30), relationship strength (#31).

### 4. The map as an input to coding agents

When most code is generated, the unit of context an agent needs is the bounded context: its purpose, language, relationships, repositories, and owning team. ContextFlow holds exactly that model. Serving it over the Model Context Protocol, and giving the map a text form agents can read and write, turns a diagram into a live part of the delivery system.

[`theme: agents`](https://github.com/virtualgenius/contextflow/issues?q=is%3Aissue+is%3Aopen+label%3A%22theme%3A+agents%22): MCP server (#64), Context Mapper CML import and export (#65), Wardley map DSL (#66). The export manifest (#19) is the data contract these build on.

### 5. Flow and teams

Overlay how data moves, how teams hand off, and how a change propagates on the same value stream, so you can see where flow is interrupted. Mark blockers and wait times, type value streams as external or internal, show team boundaries, and render Team Topologies interaction modes.

[`theme: flow-and-teams`](https://github.com/virtualgenius/contextflow/issues?q=is%3Aissue+is%3Aopen+label%3A%22theme%3A+flow-and-teams%22): flow overlays (#73), blockers and handoffs (#74), value stream types (#75), team boundary overlay (#76), Team Topologies interaction modes (#77), team headcount (#18), team membership (#78), coaching and guided workflows (#79), Architecture for Flow example (#84).

### 6. Insights

Once the map exists, the tool can read it: too many shared kernels, an external context consumed without an anti-corruption layer, a repository whose declared owners are not the people who commit to it. Findings link to the contexts involved and can become issues on the map.

[`theme: insights`](https://github.com/virtualgenius/contextflow/issues?q=is%3Aissue+is%3Aopen+label%3A%22theme%3A+insights%22): insights and health checks (#80), SLAs on user needs as detection input (#38), contexts spanning subdomain boundaries (#61).

### 7. Interoperability

ContextFlow stays a modeling and exploration tool. Catalogs, C4 models, EventStorming boards, domain stories, and glossaries each hold part of the picture, so the map should import from and export to them rather than duplicate them.

[`theme: integrations`](https://github.com/virtualgenius/contextflow/issues?q=is%3Aissue+is%3Aopen+label%3A%22theme%3A+integrations%22): export manifest (#19), EventStormer import (#67), EventCatalog export (#68), Contextive glossary (#69), C4 tools (#70), Domain Storytelling (#71), Event Modeling (#72).

### 8. Strategy and time

The Strategic view is a Wardley map and the temporal mode shows how the landscape moves. Both can go further: future states and named snapshots, per-view relationship visibility, and the remaining temporal milestones.

[`theme: strategy-and-time`](https://github.com/virtualgenius/contextflow/issues?q=is%3Aissue+is%3Aopen+label%3A%22theme%3A+strategy-and-time%22): future states on the Wardley map (#11), per-view relationship visibility (#14), relationship pattern transitions over time (#33), temporal evolution enhancements (#83), user goals and challenges (#60).

### 9. Enterprise

Sign-in, roles, and an audit trail, so a map an organization keeps can be governed like anything else it keeps. View-only links come first; authenticated roles and SSO follow.

[`theme: enterprise`](https://github.com/virtualgenius/contextflow/issues?q=is%3Aissue+is%3Aopen+label%3A%22theme%3A+enterprise%22): authentication and access control (#81), audit log and change history (#82).

### Always on: quality

Accessibility (#9), responsive layout (#10), test coverage (#45, #46, #47), and UX polish (#7, #62, #63, #50, #51) run alongside every theme rather than waiting for a slot.

[`theme: quality`](https://github.com/virtualgenius/contextflow/issues?q=is%3Aissue+is%3Aopen+label%3A%22theme%3A+quality%22)
