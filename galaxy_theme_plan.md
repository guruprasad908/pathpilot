# Galaxy Theme Integration Plan

## 1. Goal
To systematically replace the remaining generic UI components of PathPilot with a cohesive, elegant "Space / Galaxy" visual theme.

Based on feedback, we are actively avoiding over-roleplay language (e.g., no strict "sci-fi jargon" in core UX) and focusing on a clean, modern, performance-first aesthetic.

---

## 2. Track 1: Thematic Consistency (2D, CSS-based)
**Status: UP NEXT**

This track focuses purely on deep CSS styling, expanding design tokens, and standardizing our current 2D layout.

### Strict Design System Constraints
1. **Typography Hierarchy**: Use a clean geometry font (e.g., `Inter` or `Outfit`) for modern, readable data display.
2. **Color Standardization**: Replace generic Tailwind grays with deep space blacks (`#0a0a0f`), panel tones (`#151520`).
3. **Layout Rhythm**: Enforce a strict baseline grid for spacing (e.g., multiples of 4px/8px consistently across modules).
4. **Z-Index Layering Rules**: Define explicit bounded z-indexes (Base: 0, Starfield: -1, Panels: 10, HUD/Nav: 50, Overlays/Modals: 100).
5. **WCAG Contrast**: Ensure strict WCAG-compliant contrast ratios for all text against dark backgrounds.
6. **Border Radius Scale**: Uniform `rounded-xl` for major panels, `rounded-lg` for interior cards and buttons.
7. **Shadow Scale**: Standardized ambient shadows (`shadow-[0_0_15px_rgba(...)]`) replacing generic dropshadows.
8. **Glow Usage Rules**: Glows are strictly limited to active, focus, or completed states.
9. **Minimal Micro-animations**: Add subtle transition states (e.g., gentle `translate-y` hover effects), avoiding heavy generic CSS animations.

### Phase 16A: Global Aesthetic Tokens
- Deploy typography, background starfield baseline, and token variables.

### Phase 16B: Core UX Coherence
- Standardize Navigation, Forms, Dashboard, and 2D Roadmap Architect views.
- Avoid over-theming form labels; focus on clean borders and focus-rings. 

*(Note: Track 1 must be fully completed before Track 2 begins.)*

---

## 3. Track 2: True Galaxy Visualization (3D, WebGL-based)
**Status: BLOCKED (Pending Track 1 completion)**

This track will build a dedicated interactive 3D visualizer. It will *not* replace the existing 2D roadmap page, but rather act as a companion view.

### Rendering Constraints
- **Performance First**: Cap particle counts tightly.
- **Node Count Cap**: Implement a hard cap and clustering rule for large roadmaps to prevent WebGL degradation.
- **Level-of-Detail (LOD)**:
  - *Far Zoom*: Render galaxy spirals/clusters only.
  - *Mid Zoom*: Render planet meshes and macro-structures.
  - *Close Zoom*: Render granular subtopic nodes.
- **Geometry Rules**: Instanced meshes are required for starfields and repeating structures to ensure 60fps.
- **Post-Processing**: No heavy bloom or complex post-processing chains in v1.
- **GPU Resource Management**: Implement explicit `dispose()` rules on unmount to prevent WebGL memory leaks.
- **Progressive Mounting**: Delay initializing heavy 3D assets until the canvas is fully in view/requested.
- **Fallback Mechanism**: Automatically detect WebGL capability/crash and seamlessly fallback to the 2D roadmap view. The 3D route will be purely optional.

### Camera & Animation Specifications
- **Boundaries**: Strictly bounded min/max zoom distances to prevent clipping.
- **Movement**: Utilize a specific damping factor for orbital smoothing.
- **Idling**: Employ a slow, controlled auto-rotation on idle.
- **Orbits**: Use a deterministic orbital positioning algorithm (predictable seeded math rather than physics simulations).

### Interaction Model
- **Zooming**: Clicking a planet node smoothly orbits and zooms the camera into focus.
- **Overlays**: Selecting a subtopic within a planet does *not* replace the route; it opens a 2D study overlay sliding over the 3D canvas.
- **State Segregation**: Strict architectural separation between 3D rendering state and business logic.
- **Adapter Layer**: Implement a pristine Data Transformation Adapter layer that parses raw DB models into highly optimized flat arrays for the 3D meshes.
- **Mobile Support**: Requires an explicit mobile performance fallback plan (e.g., lower polygon counts or disabled particles).

### Visual Data Mapping Rules
- **Not Started**: Dimly lit / unpowered node state.
- **In Progress**: Emits a pulsing `neon-cyan` aura.
- **Completed**: Emits a solid, stable `neon-emerald` glow.

### Phase 17: Interactive 3D WebGL Route
- Implement `Three.js` and `@react-three/fiber`/`@react-three/drei` in a dedicated `/galaxy` route.
- Bind roadmap data directly to 3D orbiting meshes.

---

## 4. Execution Rules
- **Performance First**: Glowing effects and animations must not cause layout thrashing or stuttering.
- **Elegance over Gimmick**: Keep the UI professional and mature.
- **No functional breakage**: CSS changes must not alter the underlying data or API schemas.
