/* eslint-disable no-console */
const esbuild = require('esbuild');

async function main() {
  await esbuild.build({
    entryPoints: ['src/server/index.ts'],
    outfile: 'dist/server/index.js',
    bundle: true,
    platform: 'node',
    target: 'node24',
    format: 'cjs',
    sourcemap: true,
    packages: 'external',
    alias: {
      '@': './src',
    },
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
