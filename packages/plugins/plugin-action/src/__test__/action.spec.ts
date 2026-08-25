import '@testing-library/jest-dom/vitest'
import {
  commandsCtx,
  defaultValueCtx,
  Editor,
  editorViewCtx,
  rootCtx,
} from '@milkdown/core'
import { commonmark } from '@milkdown/preset-commonmark'
import { gfm } from '@milkdown/preset-gfm'
import { TextSelection } from '@milkdown/prose/state'
import { getMarkdown } from '@milkdown/utils'
import { afterEach, describe, expect, it } from 'vitest'

import {
  action,
  actionEntityPluginKey,
  completeActionCommand,
  createActionCommand,
  startActionCommand,
} from '..'

const editors: Editor[] = []

async function createEditor(markdown: string) {
  const root = document.createElement('div')
  document.body.appendChild(root)
  const editor = Editor.make().config((ctx) => {
    ctx.set(rootCtx, root)
    ctx.set(defaultValueCtx, markdown)
  })
  editor.use(commonmark).use(gfm).use(action)
  await editor.create()
  editors.push(editor)
  return editor
}

function firstActionPos(editor: Editor) {
  const view = editor.ctx.get(editorViewCtx)
  let result = -1
  view.state.doc.descendants((node, pos) => {
    if (
      result < 0 &&
      node.type.name === 'list_item' &&
      node.attrs.checked != null
    )
      result = pos
    return result < 0
  })
  return result
}

function selectAction(editor: Editor, pos: number) {
  const view = editor.ctx.get(editorViewCtx)
  const selection = TextSelection.near(view.state.doc.resolve(pos + 2))
  view.dispatch(view.state.tr.setSelection(selection))
}

afterEach(async () => {
  await Promise.all(editors.splice(0).map((editor) => editor.destroy()))
  document.body.replaceChildren()
})

describe('Fear Action entity', () => {
  it('decorates task items but leaves ordinary notes alone', async () => {
    const editor = await createEditor('A normal note.\n\n* [ ] Read research\n')
    const view = editor.ctx.get(editorViewCtx)
    const pluginState = actionEntityPluginKey.getState(view.state)

    expect(pluginState?.decorations.find()).toHaveLength(1)
    expect(view.dom.querySelectorAll('.fear-action-entity')).toHaveLength(1)
  })

  it('changes runtime state without changing the Markdown text', async () => {
    const editor = await createEditor('* [ ] Read research\n')
    const pos = firstActionPos(editor)
    selectAction(editor, pos)
    editor.ctx.get(commandsCtx).call(startActionCommand.key)

    const view = editor.ctx.get(editorViewCtx)
    expect(actionEntityPluginKey.getState(view.state)?.statuses.get(pos)).toBe(
      'active'
    )
    expect(editor.action(getMarkdown())).toBe('* [ ] Read research\n')
  })

  it('serializes completion back to standard GFM Markdown', async () => {
    const editor = await createEditor('* [ ] Read research\n')
    const pos = firstActionPos(editor)
    selectAction(editor, pos)
    editor.ctx.get(commandsCtx).call(completeActionCommand.key)

    expect(editor.action(getMarkdown())).toBe('* [x] Read research\n')
  })

  it('turns the current paragraph into a portable Markdown action', async () => {
    const editor = await createEditor('Call the mentor\n')
    editor.ctx.get(commandsCtx).call(createActionCommand.key)

    expect(editor.action(getMarkdown())).toBe('* [ ] Call the mentor\n')
  })

  it('turns @[ ] followed by Space into an action', async () => {
    const editor = await createEditor('')
    const view = editor.ctx.get(editorViewCtx)
    view.dispatch(view.state.tr.insertText('@[ ]'))
    const { from, to } = view.state.selection

    const handled = view.someProp('handleTextInput', (handler) =>
      handler(view, from, to, ' ', () =>
        view.state.tr.insertText(' ', from, to)
      )
    )

    expect(handled).toBe(true)
    expect(editor.action(getMarkdown())).toMatch(/^\* \[ \]/)
  })
})
