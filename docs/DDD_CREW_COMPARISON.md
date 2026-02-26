# DDD Crew Resources: Comparison with ContextFlow

Research comparing [ddd-crew/bounded-context-canvas](https://github.com/ddd-crew/bounded-context-canvas) and [ddd-crew/context-mapping](https://github.com/ddd-crew/context-mapping) against ContextFlow's current capabilities. Goal: identify gaps, opportunities, and what we can learn.

## License Summary

Both repos use **CC BY-SA 4.0** (Creative Commons Attribution-ShareAlike 4.0).

- We can freely use their ideas, concepts, terminology, and patterns in ContextFlow.
- DDD pattern names and concepts (from Eric Evans, etc.) are not copyrightable.
- If we embed their exact text verbatim (descriptions, definitions), we must provide attribution and any redistributed content must remain CC BY-SA 4.0.
- Building a software tool inspired by their structure is not "adapted material" under copyright law; ideas are not copyrightable, only expression is.
- **Safe approach**: Use our own descriptions. Reference/credit the DDD Crew repos. ContextFlow's README already credits the Bounded Context Canvas, Nick Tune's Core Domain Charts, and other DDD Crew resources in its references section.

## Bounded Context Canvas (V5) Comparison

The canvas is a single-context deep-dive worksheet with 11 sections. It is designed for zooming into one bounded context at a time, while ContextFlow is designed for the landscape view (all contexts and their relationships).

### What ContextFlow Already Covers

| Canvas Section | ContextFlow Equivalent | Notes |
|---|---|---|
| Name | `name` field | Identical |
| Purpose | `purpose` field | Identical intent |
| Strategic Classification (domain) | `strategicClassification`: core/supporting/generic | Identical |
| Evolution Stage | `evolutionStage`: genesis/custom-built/product/commodity | Identical, uses Wardley stages |
| Domain Roles | -- | Not supported (see gaps below) |
| Inbound Communication | -- | Not supported |
| Outbound Communication | -- | Not supported |
| Ubiquitous Language | -- | Not supported |
| Business Decisions | -- | Not supported |
| Assumptions | -- | Partially covered by `notes` field |
| Verification Metrics | -- | Not supported |
| Open Questions | -- | Partially covered by Issues (info severity) |

ContextFlow also has properties the canvas does not:
- `ownership` (ours/internal/external) with visual encoding
- `boundaryIntegrity` (strong/moderate/weak) with border styling
- `codeSize` with node sizing
- `isLegacy` flag with visual badge
- Issues/hotspots with severity levels
- Team assignment
- Repository assignment
- Multi-view positioning (flow, strategic, distillation)
- Temporal evolution (keyframes showing change over time)

### Gaps Worth Considering

**High value, good fit for ContextFlow:**

1. **Business Model Role** (revenue generator, engagement creator, compliance enforcer, cost reduction)
   - Adds a dimension beyond core/supporting/generic that captures *how* a context contributes to the business.
   - Could be a dropdown in the Inspector alongside strategic classification.
   - Useful for investment prioritization discussions.

2. **Domain Roles / Model Traits** (15 archetypes from Alberto Brandolini)
   - Specification/Draft, Execution, Analysis/Audit, Approver, Enforcer, Gateway, Interchange, Bubble, Funnel, Engagement, etc.
   - Characterizes what a context *does* behaviorally, not just what it *is* strategically.
   - Could be a multi-select or tag field in the Inspector.
   - Brandolini is a close collaborator; this aligns well with ContextFlow's DDD positioning.

3. **Ubiquitous Language** (key terms and definitions per context)
   - This is central to DDD. Each context defines its own vocabulary.
   - Could be a simple key-value list in the Inspector (term -> definition).
   - Enables the "same word, different meaning in different contexts" insight that drives boundary decisions.

**Medium value, worth tracking:**

4. **Assumptions** (explicit design uncertainties)
   - Currently partially served by the `notes` field or info-severity issues.
   - A dedicated section could make uncertainty more visible and structured.
   - V5 of the canvas added this specifically to emphasize iterative design.

5. **Open Questions** (unresolved items)
   - Similar to assumptions. Currently served by info-severity issues.
   - Could be a distinct issue type rather than a separate section.

**Lower priority / different tool:**

6. **Inbound/Outbound Communication** (commands, queries, events per collaborator)
   - This is the most detailed section of the canvas and the hardest to map to ContextFlow.
   - ContextFlow models relationships *between* contexts; the canvas models the *messages* flowing through those relationships.
   - This level of detail is more appropriate for a per-context deep-dive tool (the canvas itself) than a landscape map.
   - A possible future integration: "open canvas for this context" that shows inbound/outbound detail.

7. **Business Decisions** (rules, policies)
   - Very context-specific detail. Better suited to documentation or a linked wiki than the mapping canvas.

8. **Verification Metrics** (measurable indicators)
   - Interesting for CI/CD integration but outside ContextFlow's current scope.

## Context Mapping Comparison

### What ContextFlow Already Covers

| Pattern | ContextFlow Support | Notes |
|---|---|---|
| Customer/Supplier | `customer-supplier` | Supported |
| Conformist | `conformist` | Supported |
| Anti-Corruption Layer | `anti-corruption-layer` | Supported |
| Open-host Service | `open-host-service` | Supported |
| Published Language | `published-language` | Supported |
| Shared Kernel | `shared-kernel` | Supported |
| Partnership | `partnership` | Supported |
| Separate Ways | `separate-ways` | Supported |
| Big Ball of Mud | -- | Not a relationship pattern (see below) |

ContextFlow covers **all 8 integration patterns**. The only missing item is Big Ball of Mud, which is not really a pattern between two contexts; it is a quality demarcation on a single system. It could be represented as an issue/hotspot or a flag on a context.

### Team Relationships

The context-mapping repo defines three team relationship types:
- **Mutually Dependent** - close reciprocal links requiring frequent coordination
- **Upstream/Downstream** - unidirectional influence
- **Free** - no organizational or technical link

ContextFlow currently infers these from the relationship pattern (partnership and shared-kernel imply mutual dependency; most others imply upstream/downstream; separate-ways implies free). Making these explicit as a first-class property on relationships could add clarity, but may also add redundant complexity since the pattern already implies the team dynamic.

### Guidance on Multiple Context Maps

The context-mapping repo recommends creating multiple small, focused maps rather than one comprehensive map. Each map answers a specific question:
- How does a model propagate through the landscape?
- What influence does a team have on others?
- How are organizational politics playing out?

This aligns with ContextFlow's multi-view approach (flow, strategic, distillation), where each view answers a different question about the same underlying model. This is a strength to emphasize in positioning.

## Opportunities Summary

### Quick wins (small effort, clear value)

1. **Add `businessModelRole` field** to BoundedContext: revenue-generator, engagement-creator, compliance-enforcer, cost-reduction. Simple dropdown in Inspector.

2. **Add Big Ball of Mud as context flag/issue**: Rather than a relationship pattern, add a "Big Ball of Mud" badge or critical-severity issue preset that marks a context as having mixed models and inconsistent boundaries.

### Medium-term enhancements

3. **Domain Roles / Model Traits**: Add a multi-select field for Brandolini's archetypes. Useful for workshop discussions about what each context *does*.

4. **Ubiquitous Language per context**: Key-value list in Inspector. Core DDD concept, unique differentiator for a tool.

### Positioning insights

5. **ContextFlow fills the landscape gap**: The Bounded Context Canvas is a single-context deep-dive; Context Mapping repos provide static templates. ContextFlow is the only interactive, real-time collaborative tool that operates at the landscape level with multiple integrated views. This is a clear differentiator.

6. **Potential "Canvas mode"**: A future feature could offer a per-context deep-dive view (inspired by the canvas) that shows all detail for one selected context, including inbound/outbound communication. This would complement the landscape views.

7. **Credit and community**: Referencing the DDD Crew resources (with proper attribution) in ContextFlow's help/educational content would strengthen credibility and connect to the existing DDD practitioner community. Nick Tune, Michael Plod, and Kenny Baas are active community members.

## References

- [Bounded Context Canvas repo](https://github.com/ddd-crew/bounded-context-canvas) (CC BY-SA 4.0)
- [Context Mapping repo](https://github.com/ddd-crew/context-mapping) (CC BY-SA 4.0)
- [Eric Evans DDD Reference](https://www.domainlanguage.com/ddd/reference/)
- [Alberto Brandolini's Bounded Context Archetypes](https://medium.com/@cyrillemartraire) (via Cyrille Martraire)
- [Nick Tune's Core Domain Charts](https://github.com/ddd-crew/core-domain-charts)
- [Context Mapper DSL](https://contextmapper.org/)
