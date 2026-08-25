import { listItemSchema } from '@milkdown/preset-commonmark'
import { wrappingInputRule } from '@milkdown/prose/inputrules'
import { $inputRule } from '@milkdown/utils'

/// Turn `@[ ] ` or `@[] ` at the start of an empty paragraph into an action.
/// Milkdown's native slash menu remains untouched.
export const createActionInputRule = $inputRule((ctx) =>
  wrappingInputRule(/^\s*@\[\s?\]\s$/, listItemSchema.type(ctx), () => ({
    checked: false,
  }))
)
