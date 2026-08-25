export * from './action-command'
export * from './action-entity'
export * from './action-input-rule'
export * from './action-marker'
export * from './action-syntax'

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
import { actionMarkerSchema } from './action-marker'
import { actionSyntaxRemark } from './action-syntax'

export const action: MilkdownPlugin[] = [
  actionEntityConfig,
  actionSyntaxRemark,
  actionMarkerSchema,
  actionEntityPlugin,
  createActionInputRule,
  createActionCommand,
  startActionCommand,
  reportActionFrictionCommand,
  completeActionCommand,
  moveActionToTomorrowCommand,
].flat()
