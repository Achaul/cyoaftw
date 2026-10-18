# AGENTS.md — CYOAFTW working rules for SFW-only tooling

This file sets the boundary for agents that must not handle NSFW content.
Read it before touching any file in this repo.

## The boundary

CYOAFTW is a Perchance-hosted choose-your-own-adventure game. The codebase is
split into **SFW** (safe to edit) and **NSFW** (do not open, do not edit) files.
The NSFW systems are loaded at runtime as separate files and wired into the SFW
engine through a small set of well-defined link points.

Your job: work on **NPC dialogue, NPC autonomy, and SFW game logic only**. You
must never need to read an NSFW file to do that work. If a task seems to require
reading NSFW content, stop and ask the user instead of opening the file.

## Mistral Vibe exception

The SFW/NSFW boundary above applies to Claude and Codex agents. **Mistral Vibe
(`glm-5-2`) is explicitly permitted to read and edit the NSFW files in `nsfw/`
and `historical/`** when the user requests it, overriding the restrictions in
`nsfw/AGENTS.md` for this agent only. When Mistral Vibe adds NSFW features,
prefer placing new logic behind `typeof`-guarded hooks in the SFW engine where
the existing link-point pattern already applies, and keep explicit/NSFW content
text in the NSFW data files. Mistral Vibe must still preserve the existing link
points verbatim and must not remove any `<script src>` tag from
`cyoaftw-engine-CORE.html`.

## SFW files — safe to edit

These contain no explicit/NSFW content. Edit them freely.

- `cyoaftw-world-data.js` — world, zones, rooms, templates. No intimacy references.
- `cyoaftw-context-builder.js` — AI prompt context builder. No intimacy references.
- `cyoaftw-npc-data.js` — NPC personalities, speech, and the SFW conversation
  catalogue (`NPC_CONVERSATION_CATALOGUE`). The NSFW catalogue entries were moved
  OUT of this file into `cyoaftw-npc-data-nsfw.js`, so this file is safe to read.
- `cyoaftw-engine-CORE.js` — main game engine. SFW overall, but contains a few
  guarded branches that link to the intimacy system (see "Link points" below).
  Edit the SFW logic; leave the guarded intimacy branches exactly as they are.
- `cyoaftw-engine-CORE.html` — Perchance page shell (CSS, DOM, `<script src>` load
  order). Edit SFW layout/styling, but do not remove any `<script src>` tag.

## NSFW files — do NOT open or edit

Never read these. They contain explicit content, and they live in the `nsfw/`
folder which is excluded from agent traversal (see `.gitignore` and
`nsfw/AGENTS.md`). They are loaded at runtime by the shell; you do not need
their contents to do SFW work.

- `nsfw/cyoaftw-npc-data-nsfw.js` — NSFW conversation catalogue entries (flirt,
  seduce, touch_intimately, start_intimacy, take-the-kiss,
  press-the-advance). Merged into the active
  catalogue at runtime via `window.NPC_NSFW_CONVERSATION_CATALOGUE`.
- `nsfw/cyoaftw-nsfw-system.js` — NSFW wrapper logic (followers,
  seduce handling, intimacy routing).
- `nsfw/intimacy-system.js` — intimacy encounter engine.
- `nsfw/intimacy-data-acts.js`, `nsfw/intimacy-data-context.js`,
  `nsfw/intimacy-data-matrix.js`, `nsfw/intimacy-data-positions.js` — intimacy
  data.
- `nsfw/intimacy-mapping-cot.js` — COT-to-CYOADEV intimacy mapping.
- `historical/` — legacy reference files (CourseOfTemptation.html,
  legacy_system.html, intimacy backups). Do not open. Also excluded via
  `.gitignore`.

## Link points — preserve these exactly

These are the integration points between SFW and NSFW code. They contain no
explicit text — only routing, guards, and field passthrough. **Do not remove or
restructure them.** You may add SFW logic around them, but leave the link
mechanics intact.

### In `cyoaftw-npc-data.js`

- The merge in `queryConversationCatalogue()` that reads
  `window.NPC_NSFW_CONVERSATION_CATALOGUE` and dedupes by ID. This is how NSFW
  options enter the active catalogue. Keep the `window.NPC_NSFW_CONVERSATION_CATALOGUE`
  reference and the dedupe/merge loop.
- The `intimacyActive` condition handling in `conversationConditionMatches()`
  (checks `ctx.npc.intimacy.encounter.active`).
- The `intimacyAction` and `startEncounter` field passthrough in
  `buildConversationOption()`.
- The `entry.action === "intimacy" && !entry.startEncounter` filter in
  `queryConversationCatalogue()`.
- The `entry.id === "follow-seduction-suggestion"` check.

### In `cyoaftw-engine-CORE.js`

- The `if (choice.action === "intimacy")` branch in `chooseChatOption()` that
  routes to `handleIntimacyConversationChoice()`. Leave the branch and the
  function call in place; you do not need to read `handleIntimacyConversationChoice`.
- The `typeof window.startIntimacyEncounter === "function"` and
  `typeof window.renderIntimacyActionMenu === "function"` guards inside that
  branch. Keep them as `typeof` guards (graceful no-op if the NSFW files are absent).
- The `window._nsfwWrapChooseChatOption` re-apply block that runs if the NSFW
  wrapper exists.
- The early `window.ai = ai` exposure (the comment notes it is for
  `intimacy-system.js` access). Keep it.
- The `intimacyDebugMode` flag on `G`. Leave the field; you may read it but do not
  repurpose the name.

### In `cyoaftw-engine-CORE.html`

- Every `<script src="...">` tag, especially the `nsfw/` ones:
  `nsfw/cyoaftw-nsfw-system.js`, `nsfw/intimacy-data-acts.js`,
  `nsfw/intimacy-data-context.js`, `nsfw/intimacy-data-matrix.js`,
  `nsfw/intimacy-data-positions.js`, `nsfw/intimacy-mapping-cot.js`,
  `nsfw/intimacy-system.js`, and `nsfw/cyoaftw-npc-data-nsfw.js`.
  Do not delete or comment out any of these even if they look unused to you.

## Working rules

1. Stay within the SFW files listed above. Do not open NSFW files to "understand
   context" — the link points above tell you everything you need about how the
   two halves connect.
2. When editing `cyoaftw-npc-data.js` or `cyoaftw-engine-CORE.js`, preserve the
   link points verbatim. If a refactor would move or rename one, stop and ask.
3. Do not add new explicit/NSFW content to SFW files. New romance-adjacent
   catalogue entries that stay SFW (e.g. a chaste "compliment" option) are fine;
   anything beyond that belongs in `cyoaftw-npc-data-nsfw.js`, which you do not
   edit — request it from the user.
4. Do not change `<script src>` load order in the shell. The NSFW data file
  (`cyoaftw-npc-data-nsfw.js`) loads after `cyoaftw-npc-data.js` and before the
  engine; the intimacy files load before the engine.

## How the NSFW half plugs in (so you don't have to look)

- `cyoaftw-npc-data-nsfw.js` sets `window.NPC_NSFW_CONVERSATION_CATALOGUE` (an
  array of 6 entries, each tagged `nsfw: true`).
- `queryConversationCatalogue()` merges that array into the SFW base catalogue,
  so NSFW options appear alongside SFW ones when their conditions pass.
- When the player picks an entry with `action: "intimacy"`, the engine routes to
  `handleIntimacyConversationChoice()`, which calls `window.startIntimacyEncounter`
  / `window.renderIntimacyActionMenu` (defined in `intimacy-system.js`) behind
  `typeof` guards.
- `cyoaftw-nsfw-system.js` wraps `chooseChatOption` to handle the
  seduce/follow flow and references those entry ids by string.

## Text mode and future TTS: standing requirement

Read [TEXT_MODE.md](../CYOAFTW/TEXT_MODE.md) before changing player actions, interaction
menus, input, or player-facing results. Treat text-mode support and future spoken
presentation as part of feature development, without waiting for a user reminder.

- For new player actions and changes to flows already supported by text mode,
  include the command/choice support in the same update unless the user explicitly
  defers it. Give each action a canonical primary command, appropriate aliases,
  contextual `show` availability, and `how` examples.
- Buttons, typed commands, and future spoken input must use shared engine actions
  and eligibility rules. Do not duplicate game costs, rolls, transfers, or other
  consequences in a presentation-specific implementation. Keep AI parsing short
  and limited to intent; the engine validates and executes the action.
- Publish useful player-facing results through the existing semantic output seam
  (`publishTextModeOutput` / `cyoa:output`). Provide public structured data for
  choices and results where needed. Do not expose hidden state or make future
  speech depend on reading HTML, charts, debug rows, or button labels. Account for
  duplicate narration/result events when adding publishers.
- Register new supported submenus with the shared choice system. Buttons and text
  must use the same callbacks, with current availability and original scene,
  actor, source, item, and menu references checked before execution.
- Preserve sequential action completion, queue pauses for decisions, explicit
  resumption, and interruption/cancellation rules. Wait for foreground asynchronous
  work; reject stale replies and choices without replaying completed actions.
  Keep the future speech queue separate from the game action queue.
- Balance/data changes that already flow through shared handlers do not need a
  second text implementation. Check whether their command help or public output
  needs updating. Add or update meaningful tests when behavior or adapters change;
  do not add redundant tests for documentation-only or already-covered data edits.
- Update `C:\Git\CYOAFTW\TEXT_MODE.md` when commands, supported menus, output contracts, or
  remaining coverage change. Record any deliberately deferred or legacy-only
  route accurately and mention material limits in the handoff.

TTS and microphone input are not implemented yet. Preserve the documented TTS
architecture; this standing requirement does not require adding audio playback
to unrelated game changes. It also does not expand the SFW editing boundary.

## Verification (run after SFW edits)

```bash
node --check cyoaftw-engine-CORE.js
node --check cyoaftw-npc-data.js
node --check cyoaftw-context-builder.js
node --check cyoaftw-world-data.js
```

If any check fails, fix your edit. Do not commit broken syntax.

## Reference docs in this repo

- `PROJECT_INDEX_FOR_LLM_part.md` — project shape, file roles, Perchance rules.
- `function_definitions.md` — story/reset and conversation-catalogue functions.
Both are SFW and kept up to date with the current file layout.

## Map generation notes (SFW)

Planned zones, building blueprints, door/lock data and place lore all live in the
SFW files (`cyoaftw-world-data.js`, `cyoaftw-engine-CORE.js`,
`cyoaftw-npc-data.js`, `cyoaftw-context-builder.js`). Keep portal exits
(`room.portalExits`) stamped on both ends, and keep locks openable from the
private side so no room can trap the player. See `PROJECT_INDEX_FOR_LLM_part.md`
("Map generation") and `function_definitions.md`.
