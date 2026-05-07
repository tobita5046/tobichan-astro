import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://tobichan-astro.netlify.app',
  integrations: [
    tailwind({
      applyBaseStyles: true,
    }),
    sitemap(),
  ],
  build: {
    format: 'directory',
  },
});
