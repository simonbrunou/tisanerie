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

This is the documented #1 regression source. `npm run test` runs two Vitest projects:
`node` runs `*.test.ts` without a DOM, and `islands` renders `src/**/*.test.tsx` in jsdom
with `@testing-library/react`. `npx vitest run --project islands` runs the island tests
alone. An island change with no test in either project ships untested.

Before finishing:
1. Extract pure logic into a tested function — e.g. the `need` URL building in
   `NeedPicker`, `format()`/countdown arithmetic in `BrewingTimer` — and add a
   `*.test.ts` for it. When the change alters what the island renders or does, also
   add a render test in `<Island>.test.tsx` beside it, following
   `src/components/BrewingTimer.test.tsx`.
2. Re-check the island invariants: `NeedPicker` appends multi `?need=a&need=b`
   (URLSearchParams.append); links go through `localizedPath` (no hardcoded `/fr`…);
   `BrewingTimer` clears its interval on unmount/pause/zero; `ThemeToggle` doesn't fight
   `public/theme-init.js`.
3. Don't claim the island works without running a test.
