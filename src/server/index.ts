import { loadEnvFiles } from './env';

loadEnvFiles();

async function main() {
  const { createApp } = await import('./app');
  const app = await createApp({
    dev: process.env.NODE_ENV !== 'production',
  });
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOSTNAME || '0.0.0.0';

  await app.listen({ port, host });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
