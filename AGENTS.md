# CYOAFTW project instructions

This workspace contains staged game changes, tests, and the text-mode/TTS guide.
The active development engine and shell live in `C:\Git\CYOADEV`. Before editing
game code or staging changes to those files, read and follow
[CYOADEV/AGENTS.md](../CYOADEV/AGENTS.md), including its SFW boundaries and protected
integration points. Reconcile staged baselines with the current development
files; older feature builds omit later changes.

## Text mode and future TTS: standing requirement

Read [TEXT_MODE.md](TEXT_MODE.md) before changing player actions, interaction
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
- Update `TEXT_MODE.md` when commands, supported menus, output contracts, or
  remaining coverage change. Record any deliberately deferred or legacy-only
  route accurately and mention material limits in the handoff.

TTS and microphone input are not implemented yet. Preserve the documented TTS
architecture; this standing requirement does not require adding audio playback
to unrelated game changes. It also does not expand the SFW editing boundary.
