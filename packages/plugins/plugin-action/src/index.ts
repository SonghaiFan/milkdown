export * from './action-command'
export * from './action-entity'
export * from './action-input-rule'

import type { MilkdownPlugin } from '@milkdown/ctx'

import {
  completeActionCommand,
  createActionCommand,
  moveActionToTomorrowCommand,
  reportActionFrictionCommand,
  startActionCommand,
} from './action-command'
import { actionEntityConfig, actionEntityPlugin } from './action-entity'
import { createActionInputRule } from './action-input-rule'

export const action: MilkdownPlugin[] = [
  actionEntityConfig,
  actionEntityPlugin,
  createActionInputRule,
  createActionCommand,
  startActionCommand,
  reportActionFrictionCommand,
  completeActionCommand,
  moveActionToTomorrowCommand,
].flat()
