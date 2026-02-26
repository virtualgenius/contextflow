# ContextFlow: Data Privacy and Security for Enterprise Customers

**Created:** 2026-02-26
**Status:** Living document
**Purpose:** Answer "how does this work with security?" for enterprise prospects

---

## The Short Answer

ContextFlow is a browser-based tool. Your architecture data syncs through Cloudflare's infrastructure when you use collaboration. There is no authentication yet (link-sharing only), so it is not currently suitable for regulated or highly sensitive data. For those scenarios, export as JSON and share files directly.

This doc covers what exists today, what's planned, and how to communicate ContextFlow's security posture.

---

## How Data Flows Today

### Local (no sharing)

When you use ContextFlow without sharing:
- All project data stays in your browser's IndexedDB
- Nothing is transmitted to any server
- No account, no login, no telemetry (unless opted in on the hosted demo)
- Fully offline-capable

### Shared / Collaborative

When you share a project via URL:
- Project data syncs to a **Cloudflare Durable Object** (edge compute + SQLite storage)
- Communication uses **WebSocket over TLS** (WSS)
- Data is **encrypted at rest** by Cloudflare (Cloudflare-managed keys)
- The collaboration server is a thin relay; it stores the Yjs document state and forwards sync updates between connected clients
- **Anyone with the project URL can view and edit** (no authentication currently)
- URLs use high-entropy IDs (62^8 character space) to prevent enumeration

### Analytics (hosted demo only)

- PostHog analytics on `contextflow.virtualgenius.com` only
- Disabled by default on self-hosted instances
- Privacy-first config: no cookies, no IP collection, no URL tracking, session-scoped anonymous IDs
- Users can opt out via Settings

---

## What Data Does ContextFlow Store?

Architecture metadata only. Specifically:
- Bounded context names, purposes, classifications
- Relationship patterns between contexts
- Team names and assignments
- Repository names and URLs (if entered)
- People names and email addresses (if entered for contributor mapping)
- Group labels and notes
- Canvas positions

**Not stored:** source code, credentials, API keys, customer PII, financial data. The tool models your architecture at a whiteboard level; it does not connect to or analyze your actual systems (unless you opt into the CodeCohesion API for contributor stats, which only processes public git metadata).

---

## Enterprise Readiness: Current State

| Capability | Status | Notes |
|-----------|--------|-------|
| TLS in transit | Yes | HTTPS/WSS enforced by Cloudflare |
| Encryption at rest | Yes | Cloudflare-managed keys |
| Authentication | Not yet | Link-sharing only (anyone with URL can edit) |
| Access control / RBAC | Not yet | Planned |
| SSO / SAML | Not yet | Planned (Clerk or WorkOS) |
| Audit logging | Not yet | Planned |
| Self-hosting | Partial | App is open-source; collab worker can be deployed to your own Cloudflare account |
| Data residency | Cloudflare edge | No region pinning yet; Cloudflare routes to nearest edge |
| SOC 2 | No | Will pursue when enterprise demand justifies (~$15-30k investment) |
| GDPR | Partial | No PII collection in analytics; no DPA in place yet |
| Data export | Yes | Full JSON export of any project at any time |
| Data deletion | Yes | User can delete projects; server data removed when project is deleted |

---

## Self-Hosting Option

ContextFlow can be self-hosted today:

1. **Frontend**: Static site (Vite build). Deploy to any CDN, internal server, or Cloudflare Pages on your own account.
2. **Collaboration server**: Cloudflare Worker with Durable Objects. Deploy to your own Cloudflare account using `wrangler deploy`. Your data stays in your Cloudflare account.
3. **No shared infrastructure**: Self-hosted instances are completely isolated. No data flows to Virtual Genius.

The build requires setting `VITE_COLLAB_HOST` to point to your own worker. Everything else works out of the box.

**What self-hosting gives you:**
- Data stays in your Cloudflare account (your billing, your access controls)
- Cloudflare's enterprise compliance (SOC 2 Type II, ISO 27001, GDPR) applies to your infrastructure
- You control retention, deletion, and access
- No dependency on Virtual Genius for uptime

**What self-hosting does not give you (yet):**
- Authentication on project URLs (still link-based)
- Per-user access control
- Audit trails

---

## Frequently Asked Questions

### Is this secure enough for our architecture data?

ContextFlow syncs through Cloudflare's infrastructure, encrypted in transit and at rest. Sharing is currently link-based without authentication, so we recommend it for workshop collaboration and team design sessions rather than regulated data. For sensitive contexts, you can self-host on your own Cloudflare account, which gives you full control over where data lives. Authentication and access control are on the roadmap.

### Can we run this internally?

Yes. ContextFlow is open-source. You can deploy the frontend to any internal server and the collaboration worker to your own Cloudflare account. Your data never touches Virtual Genius infrastructure.

### What about SOC 2, HIPAA, or other compliance frameworks?

ContextFlow does not have its own SOC 2 certification yet. If you self-host on Cloudflare, their SOC 2 Type II and ISO 27001 certifications cover the infrastructure layer. For the application layer, the codebase is open-source and auditable, so your security team can review it directly.

### Can my team collaborate without running the CLI?

Yes. Share a project URL and your team opens it in their browser. No CLI, no install, no accounts. Real-time collaboration works like Google Docs: everyone sees changes instantly. You can also export/import JSON for offline backups.

---

## Licensing

ContextFlow is currently free for all users, including enterprise teams. Commercial licensing with tiered plans (Free, Pro, Team, Enterprise) is planned. Early adopters who start using ContextFlow now will benefit from shaping the product before paid tiers take effect. See [SAAS_MONETIZATION_STRATEGY.md](SAAS_MONETIZATION_STRATEGY.md) for details on planned pricing and tiers.

---

## Roadmap to Enterprise-Ready

In priority order (from SAAS_MONETIZATION_STRATEGY.md):

1. **Authentication** (Clerk or WorkOS) - user accounts, project ownership
2. **Access control** - viewer/editor roles per project
3. **SSO/SAML** - enterprise identity provider integration
4. **Audit logging** - who changed what, when
5. **Data residency** - region-pinned Cloudflare Durable Objects
6. **SOC 2 Type II** - when enterprise revenue justifies the investment

---

## Related Docs

- [CLOUD_SYNC_PLAN.md](CLOUD_SYNC_PLAN.md) - Technical design for collaboration, including risk assessment (Appendix D)
- [SAAS_MONETIZATION_STRATEGY.md](SAAS_MONETIZATION_STRATEGY.md) - Enterprise features research, pricing tiers
- [FOUNDING_PARTNERS_PLAN.md](FOUNDING_PARTNERS_PLAN.md) - Early customer validation approach
- [VISION.md](VISION.md) - Product positioning and collaboration philosophy
