# Dueflow Web (V1)

Minimal frontend for the Dueflow due-date calculation engine.

## Stack

- **Vite** + **React** + **TypeScript** (strict)
- **TailwindCSS** (dark by default)
- No state library, no UI framework — functional components only

## Project structure

```
src/
  api.ts              # API client (preview, calculate, validate, health)
  types.ts            # Shared TypeScript types
  main.tsx            # Entry
  App.tsx             # Layout + Rule form + Timeline
  index.css           # Tailwind + CSS variables (dark theme)
  vite-env.d.ts       # Vite env types
  components/
    RuleForm.tsx      # Rule fields + debounced POST /preview
    DueDatePreview.tsx # Live due date, confidence, isEstimated, errors
    DueTimeline.tsx   # Next 6 months from /calculate, badges, &lt;7d highlight
```

## Scripts

- `npm run dev` — start dev server (Vite)
- `npm run build` — TypeScript + production build
- `npm run preview` — serve `dist` locally

## Backend

In development, requests to `/api/*` are proxied to `http://localhost:3000` (see `vite.config.ts`). Run your Express backend on port 3000.

For production, set `VITE_API_URL` to your API origin (e.g. `https://api.dueflow.example.com`) so the client calls that base instead of `/api`.

## Endpoints used

| Method | Path             | Purpose                    |
|--------|------------------|----------------------------|
| POST   | `/preview`       | Live rule preview (debounced) |
| POST   | `/calculate`     | Next 6 months due dates    |
| POST   | `/rules/validate`| Validate rule (available in API client) |
| GET    | `/health`        | Health check               |

Dates are `YYYY-MM-DD`. Engine returns `{ dueDate, isEstimated, confidence }`.
