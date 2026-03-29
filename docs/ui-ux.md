# UI/UX Notes

## Intent

The task experience should feel calm, dense, and readable.
The reference style is the current kanban board, task cards, and task modal.

## Core Principles

- Prefer clarity over decoration.
- Keep a strong information hierarchy.
- Use color to support status, not to create noise.
- Show actions only when they are useful.
- Avoid visual nesting when spacing and typography are enough.
- Keep forms simple and direct.

## Kanban Columns

- Each status column owns a clear color family.
- Use soft tinted backgrounds instead of heavy fills.
- Keep the header compact: one status badge, one count.
- Preserve generous rounding and light borders.
- Allow horizontal scrolling instead of wrapping columns to a second row.
- Empty states should be quiet and instructional, not dominant.

## Task Cards

- Surface only the information needed for scanning.
- Put the priority badge first, near the title and actions.
- Keep assignee as a lightweight metadata badge, not as a primary status signal.
- Do not use `label: value` rows for routine metadata.
- Prefer icon + value for secondary information.
- Show project and client together as one contextual line.
- Show due date as a distinct pill so urgency is visible immediately.
- Keep notes short and truncated in the card view.
- Reveal edit/delete actions on hover or focus, not permanently.
- Avoid sub-cards inside cards; use spacing, borders, and typography instead.

## List Cards

- Reuse the same calm card language for project, invoice, quote, payment, and contact lists.
- Prefer one white rounded surface with a light ring and soft shadow.
- Put categorical badges first, then the entity title, then the supporting metadata.
- Use pills with icons for dates, workflow hints, or secondary values when it improves scan speed.
- Keep destructive actions hidden until hover or focus when they are not the main task.
- Empty states should feel quiet and consistent with tables and Kanban columns.

## Task Modal

- One main panel is enough.
- Start with the modal title and core context.
- Use the same base structure for all create/edit modals:
  - rely on the modal shell title first; do not duplicate a heavy inner header by default
  - one simple flow of fields, without extra panel chrome unless the content really needs grouping
  - simple grids for short fields, full-width inputs for text areas
  - quiet footer with actions aligned to the right
- Use badge-like toggle choices for priority and assignee.
- Keep normal form inputs for project, due date, notes, and status.
- Editing and creation should feel almost identical.
- Footer actions should stay simple: cancel + primary submit.

## Visual Language

- Use white or lightly tinted surfaces.
- Keep shadows soft and shallow.
- Prefer rounded pills and rounded cards over sharp edges.
- Use slate/neutral tones as the base.
- Reserve stronger colors for workflow semantics:
  - blue for `En cours`
  - orange for `En attente`
  - violet for `À valider par binōm`
  - cyan for `À valider par le client`
  - green for `Terminé`
- Do not stack too many accent colors inside one component.

## Spacing And Density

- Favor compact density, but never at the cost of legibility.
- Group related information with spacing before adding separators.
- Use separators sparingly, mainly for section transitions.
- Keep forms and cards visually lighter than admin CRUD defaults.

## Interaction Rules

- Hover states should clarify affordances, not redraw the component.
- Transitions should be quick and subtle.
- Drag handles and drag zones must remain obvious.
- Hidden actions must still be accessible on focus.
- Do not require extra clicks to understand task state.

## When In Doubt

- Remove one visual layer.
- Reduce the number of simultaneously visible actions.
- Replace a block with a badge if the content is categorical.
- Replace a nested container with spacing if the content is informational.
- Check whether the card still scans correctly in under 2 seconds.
