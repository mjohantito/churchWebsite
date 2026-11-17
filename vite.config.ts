import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Preloads the display font (Plus Jakarta Sans 800, latin) so the big
 * headings render in the right face on first paint. The file name is
 * hashed at build time, so it is looked up in the bundle.
 */
function preloadDisplayFont(): Plugin {
  return {
    name: 'preload-display-font',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const file = Object.keys(ctx.bundle ?? {}).find((name) =>
          /plus-jakarta-sans-latin-800-normal-[\w-]+\.woff2$/.test(name),
        );
        if (!file) throw new Error('Display font file not found in bundle; preload not injected');
        return [
          {
            tag: 'link',
            attrs: { rel: 'preload', href: `/${file}`, as: 'font', type: 'font/woff2', crossorigin: '' },
            injectTo: 'head-prepend',
          },
        ];
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), preloadDisplayFont()],
});
