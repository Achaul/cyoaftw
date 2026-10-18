# Text mode beta preference — 017

Based on the installed engine/shell 016 in `before/`. Adds Preferences → Show text mode (beta), default off, persisted as `cyoaftwShowTextMode` (`on`/`off`). The setting controls the compass keyboard and combat entry; the hidden centre retains its grid slot. Disabling exits text mode and cancels pending commands through the existing exit handler. Storage failure leaves the current-session toggle usable.

Build: `node .text-mode-preference/build.cjs`

Browser verification: `node .text-mode-preference/browser-preference.cjs`

Regression: `node tests/text-mode.test.cjs .text-mode-preference/cyoaftw-engine-CORE.js` (17 pass). All four required SFW syntax checks pass. Browser verification covers defaults, persistence, mobile/desktop, focus, Enter, queue cancellation, combat visibility, invalid/unavailable storage and no page errors. Screenshots saved beside this file. Protected routing slices and shell script tags/order are compared exactly by the build.

Installation must check both active baseline hashes before replacing engine and shell together; do not overwrite later development edits.
