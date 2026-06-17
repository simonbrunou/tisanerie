---
name: warn-island-needs-test
enabled: true
event: file
action: warn
conditions:
  - field: file_path
    operator: regex_match
    pattern: src/components/.*\.tsx$
---

🧪 **React island edited — islands regress silently here.**

This is the documented #1 regression source. The Vitest runner is `environment: 'node'`
and `include: ['src/**/*.test.ts']`, so `.tsx` + DOM logic are **not** covered by
`npm run test` — islands ship untested.

Before finishing:
1. Extract pure logic into a tested function — e.g. the `need` URL building in
   `NeedPicker`, `format()`/countdown arithmetic in `BrewingTimer` — and add a
   `*.test.ts` for it (that DOES run).
2. Re-check the island invariants: `NeedPicker` appends multi `?need=a&need=b`
   (URLSearchParams.append); links go through `localizedPath` (no hardcoded `/fr`…);
   `BrewingTimer` clears its interval on unmount/pause/zero; `ThemeToggle` doesn't fight
   `public/theme-init.js`.
3. Don't claim the island works without running a test.

(To make `.test.tsx` actually runnable, add a jsdom Vitest project — a separate infra change.)
