import { $remark } from '@milkdown/utils'

interface MarkdownNode {
  type: string
  value?: string
  checked?: boolean | null
  children?: MarkdownNode[]
}

function firstParagraph(node: MarkdownNode) {
  const paragraph = node.children?.[0]
  return paragraph?.type === 'paragraph' ? paragraph : null
}

function readActionMarker(node: MarkdownNode) {
  if (node.type !== 'listItem' || node.checked == null) return

  const paragraph = firstParagraph(node)
  if (!paragraph) return

  const first = paragraph.children?.[0]
  if (first?.type !== 'text' || !first.value?.startsWith('@')) return

  const children = paragraph.children ?? []
  first.value = first.value.replace(/^@\s?/, '')
  paragraph.children = [
    { type: 'actionMarker' },
    ...(first.value ? children : children.slice(1)),
  ]
}

function visit(node: MarkdownNode) {
  readActionMarker(node)
  node.children?.forEach(visit)
}

function remarkActionSyntax() {
  return (tree: unknown) => {
    if (tree && typeof tree === 'object' && 'type' in tree)
      visit(tree as MarkdownNode)
  }
}

export const actionSyntaxRemark = $remark(
  'actionSyntax',
  () => remarkActionSyntax
)
