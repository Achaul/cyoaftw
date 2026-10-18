# Jobs and quests in text mode

Engine/shell `2026-10-18-010`, based on installed 009. This is the latest reproducible command build. See [TEXT_MODE.md](../TEXT_MODE.md) for commands, limits and the TTS handoff.

```text
interact with job board
jobs
options
choose 1
accept job serve tables
work
collect pay
quests
show quests
accept quest goblins
cut trophy from goblin corpse
hand in quest goblins
abandon quest goblins
back
cancel
continue
```

The guildhall Job Board now opens the same postings as the room action. Native board, posting, work, quest-log and NPC work menus register explicit callbacks with shared choices. Text uses semantic terms/choices without opening an overlay; normal mode retains its modal buttons. This is support for the existing work and trophy-bounty systems, not a new quest type or reward implementation.

Job/quest state, original references, board lists, worksite/fixtures, scene, inventory, time/tier and NPC availability are validated before selecting. Consumed choices cannot pay twice. Work and trophy actions reject changed scenes/sources after time is spent. NPC ready-quest rows identify the individual quest. Native costs, tips, completion bonuses, early exit, standing/favor, proof consumption and extra proof are retained. Queues pause for menus and require explicit resumption. Modal ownership is preserved when closing/consuming a descriptor.

`jobs-commands.js` adds grammar, progress output, menu selection, state snapshots and trophy adapter. Existing command modules are copied from 009 and edited only for hooks/help/choice ownership. `build.cjs` starts from `before/` (installed 009), binds scoped native renderers and guards protected routing and script tags/order. Reconcile later active-file edits before rebuilding; install tested engine/shell together with hash guards. No new production scripts or dependencies.

```powershell
node .jobs-text/build.cjs
node tests/jobs-text.test.cjs .jobs-text/cyoaftw-engine-CORE.js
node .jobs-text/browser-jobs.cjs
node .jobs-text/browser-smoke.cjs
node .jobs-text/check.cjs
```

Validation: 11 jobs/quest tests plus all 29 regression suites. SFW real-engine browser tests cover normal fixture/modal buttons, text postings, accepting work, native shift costs, paused queues, payment once, quest progress/hand-in/rewards/extra proof, abandonment costs, replaced fixtures, NPC offers/pay, trophy collection once, desktop/mobile layout and input focus. The inherited browser flow covers earlier text features. External requests are blocked; live Perchance AI is not tested. TTS/microphone playback is not implemented.

Next: inventory reading/studying, crafting/services and specialised unregistered submenus. Quest abandonment management uses the room log; leave an NPC conversation first. Bounties still require actual trophy proof, not kill counters. Job-menu collect-and-stop and NPC wage collection have different native semantics; help documents both.
