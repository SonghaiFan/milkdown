# Fear → Action on Milkdown

This fork explores a document-first action product. Its first principle is that
the app must remain useful as a plain Markdown editor even when every product
feature is ignored.

## Interaction model

- The primary surface is a document, not a dashboard or a form.
- Any paragraph can remain an ordinary note forever.
- Typing `@[ ] ` creates an Action without changing Milkdown's native `/`
  command syntax.
- The durable representation is standard GFM task-list Markdown: `* [ ]` and
  `* [x]`.
- An Action keeps the ordinary GFM task-item appearance. It gains no special
  static styling. Selecting it reveals four lightweight commands: start,
  report friction, complete, and move to tomorrow.
- Markdown typography, spacing, lists, and task controls use Crepe's native
  theme. The Fear → Action layer styles only the surrounding paper and workflow
  annotations.
- Questions and inputs appear as a conversational annotation beside the line,
  then disappear when the user returns to writing.
- Chinese and English are both available; Chinese is the default in the demo.

## Architecture boundary

The document owns content and completion. The Action plugin owns temporary
workflow state (`idle`, `active`, `stuck`, `tomorrow`) as ProseMirror
decorations. This keeps Markdown portable and makes it possible to introduce a
local sidecar store later without contaminating the text format.

The proof of concept lives in two places:

- `packages/plugins/plugin-action` — reusable Milkdown plugin, commands, and the
  direct `@[ ] ` input rule.
- `storybook/stories/fear-action` — A4-paper interface, bilingual copy,
  interactive Action menu, and friction prompt. Milkdown owns the slash menu.

## Run the prototype

```bash
pnpm install
pnpm --filter=@milkdown/storybook start
```

Open Storybook and select **Fear → Action / Document-first editor / Notebook**.

## Current prototype limit

Completion is serialized into Markdown. The other Action states and friction
notes intentionally live in memory for now. The next implementation step is a
local sidecar store keyed by a stable Action id, followed by sync and history.
