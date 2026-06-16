# CYOAFTW Project Index for LLM/Codex

Purpose: compact context for resuming work on this project. This is not end-user documentation.

## Project Shape

CYOAFTW is a Perchance-hosted choose-your-own-adventure/game prototype. The repo provides external code/data loaded into a Perchance page. Perchance provides the runtime page environment and the free text AI function via global `ai(...)`.

The core design constraint is that this is not a standalone app. Keep the Perchance integration shape intact.

## Perchance Integration Rules

- `cyoaftw-engine-CORE.html` is the main Perchance page body/shell.
- It should stay thin and load external files with script tags.
- Do not paste raw JavaScript object/function code into Perchance list/HTML areas where Perchance parses `{...}` as list syntax.
- `cyoaftw-engine-CORE_js.html` intentionally contains a `<script>...</script>` wrapper around the engine code. This file was renamed from `cyoaftw-engine-CORE.js` to make the wrapper requirement obvious and avoid future tools stripping tags.
- The main shell currently loads:
  - `cyoaftw-world-data.js?2026061402`
  - `cyoaftw-npc-data.js?2026061402`
  - `cyoaftw-context-builder.js?2026061402`
  - `cyoaftw-engine-CORE_js.html?2026061402`
- Use plain timestamp query strings like `?2026061402`, not `?v=...`, to mimic the previously working style.
- `js_cache_bust.ps1` updates those timestamp query strings.

## JavaScript Compatibility Rules

Perchance is sensitive to some modern JavaScript and/or parser contexts. Prefer the project's older, conservative style:

- Avoid optional chaining: do not use `obj?.prop`.
- Avoid nullish coalescing: do not use `value ?? fallback`.
- Avoid introducing syntax that may fail in older embedded/browser contexts.
- Existing template literals are used throughout the project and were part of the prior working style, so they are acceptable unless Perchance specifically reports a parser issue.
- Global functions are expected; inline HTML handlers call functions by name.

## Files

### `cyoaftw-engine-CORE.html`

Main Perchance page shell:

- Loads external data/context/engine files from jsDelivr/GitHub.
- Contains CSS and DOM layout.
- Current center-panel order:
  - `#roomImageWrapEl`, containing `#roomNameEl`, `#roomDescEl`, `#narrationEl`, then `#chatPanelEl`
  - `#exitGridEl`
- `#chatPanelEl` sits inside the room image wrapper after `#narrationEl`, so chat displays over the room background image.
- `#exitGridEl` is visible during exploration and hidden while an NPC interaction is active.
- Visible NPCs are rendered inline in `#narrationEl` observation sentences; clicking an NPC name opens the NPC interaction panel.
- NPC preset speech includes a `Say goodbye` disengage option that clears `G.activeNPC` and returns to exploration controls without calling AI.
- `#chatLogEl` starts fresh when moving to a different room or selecting a different NPC.
- The saved-game prompt title uses `.prompt-title`, not an `h2`, so Perchance does not derive the page title from `Continue Adventure?`.
- Room base descriptions are blended into `#narrationEl`; `#roomDescEl` is left empty to avoid repeating the title/description pair.
- Room-entry narration includes visible NPCs and visible `room.items` as observation sentences after the entry description.

### `cyoaftw-engine-CORE_js.html`

Main game engine wrapped in `<script>...</script>`.

Major responsibilities:

- Initializes `window.G`.
- Character setup flow.
- Save helper.
- Room generation and movement.
- NPC spawning and chat interaction.
- Prefetch queue using Perchance global `ai(...)`.
- Rendering room, exits, stats, NPC panel, equipment, spinner.
- Story Director state and hooks.

Important Story Director functions:

- `createStoryDirectorState()`
- `rememberStoryEvent(type, text, weight)`
- `addStoryFact(text)`
- `addStoryQuestion(text)`
- `ensureStoryThread(seed)`
- `addStoryBeat(threadId, text, intensityDelta)`
- `updateStoryOnAdventureStart(zone, roomType)`
- `updateStoryOnRoomEntered(room, direction)`
- `updateStoryOnNpcInteraction(npc, playerInput, responseText)`

Story Director hooks:

- `G.story` is initialized in `window.G`.
- `updateStoryOnAdventureStart(...)` is called in `beginAdventure()`.
- `updateStoryOnRoomEntered(...)` is called in `movePlayer(...)`.
- `updateStoryOnNpcInteraction(...)` is called after an NPC AI response.
- `story: G.story` is included in save data.

Direct AI calls:

- Room prefetch: `runPrefetchQueue()` calls `ai({ instruction: prompt, endButtons: "none" })`.
- NPC dialogue: `npcRespond(...)` calls `ai({ instruction: prompt, endButtons: "none" })`.

### `cyoaftw-context-builder.js`

Builds prompt context for AI calls.

Major responsibilities:

- Derives room/environment context via `deriveRoomContext(room)`.
- Serializes location into `serializeSceneBlock(locCtx)`.
- Serializes Story Director state into `serializeStoryDirectorBlock(story)`.
- Builds NPC persona context via `buildNPCPersonaBlock(npc, title)`.
- Combines everything in `buildPrompt(room, npc, instruction)`.

Current prompt block order:

1. Scene/location block.
2. Story Director block.
3. NPC persona block, when applicable.
4. Final instruction.

### `cyoaftw-world-data.js`

World, zone, room, structural/object templates and room-building helpers. Used by engine and context builder.

### `cyoaftw-npc-data.js`

NPC personality, age, behavior, and generation helpers. Used by engine when spawning NPCs.

### `js_cache_bust.ps1`

Updates timestamp query strings in `cyoaftw-engine-CORE.html`.

Current replacement style:

- Placeholder `?{{UTC}}}}` becomes `?<timestamp>`.
- Existing `?<digits>` becomes `?<timestamp>`.

### `README.md`

Minimal human-facing note and Perchance project link.

## Current Uncommitted State

Expected status after latest work:

- `cyoaftw-context-builder.js` modified.
- `cyoaftw-engine-CORE.html` modified.
- `cyoaftw-engine-CORE.js` deleted/renamed.
- `cyoaftw-engine-CORE_js.html` added.

Do not resurrect `cyoaftw-engine-CORE.js` unless the user explicitly asks to revert the rename.

## Recent Work Completed

- Added Story Director state and prompt integration.
- Removed optional chaining/nullish syntax from Story Director-related changes.
- Moved chat panel into the room image wrapper after narration so dialogue displays over the room background.
- Hid the exit grid during NPC interaction scenes.
- Added a preset `Say goodbye` option for disengaging from NPC interaction scenes.
- Cleared chat history on room movement and when switching to a different NPC.
- Changed the saved-game prompt label from `h2` to `.prompt-title` to avoid changing the Perchance page title.
- Blended room descriptions into room-entry narration and stopped rendering the same description separately in `#roomDescEl`.
- Added visible NPC/item observation sentences to room-entry narration.
- Renamed engine payload from `.js` to `_js.html` and wrapped it in script tags.
- Updated shell page to load the renamed engine payload.

## Recommended Next Steps

1. Confirm the Perchance page loads the renamed `cyoaftw-engine-CORE_js.html` file from jsDelivr after changes are pushed.
2. Test whether Perchance accepts the wrapped external HTML script payload from a `<script src="...">` tag. If it does not, use the same wrapper content directly in Perchance or reconsider file extension/load mechanism.
3. If Story Director works, tune narrative behavior:
   - expose current story state in a debug panel,
   - add story consequences from player choices,
   - add thread resolution,
   - make prompts more directive about using unresolved questions without over-explaining them.

## Verification Commands

Wrapped engine syntax check:

```powershell
@'
const fs = require('fs');
let source = fs.readFileSync('cyoaftw-engine-CORE_js.html', 'utf8');
source = source.replace(/^\s*<script>\s*/, '').replace(/\s*<\/script>\s*$/, '');
new Function(source);
console.log('Wrapped engine JS syntax check passed');
'@ | node -
```

Context builder syntax check:

```powershell
node --check cyoaftw-context-builder.js
```

Modern syntax check:

```powershell
Select-String -Path cyoaftw-engine-CORE_js.html,cyoaftw-context-builder.js -Pattern "\?\.|\?\?"
```
