import type { Node as ProseNode } from '@milkdown/prose/model'

export function isActionNode(node: ProseNode | null | undefined) {
  if (node?.type.name !== 'list_item' || node.attrs.checked == null)
    return false

  let found = false
  node.descendants((child) => {
    if (child.type.name !== 'action_marker') return true
    found = true
    return false
  })
  return found
}

export function findActionPos(doc: ProseNode, rawPos: number): number | null {
  const pos = Math.max(0, Math.min(rawPos, doc.content.size))
  const nodeAtPos = doc.nodeAt(pos)
  if (isActionNode(nodeAtPos)) return pos

  const $pos = doc.resolve(pos)
  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth)
    if (isActionNode(node)) return $pos.before(depth)
  }

  return null
}
