import type { Preview } from '@storybook/react';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f5f5f5' },
        { name: 'dark', value: '#0f172a' }
      ]
    },
    controls: { expanded: true },
    a11y: {
      element: '#storybook-root'
    }
  }
};

export default preview;
