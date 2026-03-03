# DDD Context Map Relationship Patterns: Validity Matrix

This document captures the valid and invalid combinations of DDD strategic patterns on context map relationships, based on the canonical definitions from Eric Evans' [DDD Reference](https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf) (pp. 32-34) and his 2025 article on [AI Components for a Deterministic System](https://www.domainlanguage.com/articles/ai-components-deterministic-system/) (which demonstrates PL as a standalone upstream context with a Conformist downstream).

## The Two-Sided Model

Context map relationships have two independent dimensions:

1. **How does the upstream present itself?** (upstream role)
2. **How does the downstream respond?** (downstream role)

Some patterns are **standalone**: they describe the entire relationship and don't decompose into per-side roles. Others are **per-side**: the upstream and downstream are characterized independently.

## Pattern Categories

### Standalone Patterns (describe the whole relationship)

| Pattern | Description | When to use |
|---------|-------------|-------------|
| **Customer-Supplier** | The *collaborative* response to an upstream-downstream dependency. Downstream priorities factor into upstream planning. Teams negotiate and jointly develop acceptance tests. The upstream accommodates; the downstream negotiates. | When the upstream team is willing to accommodate downstream needs. The best-case U/D scenario. |
| **Partnership** | Mutual dependency; teams coordinate closely, succeed or fail together. No upstream/downstream distinction. | Mutual dependencies that can't be untangled. Teams are willing to coordinate release schedules. |
| **Shared Kernel** | Teams explicitly share a subset of the domain model with joint ownership and special change management. No upstream/downstream distinction. | Core domain concepts are truly shared between contexts. Teams can commit to coordinated changes. |

Customer-Supplier is standalone because the upstream's willingness to accommodate IS the pattern. Once the upstream stops accommodating (e.g., by publishing a fixed API for all consumers), the relationship has moved to OHS or PL with a downstream Conformist or ACL.

Partnership and Shared Kernel are symmetric: there is no upstream or downstream side.

### Per-Side Patterns (upstream and downstream characterized independently)

**Upstream roles** (how the upstream makes its model available):

| Role | Description |
|------|-------------|
| **Open Host Service (OHS)** | Upstream provides a well-defined, general-purpose protocol/API for multiple consumers. Evans: "Define a protocol that gives access to your subsystem as a set of services. Open the protocol so that all who need to integrate with you can use it." Idiosyncratic needs get one-off translators, not protocol changes. |
| **Published Language (PL)** | Upstream IS or uses a well-documented, often standardized interchange format (e.g., NAICS, iCalendar, HL7, SWIFT). In Evans' Domain Navigator example, NAICS is a bounded context that is itself a Published Language. |

**Downstream roles** (how the downstream handles the upstream's model):

| Role | Description |
|------|-------------|
| **Conformist** | The *capitulation* response. Downstream adopts the upstream model as-is, without translation. No negotiating power. Evans: downstream "slavishly adheres to the model of the upstream team." |
| **Anti-Corruption Layer (ACL)** | The *defensive* response. Downstream creates an isolating translation layer to protect its own model from upstream concepts. |

OHS and PL are mutually exclusive upstream roles (a running service vs. a published standard). Conformist and ACL are mutually exclusive downstream roles (adopt vs. translate).

### Non-Pattern

| Pattern | Description |
|---------|-------------|
| **Separate Ways** | Deliberate decision not to integrate. This is the **absence** of a relationship, not a type of relationship. Two contexts with no line between them. |

### Context-Level Property (not a relationship pattern)

| Pattern | Description |
|---------|-------------|
| **Big Ball of Mud** | Demarcation of a poor-quality system. A property of a single context, not a relationship pattern. Often implies downstream contexts should use ACL. |

## Valid Combinations

### Standalone patterns (no per-side roles)

| Pattern | Notes |
|---------|-------|
| Customer-Supplier | Upstream accommodates, downstream negotiates. Complete relationship. |
| Partnership | Symmetric. No upstream/downstream. |
| Shared Kernel | Symmetric. No upstream/downstream. |

### Per-side combinations (upstream role + downstream role)

| Upstream | Downstream | Valid? | Example |
|----------|------------|--------|---------|
| OHS | Conformist | Yes | Downstream adopts a general API as-is |
| OHS | ACL | Yes | Downstream translates despite the general API |
| OHS | *(none)* | Yes | Downstream not yet characterized |
| PL | Conformist | Yes | Evans' NAICS example: downstream adopts standard as-is |
| PL | ACL | Yes | Downstream translates from a standard format |
| PL | *(none)* | Yes | Downstream not yet characterized |
| *(none)* | Conformist | Yes | Upstream not yet characterized |
| *(none)* | ACL | Yes | Upstream not yet characterized |
| *(none)* | *(none)* | Yes | Relationship exists, neither side characterized |

## Invalid Combinations

| Combination | Why Invalid |
|-------------|------------|
| **Customer-Supplier + any per-side role** | C/S is a standalone pattern describing the whole relationship. The upstream's willingness to accommodate is incompatible with OHS (fixed protocol for all) and PL (published standard). If they accommodate you, you're not Conformist. If they accommodate you, you don't need ACL. |
| **OHS + PL on same upstream** | Mutually exclusive: a running service (OHS) vs. a published standard/format (PL). An OHS might use a well-documented format, but the relationship is characterized by the service, not the format. |
| **Conformist + ACL** | Mutually exclusive: adopt as-is vs. translate. |
| **Partnership + any U/D role** | Symmetric. No upstream or downstream. |
| **Shared Kernel + any U/D role** | Symmetric. No upstream or downstream. |
| **Separate Ways + anything** | Not a relationship. |

## The "Separate Ways" Problem

Separate Ways is the absence of a relationship. Drawing a connection line between two contexts labeled "Separate Ways" is semantically wrong. In ContextFlow, this should be represented by the absence of a relationship line, not by a relationship with a special pattern.

Options for explicitly documenting the decision:
1. No line between contexts (the default state)
2. A context-level annotation ("deliberately not integrated with X")
3. A dashed/faded visual indicator that reads as "no integration"

## Implications for ContextFlow's Data Model

```typescript
Relationship {
  id: string
  fromContextId: string   // downstream
  toContextId: string     // upstream

  // Standalone patterns (when set, per-side roles must be empty)
  pattern?: 'customer-supplier' | 'partnership' | 'shared-kernel'

  // Per-side roles (when set, pattern must be empty)
  upstreamRole?: 'open-host-service' | 'published-language'
  downstreamRole?: 'conformist' | 'anti-corruption-layer'

  communicationMode?: string
  description?: string
}
```

Mutual exclusivity: set `pattern` OR set `upstreamRole`/`downstreamRole`, never both. Either side role can be unset (not yet characterized).

## References

- Evans, Eric. "Domain-Driven Design: Tackling Complexity in the Heart of Software." Chapter 14: Maintaining Model Integrity.
- Evans, Eric. [DDD Reference](https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf). pp. 32-34 (Customer-Supplier, Conformist, ACL).
- Evans, Eric. [AI Components for a Deterministic System](https://www.domainlanguage.com/articles/ai-components-deterministic-system/). 2025. (NAICS as Published Language context with Conformist downstream.)
- [ddd-crew/context-mapping](https://github.com/ddd-crew/context-mapping) - Community reference for context mapping patterns.
