import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://tobichan-astro.netlify.app',
  integrations: [
    tailwind({
      applyBaseStyles: true,
    }),
  ],
  build: {
    format: 'directory',
  },
});
