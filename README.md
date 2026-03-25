# CRM Binom

## Setup

Make sure to install the dependencies:

```bash
npm install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
npm run dev
```

## Production

Build the application for production:

```bash
npm run build
```

Locally preview production build:

```bash
npm run preview
```

## Quality Checks

Run the local quality gate before opening or merging a change:

```bash
npm test
npm run lint
npm run typecheck
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Frontend Structure

- `app/types`: front domain types shared by pages, components and composables.
- `app/validation`: Zod schemas and inferred payload types for runtime validation and API inputs.
- `app/lib`: pure helpers and business utilities without Vue reactivity.
- `app/constants`: static lists and config values.
- `app/composables`: reactive state and reusable Vue/Nuxt logic.

The rule is simple: if a type exists only to describe UI or domain data, it belongs in `app/types`, not in `app/validation`.

## UI/UX Notes

The current task UI rules for kanban columns, task cards, and modals are documented in [docs/ui-ux.md](docs/ui-ux.md).
