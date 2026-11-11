# Flashcard Generator design system

The frontend uses a small, CSS-only design system built around calm blue
accents, warm neutral surfaces, and high-contrast text. It is intentionally
class-based so route markup stays semantic and the visual language can evolve
without introducing a component library.

## Color roles

- `--color-canvas` is the page background.
- `--color-surface` and `--color-surface-muted` are panels and inset areas.
- `--color-ink` and `--color-ink-muted` provide readable primary and secondary
  text.
- `--color-brand` is used for primary actions and navigation focus.
- `--color-danger`, `--color-success`, and `--color-warning` communicate
  validation and operation status. Status text must not rely on color alone.

The palette is designed to meet readable contrast on its intended surfaces.
Interactive focus uses a two-part outline (brand ring plus canvas offset) so it
remains visible against both light and tinted backgrounds.

## Typography and spacing

The system uses the platform sans-serif stack for fast loading and familiar
rendering. Headings use a tighter line height, while body copy uses a relaxed
line height for source material and explanations. Spacing follows a compact
scale based on `--space-1` through `--space-8`; prefer these tokens over
one-off values.

## Surfaces and layout

`.app-shell`, `.page`, `.page-header`, `.surface`, and `.surface-muted` define
the shared page structure. `.page` is fluid on mobile and capped at a readable
desktop width. `.stack`, `.cluster`, and `.split` provide reusable layout
patterns. Content may wrap, but controls never require horizontal scrolling.

## Controls and states

Use `.button` with `.button-primary`, `.button-secondary`, or `.button-danger`
for actions. `.field`, `.textarea`, `.select`, and `.file-input` style form
controls while preserving native semantics. Labels remain visible, and invalid
controls pair `aria-invalid="true"` with `.field-error`.

All links, buttons, inputs, selects, textareas, checkboxes, and sortable table
headers have a visible `:focus-visible` treatment. Disabled controls retain
legible text and communicate that they cannot be activated. `.status`,
`.status-success`, `.status-error`, and `.status-info` style live status
messages; use `role="status"` or `role="alert"` in the markup as appropriate.

## Responsive behavior

The layout starts mobile-first. Clusters wrap, grids collapse to one column,
tables remain readable with a minimum content width inside an explicitly
scrollable region, and touch targets remain at least 2.75rem tall. At 48rem,
page padding and two-column review/editor layouts expand for desktop screens.

## Motion and accessibility

Transitions cover color, border, shadow, and small positional changes. The
review deck also supports horizontal pointer/touch swipes, tap-to-flip, Previous
and Next buttons, and Left/Right Arrow plus Enter/Space keyboard controls. Its
active card has button semantics and an accessible card-position label. The
`prefers-reduced-motion: reduce` media query minimizes transitions and
animations. Never remove the focus ring, and preserve the semantic heading,
label, caption, and landmark structure already present in the routes.

## Visual QA checklist

For `/`, `/input`, `/review`, and `/export`, verify:

1. The page has a clear heading and the navigation indicates the current
   location.
2. At 320px and desktop width, no page-level horizontal overflow occurs.
3. Every control is reachable by keyboard and has a visible focus ring.
4. Hover, disabled, busy, success, and error states remain readable.
5. Input labels, table caption, status text, and error text remain available to
   assistive technology.
6. Reduced motion is respected when the operating-system preference is enabled.

