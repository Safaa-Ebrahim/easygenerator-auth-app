import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// End-to-end tests boot the whole AppModule, so they need the .env values and
// a reachable MongoDB. SWC emits the decorator metadata Nest relies on.
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    include: ['test/**/*.e2e-spec.ts'],
    environment: 'node',
  },
});
