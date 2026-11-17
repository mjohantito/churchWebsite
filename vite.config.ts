import { defineConfig, loadEnv, type Plugin } from 'vite';
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

/**
 * Fails a production build that would ship a broken site: missing Supabase
 * settings, or a secret key pasted into a VITE_ variable (VITE_ values are
 * public and end up in the browser bundle).
 */
function checkProductionEnv(mode: string): Plugin {
  return {
    name: 'check-production-env',
    apply: 'build',
    config() {
      const env = loadEnv(mode, process.cwd(), 'VITE_');
      for (const [k, v] of Object.entries(env)) {
        const jwtRole = v.startsWith('eyJ') ? Buffer.from(v.split('.')[1] ?? '', 'base64url').toString() : '';
        if (v.startsWith('sb_secret_') || jwtRole.includes('"service_role"')) {
          throw new Error(`${k} looks like a secret/service_role key. Only the publishable (anon) key may be used in the frontend.`);
        }
      }
      if (env.VITE_USE_MOCK === 'true') {
        console.warn('\n⚠  VITE_USE_MOCK=true: this build uses mock data and does not save forms.\n');
        return;
      }
      if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
        throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set for a production build (see .env.example).');
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), preloadDisplayFont(), checkProductionEnv(mode)],
  build: {
    rollupOptions: {
      output: {
        // Long-lived vendor chunks: app changes don't invalidate these caches.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('gsap') || id.includes('lenis')) return 'motion';
          if (id.includes('react-dom') || id.includes('react-router') || id.includes('/react/') || id.includes('scheduler')) return 'react';
          if (id.includes('@tanstack') || id.includes('i18next')) return 'data';
          return undefined;
        },
      },
    },
  },
}));
