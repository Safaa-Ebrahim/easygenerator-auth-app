import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// Vitest's default transform (esbuild) does not emit decorator metadata, which
// Nest's dependency injection relies on, so TypeScript is compiled with SWC.
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    include: ['src/**/*.spec.ts'],
    environment: 'node',
  },
});
