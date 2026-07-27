# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the LifeMMO project. The setup migrates the existing partial PostHog integration (PostHogProvider + useEffect init) to the recommended Next.js 15.3+ pattern using `instrumentation-client.ts`, adds a reverse proxy to avoid ad-blockers, adds server-side tracking to both quest API routes via `posthog-node`, instruments a new client-side event for browsing skill trees, and wires up user identification on every app load.

| Event name | Description | File |
|---|---|---|
| `app_opened` | Player opened the app; fires identify with userId, name, level | `app/page-client.tsx` |
| `quest_accepted` | Player accepted a quest from the node drawer | `app/page-client.tsx` |
| `quest_completed` | Player marked a quest as complete | `app/page-client.tsx` |
| `tree_selected` | Player switched to a different skill tree tab | `app/page-client.tsx` |
| `tree_joined` | Player joined a new skill tree from the browse modal | `app/page-client.tsx` |
| `tree_abandoned` | Player abandoned their currently active skill tree | `app/page-client.tsx` |
| `tab_opened` | Player switched between the Quests / Trees / Profile tabs | `app/page-client.tsx` |
| `skill_node_opened` | Player tapped a skill node to open its detail drawer | `app/page-client.tsx` |
| `browse_trees_opened` | Player opened the Browse Skill Trees modal | `app/page-client.tsx` |
| `quest_accepted_server` | Server-side confirmation that quest acceptance was persisted | `app/api/quests/accept/route.ts` |
| `quest_completed_server` | Server-side confirmation that quest completion was persisted with XP/gold awarded | `app/api/quests/complete/route.ts` |

## Files changed

- **`instrumentation-client.ts`** (created) — Client-side PostHog init using the Next.js 15.3+ pattern; uses `/ingest` reverse proxy; preserves `capture_pageview: false` and `person_profiles: "identified_only"` from the prior setup; fails loudly in non-production when the key is missing.
- **`next.config.mjs`** (updated) — Added `/ingest/*` reverse proxy rewrites routing through `us.i.posthog.com`; added `skipTrailingSlashRedirect: true`.
- **`app/providers.tsx`** (updated) — Removed the old `PostHogProvider` + `useEffect` init (replaced by `instrumentation-client.ts`); simplified to a passthrough wrapper.
- **`app/page-client.tsx`** (updated) — Replaced `usePostHog()` hook with a direct `posthog` import; added `browse_trees_opened` event when the Browse Trees modal opens.
- **`lib/analytics-events.ts`** (updated) — Added `browseTreesOpened`, `questAcceptedServer`, and `questCompletedServer` constants.
- **`lib/posthog-server.ts`** (created) — Server-side PostHog client factory using `posthog-node`; `flushAt: 1` + `flushInterval: 0` for short-lived API handlers; fails loudly in non-production when the key is missing.
- **`app/api/quests/accept/route.ts`** (updated) — Captures `quest_accepted_server` with `quest_slug`; awaits flush before returning.
- **`app/api/quests/complete/route.ts`** (updated) — Captures `quest_completed_server` with `quest_slug`, `new_xp`, `new_gold`; awaits flush before returning.
- **`.env`** (updated) — Added `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`.

## Next steps

We've built a dashboard and five insights to keep an eye on player behavior:

- [Analytics basics (wizard) dashboard](https://us.posthog.com/project/529228/dashboard/1907772)
- [Quest completions over time](https://us.posthog.com/project/529228/insights/OxpLyOzT)
- [Quest accept → complete funnel](https://us.posthog.com/project/529228/insights/ozXGw71D)
- [Skill tree engagement](https://us.posthog.com/project/529228/insights/DSlGwOFh)
- [Daily active users](https://us.posthog.com/project/529228/insights/6BPhN6Uw)
- [Quest completions by tree](https://us.posthog.com/project/529228/insights/ouv09v6T)

## Verify before merging

- [ ] Run a full production build (`pnpm build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.example` and any bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.
- [ ] Confirm the returning-visitor path also calls `identify` — the current code identifies on every `app_opened` using a `useEffect` guard (`capturedOpenRef`), which is correct; verify this works correctly in production with server-side rendering.
- [ ] **PostgreSQL data warehouse**: this project uses Prisma + `pg` with a PostgreSQL database. Run `npx @posthog/wizard warehouse` to connect it to PostHog's data warehouse.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
