# Function Definitions

This document summarizes the conversation-catalogue and story-reset functions that were added or expanded to support dynamic NPC dialogue, gating, and resets.

## Story / Reset Infrastructure

### `ensureStoryStateShape(story)`

Location: [cyoaftw-engine-CORE_js.html](/abs/path/C:/Git/CYOAFTW/cyoaftw-engine-CORE_js.html:1192)

Purpose:
- Normalizes the story state object.
- Ensures required fields exist:
  - `turnCounter`
  - `eventCounter`
  - `flags`
  - existing story arrays like `recentEvents`, `activeThreads`, and `unresolvedQuestions`

Use:
- Called before reading or writing story-driven gating data.
- Keeps older saves compatible with the newer system.

### `getCurrentStoryTurn()`

Location: [cyoaftw-engine-CORE_js.html](/abs/path/C:/Git/CYOAFTW/cyoaftw-engine-CORE_js.html:1208)

Purpose:
- Returns the current abstract story turn.

Use:
- Cooldowns for conversation options use this instead of real-world time.

### `advanceStoryTurn(steps = 1)`

Location: [cyoaftw-engine-CORE_js.html](/abs/path/C:/Git/CYOAFTW/cyoaftw-engine-CORE_js.html:1213)

Purpose:
- Advances the story turn counter by a chosen amount.

Use:
- Called when the player moves.
- Called when the player selects a conversation option.
- Lets dialogue cooldowns reopen after enough in-game activity.

### `setStoryFlag(flag, value = true)`

Location: [cyoaftw-engine-CORE_js.html](/abs/path/C:/Git/CYOAFTW/cyoaftw-engine-CORE_js.html:1220)

Purpose:
- Sets a named story flag on `G.story.flags`.

Use:
- Supports future gating like:
  - quest progression
  - rumor pool refreshes
  - faction states
  - world-state toggles

### `clearStoryFlag(flag)`

Location: [cyoaftw-engine-CORE_js.html](/abs/path/C:/Git/CYOAFTW/cyoaftw-engine-CORE_js.html:1227)

Purpose:
- Removes a named story flag.

Use:
- Useful for reversible states or temporary unlock conditions.

### `hasStoryFlag(flag)`

Location: [cyoaftw-engine-CORE_js.html](/abs/path/C:/Git/CYOAFTW/cyoaftw-engine-CORE_js.html:1234)

Purpose:
- Checks whether a named story flag is currently enabled.

Use:
- Convenience helper for future conditions outside the catalogue system.

### `rememberStoryEvent(type, text, weight, options = {})`

Location: [cyoaftw-engine-CORE_js.html](/abs/path/C:/Git/CYOAFTW/cyoaftw-engine-CORE_js.html:1240)

Purpose:
- Records a structured story event.
- Now stores:
  - `type`
  - `text`
  - `turn`
  - `time`
  - `eventCounter`
  - `tags`

Use:
- Conversation resets can reopen when certain story events happen.
- `options.flags` can also set story flags at the same time.

### `movePlayer(direction)`

Location: [cyoaftw-engine-CORE_js.html](/abs/path/C:/Git/CYOAFTW/cyoaftw-engine-CORE_js.html:1923)

Purpose:
- Handles room-to-room movement.

Use in this system:
- Now calls `advanceStoryTurn(1)` so movement contributes to cooldown progression.

### `chooseChatOption(option)`

Location: [cyoaftw-engine-CORE_js.html](/abs/path/C:/Git/CYOAFTW/cyoaftw-engine-CORE_js.html:3699)

Purpose:
- Handles selecting a conversation choice from the chat UI.

Use in this system:
- Advances story time.
- Records option usage through `recordNPCConversationChoice(...)`.
- Applies relationship impact and continues the dialogue flow.

## Conversation State

### `ensureNPCConversationState(npc)`

Location: [cyoaftw-npc-data.js](/abs/path/C:/Git/CYOAFTW/cyoaftw-npc-data.js:463)

Purpose:
- Ensures each NPC has a conversation state bucket in memory.

Creates and normalizes:
- `usedOptionIds`
- `sessionUsedOptionIds`
- `lastVariantByOption`
- `optionUsage`
- `interactionCount`
- `sessionInteractionCount`
- `sessionNumber`
- `lastOptionId`

Use:
- Foundation for gating, cooldowns, repeat rules, and text variation tracking.

### `resetNPCConversationSession(npc)`

Location: [cyoaftw-npc-data.js](/abs/path/C:/Git/CYOAFTW/cyoaftw-npc-data.js:483)

Purpose:
- Starts a new conversation session for an NPC.

Resets:
- `sessionUsedOptionIds`
- `sessionInteractionCount`
- `lastOptionId`

Use:
- Called when the player newly engages an NPC.
- Keeps session-only gating separate from permanent gating.

### `recordNPCConversationChoice(npc, choice)`

Location: [cyoaftw-npc-data.js](/abs/path/C:/Git/CYOAFTW/cyoaftw-npc-data.js:495)

Purpose:
- Records that a specific conversation option was used.

Tracks:
- total usage count
- session usage count
- last used story turn
- last used story event counter

Use:
- Drives repeat rules like `never` and `session`.
- Enables cooldown-based reopening with `resetTimer`.

## Conversation Catalogue

### `NPC_CONVERSATION_CATALOGUE`

Location: [cyoaftw-npc-data.js](/abs/path/C:/Git/CYOAFTW/cyoaftw-npc-data.js:538)

Purpose:
- The main data-driven list of possible conversation options.

Each entry can define:
- `id`
- `priority`
- `repeat`
- `label`
- `labelVariants`
- `text`
- `textVariants`
- `action`
- `intent`
- `relationshipImpact`
- `conditions`
- `resetTimer`
- `decay`
- `resetOnStoryFlags`
- `resetOnStoryEventTypes`
- `resetOnStoryEventTags`
- `resetOnExternalFlags`
- `resetWhen`

Use:
- Replaces hardcoded `getChatOptions(...)` logic with declarative data.

### `getNPCConversationContext(npc, extraContext = {})`

Location: [cyoaftw-npc-data.js](/abs/path/C:/Git/CYOAFTW/cyoaftw-npc-data.js:909)

Purpose:
- Builds the full context object used to filter conversation options.

Includes:
- NPC identity and traits
- relationship values
- conversation usage state
- story turn
- story flags
- recent story events
- optional external state

Use:
- Central source of truth for catalogue filtering.

### `conversationConditionMatches(conditions, ctx)`

Location: [cyoaftw-npc-data.js](/abs/path/C:/Git/CYOAFTW/cyoaftw-npc-data.js:972)

Purpose:
- Evaluates whether a catalogue entry is currently allowed.

Supports:
- species / role / temperament checks
- favor / hostility / attraction thresholds
- prior action-tag requirements
- prior option-id requirements
- story flag requirements
- story event requirements
- external flag requirements
- custom condition functions

Use:
- Core gating engine for dynamic conversations.

### `conversationOptionResetAvailable(entry, ctx, usage)`

Location: [cyoaftw-npc-data.js](/abs/path/C:/Git/CYOAFTW/cyoaftw-npc-data.js:1065)

Purpose:
- Decides whether a previously used option should become available again.

Supports reopen conditions based on:
- `resetTimer`
- `decay`
- story flags
- story event types
- story event tags
- external flags
- custom reset functions

Use:
- Makes the system future-proof by allowing time-based or event-based resets.

### `conversationRepeatAvailable(entry, ctx)`

Location: [cyoaftw-npc-data.js](/abs/path/C:/Git/CYOAFTW/cyoaftw-npc-data.js:1104)

Purpose:
- Applies repeat rules to an option.

Supported repeat styles:
- `always`
- `session`
- `never`

Use:
- Checks whether an option was already used.
- If it was used, consults `conversationOptionResetAvailable(...)` to see if it should reopen.

### `buildConversationOption(entry, npc, ctx)`

Location: [cyoaftw-npc-data.js](/abs/path/C:/Git/CYOAFTW/cyoaftw-npc-data.js:993)

Purpose:
- Converts a raw catalogue entry into a final renderable option.

Use:
- Resolves function-based labels/text.
- Picks from text variation pools.
- Produces the final button data consumed by the chat UI.

### `queryConversationCatalogue(npc, extraContext = {})`

Location: [cyoaftw-npc-data.js](/abs/path/C:/Git/CYOAFTW/cyoaftw-npc-data.js:1013)

Purpose:
- Returns the currently valid conversation options for an NPC.

Pipeline:
1. Build context.
2. Filter by repeat rules.
3. Filter by conditions.
4. Sort by priority.
5. Build final renderable options.

Use:
- Main helper used by the UI instead of hardcoded option assembly.

## UI Bridge

### `getChatOptions(npc)`

Location: [cyoaftw-engine-CORE_js.html](/abs/path/C:/Git/CYOAFTW/cyoaftw-engine-CORE_js.html:2047)

Purpose:
- UI-facing wrapper that returns the active conversation options for the current NPC.

Use:
- Calls `queryConversationCatalogue(...)`.
- Keeps the rest of the chat UI decoupled from catalogue internals.

## Extension Notes

To add a new conversation option, add a new entry to `NPC_CONVERSATION_CATALOGUE`.

For basic gating:
- Use `conditions`.

For single-use or session-limited behavior:
- Use `repeat: "never"` or `repeat: "session"`.

For time-based reopening:
- Use `resetTimer: { turns: X }`

For story-driven reopening:
- Use:
  - `resetOnStoryFlags`
  - `resetOnStoryEventTypes`
  - `resetOnStoryEventTags`

For game-state-driven reopening from outside the story system:
- Use:
  - `requiredExternalFlags`
  - `excludedExternalFlags`
  - `resetOnExternalFlags`
