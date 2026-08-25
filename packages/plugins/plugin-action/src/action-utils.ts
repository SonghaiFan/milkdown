import type { Node as ProseNode } from '@milkdown/prose/model'

export function findActionPos(doc: ProseNode, rawPos: number): number | null {
  const pos = Math.max(0, Math.min(rawPos, doc.content.size))
  const nodeAtPos = doc.nodeAt(pos)
  if (nodeAtPos?.type.name === 'list_item' && nodeAtPos.attrs.checked != null)
    return pos

  const $pos = doc.resolve(pos)
  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth)
    if (node.type.name === 'list_item' && node.attrs.checked != null)
      return $pos.before(depth)
  }

  return null
}
