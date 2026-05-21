# Connection UX Research for ContextFlow

Survey of how leading graph/diagramming tools handle node-to-node connection, observations on ContextFlow's current implementation, and synthesis. No code changes proposed.

## Part 1: Survey of leading tools

### tldraw

- **Start a connection**: User selects the Arrow tool (keyboard `A`) or drags from one of the arrow handles that appear when a shape is selected. Connection is always made via a dedicated tool mode, not from invisible per-shape handles.
- **Target the destination**: Drag the arrow head over the target shape. The whole shape body is a drop target; tldraw uses a hover dwell timer to distinguish "imprecise" (snap to center, default) from "precise" (anchor at the exact hovered point) targeting.
- **Connection points**: No fixed handles. Each arrow endpoint has a `normalizedAnchor` (a 0-1 local coordinate inside the bound shape), and `isPrecise` decides whether to honor that anchor or default to the shape's center. `isExact` decides whether the arrow visually stops at the shape edge or passes inside.
- **Routing**: Two modes: `arc` (smooth curve with a bend control point the user can drag) and `elbow` (orthogonal/Manhattan with right-angle bends that route around obstacles).
- **Re-routing on move**: Endpoints recompute against the bound shape's bounding box every frame; for arc arrows the endpoint slides along the perimeter so the visible attachment side flips dynamically as shapes move. Short arrows are explicitly smoothed to avoid "jumping around."
- **Discoverability**: Arrow tool is a top-level toolbar item. Shape hover during arrow-drag highlights the target. No ambient handles cluttering selected shapes.

### Excalidraw

- **Start a connection**: Arrow tool (keyboard `A`) only. There are no per-shape connection handles. You always draw an arrow as a first-class shape, and binding happens implicitly.
- **Target**: Drag the arrow endpoint into or near the target shape. If the endpoint is within ~5px of the outline (or 100-110% of distance from center), it snaps and binds; if you hover for ~1500ms snapping disables and you can place a custom-gap or inside-shape binding.
- **Connection points**: Floating. The endpoint is stored as a `FixedPointBinding` (a local normalized point inside the shape). No fixed handles.
- **Routing**: Straight or elbow. Elbow arrows use Manhattan distance and bind perpendicular to the chosen side (top/bottom/left/right) so attachments are always orthogonal to the shape edge.
- **Re-routing on move**: Bindings update on every transform (move/resize/rotate). For elbow arrows, the bound side recomputes based on relative position so the attachment side flips.
- **Discoverability**: Arrow tool is one of the primary tools. Snapping is visualized by a subtle highlight ring on the bound shape. No handles, no hover dots.

### Miro

- **Start a connection**: Hover the source shape to reveal four blue dots, one per side; click and drag from a dot. Alternatively, hover the shape edge for an "edge snap" indicator.
- **Target**: Drag toward another shape. As you approach, target connection points (also four blue dots) light up; release on a dot for a fixed anchor, or release on the shape body / edge to create a floating anchor that picks the closest side.
- **Connection points**: Four cardinal points are emphasized, but Miro supports floating anchors and (more recently) edge anchors. Users consistently complain it is "too eager" to snap.
- **Routing**: Default is orthogonal with elbow bends; users can switch to curved or straight per connector. Rounded-elbow routing is a frequently requested but not-yet-default style.
- **Re-routing on move**: Anchors that are floating recompute side; fixed anchors stay pinned and the line bends to compensate (sometimes awkwardly).
- **Discoverability**: Dots only on hover/select. A ghost connector line follows the cursor during drag; valid targets fill in blue.

### FigJam (Figma)

- **Start a connection**: Hover the source shape; the cursor changes near the edge to indicate "connector zone." Click and drag from the edge.
- **Target**: Drop on another shape; FigJam uses "hover zones" to decide whether the user is aiming at one of the four cardinal endpoints, the edge of the shape, or somewhere arbitrary inside; no modifier keys needed.
- **Connection points**: Both fixed (four cardinal, plus user-added custom points launched recently) and floating; the hover-zone heuristic auto-promotes between them.
- **Routing**: Elbow (default), straight, curved. Mind-map connectors are curved.
- **Re-routing on move**: Floating anchors flip side; cardinal anchors stay pinned.
- **Discoverability**: No always-visible handles; the connector affordance appears as cursor and edge highlight when hovering the source shape.

### Lucidchart and draw.io

- **Start (draw.io)**: Hover any shape to surface four directional arrow stubs that extend outward; click an arrow to auto-create a target shape, or drag to an existing shape. Connection points (small crosses) also appear on hover.
- **Start (Lucidchart)**: Hover the shape edge to see a blue dot; click and drag.
- **Target**: A green circle appears when the target shape's outline is detected; release inside that highlight for a bound connection. Releasing on empty canvas creates a free endpoint.
- **Connection points**: Both support fixed anchor points (crosses/dots) and floating attachment. draw.io explicitly distinguishes "floating connections" (snap to closest perimeter, recompute as shapes move) from "fixed connections" (locked to one anchor).
- **Routing**: Orthogonal default, with waypoints the user can drag. Both support straight and curved as alternatives. Manhattan routing is the production-diagram norm.
- **Re-routing on move**: Floating endpoints recompute attachment side; fixed endpoints hold their anchor.
- **Discoverability**: Hover-only directional arrows are the signature draw.io affordance: discoverable without being noisy, and they double as "create + connect."

### React Flow (idiomatic patterns)

- **Strict vs Loose `connectionMode`**: Strict requires source-handle to target-handle pairing; Loose lets any handle act as either end. ContextFlow already uses Loose.
- **Handles**: Per-side `<Handle>` components. By default they are small visible dots; teams typically hide them via CSS and reveal on hover.
- **Floating Edges example**: Recommended pattern when you do not want fixed cardinal handles to dictate routing. A single hidden handle in the node center, plus a custom edge that computes intersection of the source/target node boundaries with the line between centers, and chooses the closest side dynamically (this is exactly the pattern ContextFlow's `edgeGeometry.ts` implements).
- **Easy Connect example**: Whole node acts as a connection target; no handle aiming required.
- **Proximity Connect example**: Dragging a node near another auto-creates a ghosted edge that becomes real on drop. Useful for keyboard-light, low-friction workflows.
- **Reconnect Edge**: Built-in support for dragging an existing edge endpoint to a different node.
- **Routing**: Built-in path generators are `getBezierPath`, `getSmoothStepPath` (orthogonal), `getStraightPath`, `getSimpleBezierPath`. No built-in obstacle avoidance.

## Part 2: ContextFlow's current behavior

Reading `src/components/nodes/ContextNode.tsx`, `src/components/edges/RelationshipEdge.tsx`, `src/components/CanvasArea.tsx`, and `src/lib/edgeGeometry.ts`:

- **Handles on ContextNode**: Three `<Handle>` elements, all rendered unconditionally (not just on hover): a `source` handle on the left, a `source` handle on the right, and a `target` handle on the top (the top handle exists for User Need to Context connections in Strategic View). Both left/right are typed as `source` so drag direction always determines DDD upstream/downstream.
- **Connection mode**: `ConnectionMode.Loose`, so any handle can act as source or target during a drag.
- **Connection creation flow**: User must hover a context to find the small left or right handle dot, then click-and-drag from the dot, then drop onto another context (anywhere on the body counts because Loose mode lets the target handles match). On drop, if both nodes are contexts, a pattern picker modal opens and the user chooses one of nine DDD relationship patterns before the relationship is created.
- **Edge routing**: Default React Flow Bezier path, but `RelationshipEdge` overrides the endpoints by calling `getEdgeParams(sourceNode, targetNode)` from `edgeGeometry.ts`. That helper computes the intersection of each node's bounding box with the line between the two node centers, then picks the closest of `Left|Right|Top|Bottom` for each endpoint. Endpoint coordinates are placed at the midpoint of the chosen side. This is the canonical React Flow "floating edges" pattern.
- **Dynamic re-routing**: Because `getEdgeParams` runs on every render, attachment sides flip dynamically as nodes move. Good.
- **ACL/OHS pattern indicators**: A separate small labeled box is rendered between the two nodes, with its own Bezier sub-path from the box to one of the endpoints.

**Why it likely feels janky**

1. **Two `source` handles fight the floating-edge math.** The visible left/right `Handle` dots are fixed at cardinal positions, but the rendered edge endpoints are computed by `getEdgeParams` and may land on the top or bottom. The connection-creation interaction uses the fixed handle (you have to grab the small left or right dot), but the displayed edge does not start there. This is the "edge starts somewhere I did not drag from" feeling.
2. **The displayed endpoint is on the side midpoint, but the Bezier path's curvature control points are derived from `sourcePosition`/`targetPosition` enum.** A path with `sourcePosition: Left` but a target far to the lower-right will produce a curve that loops out to the left first; this is the "line wanders" feeling.
3. **Tiny handle dots are the only affordance to start a connection.** Users have to find a small dot at exactly the left or right edge. There is no whole-node drop target, no edge-of-shape hover affordance, no toolbar arrow mode.
4. **The top `target` handle is asymmetric.** Drops from User Need land cleanly on top; drops from another context arrive at left/right (because both contexts only expose source handles on those sides under Loose mode). Edges between contexts cannot attach top or bottom for creation, even though `getEdgeParams` will move the displayed endpoint there afterward.
5. **No ghost preview specific to the relationship type.** The user drags a generic React Flow connection line, then a modal appears. There is no in-canvas indication of which side will be upstream until the modal labels it.

## Part 3: Synthesis

**Most relevant patterns for ContextFlow's audience**

The workshop audience is DDD practitioners using this for 2 hours, not power users of diagramming tools. Affordances must be visible and forgiving. Three patterns dominate for this profile:

- **draw.io's hover-arrow-stubs** make "I can connect from here" visible without clutter; they are the most discoverable connection affordance among the surveyed tools.
- **tldraw and Excalidraw's whole-shape drop targets with floating anchors** remove the "aim at the dot" precision tax. Combined with React Flow's `connectionMode: Loose` and floating edges, this is straightforward.
- **Excalidraw and FigJam's elbow/Manhattan routing** is the dominant routing style for diagrams that include directional semantics. Bezier curves read as "flow," but DDD context maps are about discrete upstream/downstream relations and are easier to read with right-angle lines, especially when many relationships cross.

**Highest-leverage changes (research-only, not a plan)**

1. **One floating anchor per node, not two fixed source handles.** Let any side of the rectangle be the attachment, computed by `getEdgeParams` (already implemented). The creation interaction should match the display: hover the shape edge or use a single perimeter affordance, not two fixed cardinal dots. This alone removes the "edge does not start where I dragged from" jank.
2. **Make the whole context body a connection drop target during a drag.** Combined with `ConnectionMode.Loose`, this matches Miro/FigJam/Excalidraw expectations and removes the "did I hit the dot" failure mode.
3. **Reconsider Bezier vs. orthogonal routing.** For a context map with many relationships, orthogonal (`getSmoothStepPath`) is easier to read and less prone to visible "wandering." Bezier with mismatched source/target `Position` enums is the most common cause of the "line wanders" effect.

**Trade-offs and open questions**

- **DDD directionality and floating anchors**: A floating-anchor design does not lose direction; the arrow marker still points upstream-to-downstream. What it loses is the user's ability to say "always attach at the right side." For a context map, that loss is fine. Question: does the team want to preserve any "manual side override" affordance for special cases (e.g., a context with many incoming relationships where one needs to come from the top)?
- **Symmetric patterns** (Shared Kernel, Partnership, Separate Ways) have no arrow head; floating anchors still work, but the affordance should clearly communicate that direction does not matter here. tldraw and Excalidraw both handle this with arrowhead toggles.
- **Pattern picker placement**: The current modal interrupts flow. FigJam-style inline label editing on the edge after creation would feel lighter, but DDD patterns are not free text and need a constrained picker. A floating popover anchored to the new edge (rather than a centered modal) would feel closer to the diagram tools surveyed.
- **ACL and OHS indicator boxes** are a custom rendering layer on top of the edge. Whichever routing approach is chosen, the indicator-box geometry will need to keep up.
- **Proximity-connect** (drag nodes together to auto-link) is tempting but probably wrong for DDD: relationships are intentional and need a pattern, not an emergent side-effect of layout.

## Addendum: status as of GH #22 (connection UX redesign)

The research above predates #21 and #22. Recording what is settled and what remains in play.

**Settled by #21 (merged):**
- Joint anchor side selection across all 16 source/target side pairs with a facing-side preference (`selectAnchorSides` in `src/lib/edgeGeometry.ts`). The "edge wanders" symptom from mismatched independent per-end selection is gone.
- Edge tail shortened so the bezier ends at the back of the arrow marker rather than under the box edge (#24, `shortenEdgeEndpoint`).

**Settled by the bezier decision (see [[design-bezier-edges]] memory):**
- Bezier curves stay. The "hand-drawn, organic" register is intentional for strategic-design work and fits the workshop audience. Orthogonal routing is rejected for this product. The "line wanders" symptom was the joint-anchor bug, not bezier itself; fixing #21 removed the case for orthogonal.

**Open for #22 (this mockup):**
1. **Creation affordance**: replace the two fixed left/right source dots with hover-revealed directional arrow stubs on all four sides (draw.io pattern). Drag from any stub to start a connection. The visible edge endpoint still floats jointly per #21; the stub side is a creation-time hint, not a permanent anchor.
2. **Whole-shape drop target**: dropping anywhere on the body of a destination context completes the connection. Implemented as a full-size transparent target handle behind the visible card so React Flow's hit-testing does the work without forking internals.
3. **Bezier preserved**: covered above; included in the mockup for visual confirmation rather than as an open question.

The mockup at `docs/mockups/connection-ux-mockup.html` lets you compare hover-stub variants, toggle the whole-shape drop target visualization, and see bezier rendered against the rejected orthogonal alternative.

## Sources

- [Arrow binding options - tldraw Docs](https://tldraw.dev/examples/arrow-binding-options)
- [ArrowShapeOptions - tldraw Docs](https://tldraw.dev/reference/tldraw/ArrowShapeOptions)
- [Element Binding System - Excalidraw DeepWiki](https://deepwiki.com/excalidraw/excalidraw/3.2-element-binding-system)
- [Building Elbow Arrows in Excalidraw](https://plus.excalidraw.com/blog/building-elbow-arrows-part-one)
- [Connection lines - Miro Help Center](https://help.miro.com/hc/en-us/articles/360017730733-Connection-lines)
- [Custom connection points in FigJam](https://forum.figma.com/suggest-a-feature-11/launched-custom-connection-points-on-shapes-in-figjam-36105)
- [Create diagrams and flows with connectors in FigJam - Figma Help](https://help.figma.com/hc/en-us/articles/1500004414542-Create-diagrams-and-flows-with-connectors-in-FigJam)
- [Floating and Fixed Connections in draw.io](https://drawio-app.com/blog/floating-and-fixed-connections-in-draw-io/)
- [Work with connectors - draw.io](https://www.drawio.com/doc/faq/connectors)
- [ConnectionMode - React Flow](https://reactflow.dev/api-reference/types/connection-mode)
- [Simple Floating Edges - React Flow](https://reactflow.dev/examples/edges/simple-floating-edges)
- [Floating Edges - React Flow](https://reactflow.dev/examples/edges/floating-edges)
- [Easy Connect - React Flow](https://reactflow.dev/examples/nodes/easy-connect)
- [Proximity Connect - React Flow](https://reactflow.dev/examples/nodes/proximity-connect)
- [Reconnect Edge - React Flow](https://reactflow.dev/examples/edges/reconnect-edge)
- [Handles - React Flow](https://reactflow.dev/learn/customization/handles)
- [Context mapping in Domain-Driven Design (Medium)](https://medium.com/ingeniouslysimple/context-mapping-in-domain-driven-design-9063465d2eb8)
- [ddd-crew context-mapping repo](https://github.com/ddd-crew/context-mapping)
