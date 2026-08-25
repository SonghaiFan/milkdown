# @fear-action/milkdown-plugin-action

A small Milkdown plugin that treats GFM task-list items as interactive action
entities while keeping the document valid, portable Markdown.

```ts
import { action } from '@fear-action/milkdown-plugin-action'

editor.use(action)
```

The Markdown owns durable content and completion (`* [ ]` / `* [x]`). Ephemeral
workflow states such as `active`, `stuck`, and `tomorrow` are decorations kept
outside the Markdown document. This is intentional: a user can ignore every
Fear → Action feature and still use the editor as a normal Markdown notebook.

The package also exports commands for creating and changing the current action,
plus an input rule that turns `@[ ] ` into a new action. It does not modify or
replace Milkdown's native `/` command menu.
