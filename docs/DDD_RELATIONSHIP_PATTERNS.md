# DDD Context Map Relationship Patterns: Validity Matrix

This document captures the valid and invalid combinations of DDD strategic patterns on context map relationships, based on the canonical definitions from Eric Evans' "Domain-Driven Design" and Vaughn Vernon's "Implementing Domain-Driven Design."

## Background: How Patterns Actually Work

In DDD literature, a relationship between two bounded contexts has **two independent annotations**: one for the upstream side and one for the downstream side. The upstream pattern describes how the upstream exposes its model; the downstream pattern describes how the downstream consumes it.

ContextFlow currently models this as a **single pattern per relationship**, which conflates the upstream and downstream concerns. This document informs the redesign toward a dual-annotation model.

## Pattern Classification

### Upstream-Side Patterns (how the upstream exposes)

| Pattern | Description |
|---------|-------------|
| **Open Host Service (OHS)** | Upstream provides a well-defined, general-purpose API for multiple consumers |
| **Published Language (PL)** | Upstream uses a well-documented, often standardized interchange format |
| *(no annotation)* | Upstream exposes its internal model directly, possibly with ad-hoc accommodations |

### Downstream-Side Patterns (how the downstream consumes)

| Pattern | Description |
|---------|-------------|
| **Anti-Corruption Layer (ACL)** | Downstream translates upstream model to protect its own domain model |
| **Conformist** | Downstream adopts the upstream model as-is, no translation |
| *(no annotation)* | Downstream consumes with unspecified strategy |

### Relationship-Level Patterns (describe the whole relationship)

| Pattern | Description |
|---------|-------------|
| **Customer-Supplier** | Upstream accommodates downstream's needs; downstream has negotiating power |
| **Partnership** | Mutual dependency; teams coordinate closely, succeed or fail together |
| **Shared Kernel** | Teams share a subset of the model with joint ownership |
| **Separate Ways** | Deliberate decision not to integrate; no connection exists |

## Valid Combinations

### Upstream-Downstream Relationships

These involve a power asymmetry: one context depends on another.

| Upstream Pattern | Downstream Pattern | Relationship Type | Valid? | Notes |
|-----------------|-------------------|-------------------|--------|-------|
| OHS | ACL | Customer-Supplier or none | Yes | Very common. Upstream provides clean API, downstream still translates to protect its model |
| OHS | Conformist | Customer-Supplier or none | Yes | Common. Upstream API is good enough that downstream adopts it directly |
| OHS + PL | ACL | Customer-Supplier or none | Yes | Gold standard. Upstream provides formal API with standardized format; downstream still isolates |
| OHS + PL | Conformist | Customer-Supplier or none | Yes | Upstream provides great API/format, downstream happy to adopt it |
| PL | ACL | Customer-Supplier or none | Yes | Upstream uses standard format (e.g., HL7, SWIFT); downstream translates |
| PL | Conformist | Customer-Supplier or none | Yes | Upstream uses standard format; downstream adopts it directly |
| *(none)* | ACL | Customer-Supplier or none | Yes | Upstream exposes raw model; downstream protects itself with translation |
| *(none)* | Conformist | Customer-Supplier or none | Yes | Upstream exposes raw model; downstream conforms to it (often reluctantly) |
| *(none)* | Conformist | none (no negotiating power) | Yes | Classic "big upstream, small downstream" scenario (e.g., conforming to an ERP) |

### Symmetric Relationships

These have no upstream/downstream distinction.

| Pattern | Upstream/Downstream Annotations | Valid? | Notes |
|---------|-------------------------------|--------|-------|
| Partnership | Neither side gets OHS/ACL/etc. | Yes | Both teams coordinate as equals; no translation layer needed |
| Shared Kernel | Neither side gets OHS/ACL/etc. | Yes | Shared code/model; no need for integration patterns |
| Separate Ways | N/A (no connection) | Yes | No integration, so no integration patterns apply |

## Invalid Combinations

| Combination | Why Invalid |
|-------------|------------|
| **PL + Customer-Supplier** (as the defining relationship pattern) | Published Language implies a standardized, often industry-wide format that exists independently of any specific consumer. Customer-Supplier implies the upstream accommodates the downstream's specific needs. These are in tension: if you're publishing a standard language, you're serving all consumers equally, not prioritizing one customer. However, PL *can* appear alongside Customer-Supplier if the upstream publishes a standard format AND also accommodates the downstream's needs in how they evolve that format. |
| **OHS on downstream side** | OHS describes how an upstream exposes services. A downstream context doesn't "host" a service for its upstream. |
| **PL on downstream side** | Published Language describes what the upstream publishes. The downstream either conforms to it or translates it. |
| **ACL on upstream side** | ACL is a defensive downstream pattern. The upstream doesn't need to "protect" itself from the downstream's model. |
| **Conformist on upstream side** | Conformist describes downstream capitulation. The upstream, by definition, isn't conforming. |
| **ACL + Conformist** (same downstream) | Mutually exclusive: either you translate (ACL) or you adopt as-is (Conformist). You can't do both. |
| **Partnership + any upstream/downstream annotation** | Partnership is symmetric. Adding OHS/ACL/Conformist implies a power asymmetry that contradicts the partnership. |
| **Shared Kernel + any upstream/downstream annotation** | Same reasoning. Shared Kernel is joint ownership; there's no upstream or downstream. |
| **Separate Ways + any pattern** | Separate Ways means no integration. You can't simultaneously have no integration and an integration pattern. |
| **Separate Ways rendered as a connection** | By definition, Separate Ways is the absence of a relationship. Drawing a line between contexts contradicts the pattern's meaning. |

## The "Separate Ways" Problem

Separate Ways is unique: it's not a relationship pattern, it's the **absence** of a relationship. Drawing a connection line between two contexts labeled "Separate Ways" is semantically wrong. The whole point is that these contexts have decided not to integrate.

### Options for the App

1. **Remove Separate Ways from the relationship dropdown entirely.** Instead, represent it as the default state: two contexts with no line between them. Optionally allow users to annotate this decision (e.g., a note on a context saying "deliberately not integrated with X").

2. **Show it as a dashed/faded non-connection.** If users want to explicitly document the decision, render it as a subtle visual indicator (dashed line, very faint, or X-mark) that clearly reads as "no integration" rather than as a connection.

3. **Move it to context-level metadata.** A context could have a "Separate Ways with: [list]" field, making the deliberate decision visible without implying a connection.

## Implications for ContextFlow's Data Model

The current single-pattern model can't express common real-world mappings like "OHS upstream with ACL downstream in a Customer-Supplier relationship." To properly support DDD Context Maps, the relationship model needs:

```
Relationship {
  id: string
  fromContextId: string      // downstream
  toContextId: string        // upstream

  // Relationship-level (optional)
  relationshipType?: 'customer-supplier' | 'partnership' | 'shared-kernel'

  // Upstream-side annotations (what upstream does)
  upstreamPatterns?: ('open-host-service' | 'published-language')[]

  // Downstream-side annotations (what downstream does)
  downstreamPattern?: 'anti-corruption-layer' | 'conformist'
}
```

This model:
- Allows OHS + PL together on the upstream side (they're complementary)
- Keeps ACL vs Conformist mutually exclusive on the downstream side
- Separates the relationship type from the integration patterns
- Makes invalid states harder to represent
- Removes Separate Ways from the relationship type (it's the absence of one)

## References

- Evans, Eric. "Domain-Driven Design: Tackling Complexity in the Heart of Software." Chapter 14: Maintaining Model Integrity.
- Vernon, Vaughn. "Implementing Domain-Driven Design." Chapter 3: Context Maps.
- Brandolini, Alberto. Various talks and writings on Context Mapping.
