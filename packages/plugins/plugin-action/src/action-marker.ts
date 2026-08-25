import { $nodeSchema } from '@milkdown/utils'

export const actionMarkerSchema = $nodeSchema('action_marker', () => ({
  atom: true,
  inline: true,
  group: 'inline',
  selectable: false,
  parseDOM: [{ tag: 'span[data-action-marker="true"]' }],
  toDOM: () => [
    'span',
    {
      class: 'fear-action-source-marker',
      'data-action-marker': 'true',
      contenteditable: 'false',
    },
    '@',
  ],
  parseMarkdown: {
    match: (node) => node.type === 'actionMarker',
    runner: (state, _, type) => state.addNode(type),
  },
  toMarkdown: {
    match: (node) => node.type.name === 'action_marker',
    runner: (state) => state.addNode('text', undefined, '@'),
  },
}))
