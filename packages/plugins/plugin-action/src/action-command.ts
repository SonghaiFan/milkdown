import type { Command, EditorState } from '@milkdown/prose/state'

import { listItemSchema } from '@milkdown/preset-commonmark'
import { wrapIn } from '@milkdown/prose/commands'
import { $command } from '@milkdown/utils'

import { actionEntityPluginKey, type ActionStatus } from './action-entity'
import { actionMarkerSchema } from './action-marker'
import { findActionPos } from './action-utils'

export interface ActionCommandPayload {
  pos?: number
}

function resolveActionPos(
  state: EditorState,
  payload?: ActionCommandPayload
): number | null {
  return findActionPos(state.doc, payload?.pos ?? state.selection.from)
}

function updateAction(
  status: ActionStatus,
  checked?: boolean
): (payload?: ActionCommandPayload) => Command {
  return (payload) => (state, dispatch) => {
    const pos = resolveActionPos(state, payload)
    if (pos == null) return false

    let tr = state.tr.setMeta(actionEntityPluginKey, { pos, status })
    const node = state.doc.nodeAt(pos)
    if (checked != null && node?.attrs.checked !== checked)
      tr = tr.setNodeAttribute(pos, 'checked', checked)

    dispatch?.(tr)
    return true
  }
}

export const createActionCommand = $command('CreateAction', (ctx) => () => {
  const itemType = listItemSchema.type(ctx)
  const markerType = actionMarkerSchema.type(ctx)

  return (state, dispatch) => {
    if (!dispatch) return wrapIn(itemType, { checked: false })(state)

    let nextTransaction = state.tr
    const wrapped = wrapIn(itemType, { checked: false })(state, (tr) => {
      nextTransaction = tr
    })
    if (!wrapped) return false

    let actionPos: number | null = null
    const selectionPos = nextTransaction.selection.from
    nextTransaction.doc.descendants((node, pos) => {
      if (
        actionPos == null &&
        node.type === itemType &&
        pos <= selectionPos &&
        selectionPos < pos + node.nodeSize
      ) {
        actionPos = pos
        return false
      }
      return actionPos == null
    })
    if (actionPos == null) return false

    dispatch(nextTransaction.insert(actionPos + 2, markerType.create()))
    return true
  }
})

export const startActionCommand = $command('StartAction', () =>
  updateAction('active', false)
)

export const reportActionFrictionCommand = $command(
  'ReportActionFriction',
  () => updateAction('stuck', false)
)

export const completeActionCommand = $command('CompleteAction', () =>
  updateAction('done', true)
)

export const moveActionToTomorrowCommand = $command(
  'MoveActionToTomorrow',
  () => updateAction('tomorrow', false)
)
