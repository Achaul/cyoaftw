# Text mode foundation

For the current implementation and next TTS phase, start with [TEXT_MODE.md](../TEXT_MODE.md). This folder records the earlier exploration/conversation snapshot.

Staged changes for `C:\Git\CYOADEV`. Engine and shell version: `2026-10-18-002`.

The compass center opens a persistent command dock. Enter on the keyboard and the Enter button submit the same form. The return icon restores the current room/NPC controls and cancels pending commands. Input focus returns after a command; Up/Down recalls command history.

Supported commands: `how`, `how talk`, `how do I talk`, `look`, `glance north`, `north` (all ten directions and abbreviations), `who is here`, `talk to second dwarf`, `talk to dwarf female`, `say "Hello"`, `options`, `choose 2`, `leave`, `rest`, `sleep`, `status`, `stop`, and `continue`.

Separate actions with `then`, `and`, commas, or semicolons. Quote speech containing those separators. A maximum of 12 actions and 600 input characters is accepted. Speech uses the existing 240-character conversation limit.

## Architecture

- `commands.js` contains the command registry, local parser, shared NPC targeting, AI interpretation, action adapters, queue, semantic output, and input controller. `build.cjs` embeds it in the engine before early setup initialization; no extra production script load is required.
- Registry aliases drive simple parsing and help. Argument definitions also generate the AI allowlist and validate AI results. Specialized argument parsing stays local.
- Unknown batches are interpreted in full before execution. The AI receives a short instruction, supported verb/argument shapes, and the input. No private world or NPC data is sent to the parser. Unsupported, invalid, timed-out, disabled, or failed interpretation executes nothing.
- Actions run sequentially through the existing engine handlers. Foreground NPC promises and callback-driven dialogue completion are tracked separately from background prefetch.
- Ambiguity pauses with numbered choices. Selected NPC references are rechecked for visibility before use. Failed movement, combat, incapacity, open object/item interactions, and required NPC answers pause the queue. `continue` explicitly resumes remaining actions; it does not retry a failed action. A new command replaces a paused batch. Help and stop leave an active action alone.
- State is outside `G`; queues, clarification references, input history, and pending AI interpretation are not saved. Slow AI plans are discarded after cancellation or a scene change. Loading a different player exits text mode.
- `cyoa:output` events carry a `kind`, plain `text`, and relevant speaker/status metadata. Command/help/choice/feedback events and common engine narration/dialogue outputs are separate from DOM markup. This is a starting point for the future TTS renderer; no audio is generated yet.

## Scope

This first pass covers exploration and conversation. Inventory, combat actions, fixtures, trade, and other service submenus still use their existing controls. Conversation options that open one of those submenus pause the queue. TTS and microphone input are later phases.

## Validation

Run `node .text-mode/build.cjs`, then `node --test tests/text-mode.test.cjs`.

`node .text-mode/browser-smoke.cjs` boots the complete SFW engine in a headless local browser, checks real NPC conversations and command controls at desktop/mobile widths, and writes screenshots. It blocks external network requests and does not load optional NSFW scripts. AI interpretation is exercised with controlled responses in the unit tests, not a live Perchance AI service.

`node .text-mode/check.cjs` runs existing regression suites against the staged engine. The existing job-board suite also fails against the original engine because its VM harness omits `getJobBoardWindowBlockReason`; that unrelated baseline failure is retained.

The build verifies that all original script load tags/order and the existing conversation routing remain intact.
