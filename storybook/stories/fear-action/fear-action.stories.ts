import type { Meta, StoryObj } from '@storybook/html'

import { setupFearAction, type FearActionArgs } from './setup'

const meta: Meta<FearActionArgs> = {
  title: 'Fear → Action/Document-first editor',
  render: (args) => setupFearAction(args),
  argTypes: {
    locale: {
      options: ['zh', 'en'],
      control: { type: 'radio' },
    },
  },
}

export default meta

type Story = StoryObj<FearActionArgs>

export const Notebook: Story = {
  args: {
    locale: 'zh',
  },
}
