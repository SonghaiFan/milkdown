import type { ActionSelection } from '@fear-action/milkdown-plugin-action'

import {
  action,
  actionEntityConfig,
  completeActionCommand,
  moveActionToTomorrowCommand,
  reportActionFrictionCommand,
  startActionCommand,
} from '@fear-action/milkdown-plugin-action'
import { Crepe } from '@milkdown/crepe'
import classic from '@milkdown/crepe/theme/classic.css?inline'
import all from '@milkdown/crepe/theme/common/style.css?inline'
import { commandsCtx } from '@milkdown/kit/core'

import { wrapInShadow } from '../utils/shadow'
import localStyle from './style.css?inline'

export interface FearActionArgs {
  locale: 'zh' | 'en'
}

const copy = {
  zh: {
    notebook: '行动笔记',
    language: 'EN',
    saved: '已保存到本地文档',
    placeholder: '像写笔记一样开始。输入 / 查看命令…',
    hint: '输入 @[ ] 再按空格创建 Action；/ 保持 Milkdown 原生命令',
    actionCount: (count: number) => `${count} 个 Action`,
    start: '▶  开始行动',
    stuck: '?  我卡住了',
    done: '[x]  完成',
    tomorrow: '→  移到明天',
    stuckQuestion: '什么在阻碍你？先写下一个更小、真正能做的下一步。',
    stepPlaceholder: '最小的下一步…',
    remember: '记下',
    remembered: '已附在这次行动上',
  },
  en: {
    notebook: 'Action notebook',
    language: '中文',
    saved: 'Saved to the local document',
    placeholder: 'Start as if this were a notebook. Type / for commands…',
    hint: 'Type @[ ] then Space for an Action; / remains native Milkdown',
    actionCount: (count: number) => `${count} actions`,
    start: '▶  Start',
    stuck: '?  I’m stuck',
    done: '[x]  Complete',
    tomorrow: '→  Move to tomorrow',
    stuckQuestion:
      'What is getting in the way? Write one smaller next step you can actually do.',
    stepPlaceholder: 'The smallest next step…',
    remember: 'Keep it',
    remembered: 'Attached to this action',
  },
} as const

const markdown = {
  zh: `# 8 月 25 日，星期二

今天有点乱。先把事情写下来，不急着整理。

## 今天

* [ ] @把 Milkdown 编辑器变成可以行动的笔记本
* [ ] @给导师发送产品方向更新
* [x] @整理昨天访谈里的三个关键句子
* [ ] @读完研究笔记，标出与“行动阻力”有关的段落
* [ ] 普通 Markdown task：确认参考资料链接

普通文字只是笔记。它不会因为这个 app 而被迫变成表单或任务。

我发现真正的困难不是“不知道要做什么”，而是下一步在当下显得太大。Action 应该允许我在原来的文字里，轻轻地改变它的状态。

## 接下来几天

* [ ] @周三：把 onboarding 缩成一页纸
* [ ] @周四：找两个人测试斜杠菜单
* [ ] @周五：回看一周里所有“我卡住了”

## 随手记

界面首先是一张纸。命令、按钮和状态都只是纸边上的批注；不需要它们时，它们就消失。
`,
  en: `# Tuesday, August 25

My head feels noisy today. Write first; organise later.

## Today

* [ ] @Turn the Milkdown editor into a notebook that can act
* [ ] @Send the product direction update to my mentor
* [x] @Pull three useful quotes from yesterday’s interview
* [ ] @Read the research notes and mark passages about action friction
* [ ] Plain Markdown task: verify the reference links

Ordinary text is just a note. This app should never force it into a form or a task.

The hard part is often not knowing what to do. It is that the next step feels too large right now. An Action should let me change the state of a sentence without leaving the document.

## The next few days

* [ ] @Wednesday: reduce onboarding to one sheet of paper
* [ ] @Thursday: test the slash menu with two people
* [ ] @Friday: review every moment where I said “I’m stuck”

## Margin note

The interface is a sheet of paper first. Commands, buttons and state are annotations in the margin; when I do not need them, they disappear.
`,
} as const

function actionCount(value: string) {
  return value.match(/^\s*[*+-]\s+\[[ xX]\]\s+@/gm)?.length ?? 0
}

export function setupFearAction(args: FearActionArgs) {
  const {
    wrapper: shell,
    root,
    shadow,
  } = wrapInShadow([all, classic, localStyle])
  shell.className = 'fear-action-shell'
  shell.innerHTML = `
    <header class="fear-header">
      <span class="fear-wordmark">Fear <i>→</i> Action</span>
      <span class="fear-document-name"></span>
      <button class="fear-language" type="button"></button>
    </header>
    <main class="fear-paper">
      <div class="fear-editor" aria-label="Fear Action notebook"></div>
      <aside class="fear-action-menu" hidden>
        <div class="fear-action-commands">
          <button type="button" data-command="start"></button>
          <button type="button" data-command="stuck"></button>
          <button type="button" data-command="done"></button>
          <button type="button" data-command="tomorrow"></button>
        </div>
        <div class="fear-friction" hidden>
          <label></label>
          <div class="fear-friction-row">
            <input type="text" />
            <button type="button"></button>
          </div>
          <small hidden></small>
        </div>
      </aside>
    </main>
    <footer class="fear-footer">
      <span class="fear-hint"></span>
      <span class="fear-status"></span>
    </footer>
  `

  const editorRoot = shell.querySelector<HTMLElement>('.fear-editor')!
  const paper = shell.querySelector<HTMLElement>('.fear-paper')!
  const menu = shell.querySelector<HTMLElement>('.fear-action-menu')!
  const friction = shell.querySelector<HTMLElement>('.fear-friction')!
  const frictionInput = friction.querySelector<HTMLInputElement>('input')!
  const frictionSaved = friction.querySelector<HTMLElement>('small')!
  const languageButton =
    shell.querySelector<HTMLButtonElement>('.fear-language')!
  const status = shell.querySelector<HTMLElement>('.fear-status')!

  let locale = args.locale
  let crepe: Crepe | null = null
  let activeAction: ActionSelection | null = null
  let currentMarkdown: string = markdown[locale]
  const frictionNotes = new Map<string, string>()

  const setCopy = () => {
    const text = copy[locale]
    shell.querySelector<HTMLElement>('.fear-document-name')!.textContent =
      text.notebook
    languageButton.textContent = text.language
    shell.querySelector<HTMLElement>('.fear-hint')!.textContent = text.hint
    menu.querySelector<HTMLButtonElement>(
      '[data-command="start"]'
    )!.textContent = text.start
    menu.querySelector<HTMLButtonElement>(
      '[data-command="stuck"]'
    )!.textContent = text.stuck
    menu.querySelector<HTMLButtonElement>(
      '[data-command="done"]'
    )!.textContent = text.done
    menu.querySelector<HTMLButtonElement>(
      '[data-command="tomorrow"]'
    )!.textContent = text.tomorrow
    friction.querySelector<HTMLElement>('label')!.textContent =
      text.stuckQuestion
    frictionInput.placeholder = text.stepPlaceholder
    friction.querySelector<HTMLButtonElement>('button')!.textContent =
      text.remember
    frictionSaved.textContent = text.remembered
    status.textContent = `${text.saved} · ${text.actionCount(actionCount(currentMarkdown))}`
  }

  const hideActionMenu = () => {
    activeAction = null
    menu.hidden = true
    friction.hidden = true
  }

  const showActionMenu = (actionSelection: ActionSelection) => {
    activeAction = actionSelection
    menu.hidden = false
    friction.hidden = actionSelection.status !== 'stuck'
    menu.dataset.status = actionSelection.status

    const actionRect = actionSelection.element?.getBoundingClientRect()
    const paperRect = paper.getBoundingClientRect()
    if (actionRect) {
      menu.style.top = `${actionRect.bottom - paperRect.top + 7}px`
      menu.style.left = `${Math.max(
        24,
        Math.min(actionRect.left - paperRect.left + 20, paperRect.width - 390)
      )}px`
    }

    const note = frictionNotes.get(actionSelection.text)
    frictionInput.value = note ?? ''
    frictionSaved.hidden = !note
  }

  const createEditor = async (value: string) => {
    const text = copy[locale]
    editorRoot.replaceChildren()
    hideActionMenu()

    const next = new Crepe({
      root: editorRoot,
      defaultValue: value,
      features: {
        [Crepe.Feature.CodeMirror]: false,
        [Crepe.Feature.ImageBlock]: false,
        [Crepe.Feature.Table]: false,
        [Crepe.Feature.Latex]: false,
        [Crepe.Feature.TopBar]: false,
        [Crepe.Feature.AI]: false,
      },
      featureConfigs: {
        [Crepe.Feature.Placeholder]: { text: text.placeholder },
        [Crepe.Feature.BlockEdit]: {
          blockHandle: {
            shouldShow: () => false,
          },
        },
      },
    })

    next.editor
      .config((ctx) => {
        ctx.set(actionEntityConfig.key, {
          onActionSelected: (selection: ActionSelection) =>
            showActionMenu(selection),
          onActionDeselected: () => hideActionMenu(),
        })
      })
      .use(action)

    next.on((listener) => {
      listener.markdownUpdated((_, value) => {
        currentMarkdown = value
        status.textContent = `${text.saved} · ${text.actionCount(actionCount(value))}`
      })
    })

    await next.create()
    crepe = next
  }

  menu.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-command]'
    )
    if (!button || !activeAction || !crepe) return

    const commands = {
      start: startActionCommand,
      stuck: reportActionFrictionCommand,
      done: completeActionCommand,
      tomorrow: moveActionToTomorrowCommand,
    } as const
    const command = commands[button.dataset.command as keyof typeof commands]
    if (!command) return

    const nextStatus = {
      start: 'active',
      stuck: 'stuck',
      done: 'done',
      tomorrow: 'tomorrow',
    } as const
    const commandName = button.dataset.command as keyof typeof nextStatus
    const pos = activeAction.pos
    crepe.editor.action((ctx) =>
      ctx.get(commandsCtx).call(command.key, { pos })
    )
    activeAction = {
      ...activeAction,
      status: nextStatus[commandName],
      checked: commandName === 'done',
    }
    menu.dataset.status = nextStatus[commandName]
    if (commandName === 'stuck') {
      friction.hidden = false
      frictionInput.focus()
    }
  })

  const rememberFriction = () => {
    if (!activeAction) return
    const value = frictionInput.value.trim()
    if (value) frictionNotes.set(activeAction.text, value)
    else frictionNotes.delete(activeAction.text)
    frictionSaved.hidden = !value
  }
  friction
    .querySelector<HTMLButtonElement>('button')!
    .addEventListener('click', rememberFriction)
  frictionInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') rememberFriction()
  })

  languageButton.addEventListener('click', () => {
    const value = crepe?.getMarkdown() ?? currentMarkdown
    locale = locale === 'zh' ? 'en' : 'zh'
    currentMarkdown = value
    setCopy()
    void crepe
      ?.destroy()
      .then(() => createEditor(value))
      .catch(console.error)
  })

  setCopy()
  void createEditor(currentMarkdown).catch(console.error)
  shadow.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    if (!target.closest('.fear-paper')) hideActionMenu()
  })

  return root
}
