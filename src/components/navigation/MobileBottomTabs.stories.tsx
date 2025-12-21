import type { Meta, StoryObj } from '@storybook/react';

import { MobileBottomTabs } from './MobileBottomTabs';

const meta = {
  title: 'Navigation/MobileBottomTabs',
  component: MobileBottomTabs,
  parameters: {
    layout: 'fullscreen'
  },
  args: {
    activePath: '/dashboard'
  }
} satisfies Meta<typeof MobileBottomTabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const GroupsActive: Story = {
  args: {
    activePath: '/groups'
  }
};
