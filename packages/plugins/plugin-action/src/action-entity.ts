import type { Node as ProseNode } from '@milkdown/prose/model'
import type { EditorState, Transaction } from '@milkdown/prose/state'
import type { EditorView } from '@milkdown/prose/view'

import { Plugin, PluginKey } from '@milkdown/prose/state'
import { Decoration, DecorationSet } from '@milkdown/prose/view'
import { $ctx, $prose } from '@milkdown/utils'

import { findActionPos } from './action-utils'

export type ActionStatus = 'idle' | 'active' | 'stuck' | 'done' | 'tomorrow'

export interface ActionSelection {
  pos: number
  text: string
  checked: boolean
  status: ActionStatus
  element: HTMLElement | null
}

export interface ActionEntityConfig {
  onActionSelected?: (action: ActionSelection, view: EditorView) => void
  onActionDeselected?: (view: EditorView) => void
}

export interface ActionEntityState {
  decorations: DecorationSet
  statuses: Map<number, ActionStatus>
}

interface ActionEntityMeta {
  pos: number
  status: ActionStatus
}

export const actionEntityConfig = $ctx<
  ActionEntityConfig,
  'actionEntityConfig'
>({}, 'actionEntityConfig')

export const actionEntityPluginKey = new PluginKey<ActionEntityState>(
  'FEAR_ACTION_ENTITY'
)

function isAction(node: ProseNode | null | undefined) {
  return node?.type.name === 'list_item' && node.attrs.checked != null
}

function remapStatuses(transaction: Transaction, state: ActionEntityState) {
  const mapped = new Map<number, ActionStatus>()
  state.statuses.forEach((status, pos) => {
    const result = transaction.mapping.mapResult(pos, 1)
    if (!result.deleted) mapped.set(result.pos, status)
  })
  return mapped
}

function normalizeStatuses(
  doc: ProseNode,
  previous: Map<number, ActionStatus>
) {
  const statuses = new Map<number, ActionStatus>()
  doc.descendants((node, pos) => {
    if (!isAction(node)) return true

    const oldStatus = previous.get(pos)
    const status = node.attrs.checked
      ? 'done'
      : oldStatus === 'done'
        ? 'idle'
        : (oldStatus ?? 'idle')
    statuses.set(pos, status)
    return true
  })
  return statuses
}

function createDecorations(
  doc: ProseNode,
  statuses: Map<number, ActionStatus>
) {
  const decorations: Decoration[] = []
  doc.descendants((node, pos) => {
    if (!isAction(node)) return true

    const status = statuses.get(pos) ?? 'idle'
    decorations.push(
      Decoration.node(
        pos,
        pos + node.nodeSize,
        {
          class: `fear-action-entity fear-action-${status}`,
          'data-action-state': status,
          'data-action-entity': 'true',
        },
        { actionEntity: true, status }
      )
    )
    return true
  })
  return DecorationSet.create(doc, decorations)
}

function createState(
  doc: ProseNode,
  statuses = new Map<number, ActionStatus>()
): ActionEntityState {
  const normalized = normalizeStatuses(doc, statuses)
  return {
    statuses: normalized,
    decorations: createDecorations(doc, normalized),
  }
}

function getActionSelection(
  view: EditorView,
  rawPos: number
): ActionSelection | null {
  const pos = findActionPos(view.state.doc, rawPos)
  if (pos == null) return null

  const node = view.state.doc.nodeAt(pos)
  if (!isAction(node)) return null

  const state = actionEntityPluginKey.getState(view.state)
  return {
    pos,
    text: node?.textContent ?? '',
    checked: Boolean(node?.attrs.checked),
    status: state?.statuses.get(pos) ?? (node?.attrs.checked ? 'done' : 'idle'),
    element: view.nodeDOM(pos) as HTMLElement | null,
  }
}

export function getActionStatus(
  state: EditorState,
  pos: number
): ActionStatus | null {
  return actionEntityPluginKey.getState(state)?.statuses.get(pos) ?? null
}

export const actionEntityPlugin = $prose((ctx) => {
  const config = ctx.get(actionEntityConfig.key)

  return new Plugin<ActionEntityState>({
    key: actionEntityPluginKey,
    state: {
      init: (_, state) => createState(state.doc),
      apply: (transaction, pluginState) => {
        const mapped = remapStatuses(transaction, pluginState)
        const meta = transaction.getMeta(
          actionEntityPluginKey
        ) as ActionEntityMeta | null
        if (meta) mapped.set(transaction.mapping.map(meta.pos), meta.status)
        return createState(transaction.doc, mapped)
      },
    },
    props: {
      decorations: (state) =>
        actionEntityPluginKey.getState(state)?.decorations ?? null,
      handleClick: (view, pos) => {
        const action = getActionSelection(view, pos)
        if (action) config.onActionSelected?.(action, view)
        return false
      },
    },
    view: (view) => {
      let previousSignature = ''
      const notify = () => {
        const action = getActionSelection(view, view.state.selection.from)
        const signature = action
          ? `${action.pos}:${action.status}:${action.checked}`
          : ''
        if (signature === previousSignature) return

        previousSignature = signature
        if (action) config.onActionSelected?.(action, view)
        else config.onActionDeselected?.(view)
      }

      notify()
      return { update: notify }
    },
  })
})
