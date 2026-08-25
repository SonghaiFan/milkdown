import { listItemSchema } from '@milkdown/preset-commonmark'
import { InputRule } from '@milkdown/prose/inputrules'
import { canJoin, findWrapping } from '@milkdown/prose/transform'
import { $inputRule } from '@milkdown/utils'

import { actionMarkerSchema } from './action-marker'

/// Turn `@[ ] ` or `@[] ` at the start of an empty paragraph into an action.
/// Milkdown's native slash menu remains untouched.
export const createActionInputRule = $inputRule((ctx) => {
  const itemType = listItemSchema.type(ctx)
  const markerType = actionMarkerSchema.type(ctx)

  return new InputRule(/^\s*@\[\s?\]\s$/, (state, _, start, end) => {
    const tr = state.tr.delete(start, end)
    const $start = tr.doc.resolve(start)
    const range = $start.blockRange()
    const wrapping = range && findWrapping(range, itemType, { checked: false })
    if (!wrapping) return null

    tr.wrap(range, wrapping)

    let actionPos: number | null = null
    tr.doc.descendants((node, pos) => {
      if (
        actionPos == null &&
        node.type === itemType &&
        pos <= start &&
        start < pos + node.nodeSize
      ) {
        actionPos = pos
        return false
      }
      return actionPos == null
    })
    if (actionPos == null) return null

    tr.insert(actionPos + 2, markerType.create())

    const before = tr.doc.resolve(start - 1).nodeBefore
    if (before?.type === itemType && canJoin(tr.doc, start - 1))
      tr.join(start - 1)

    return tr
  })
})
