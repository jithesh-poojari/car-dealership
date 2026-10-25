import { execSync } from 'node:child_process';
import { config } from 'dotenv';

/** Pushes the schema into the isolated "test" schema before the suite runs. */
export default function setup() {
  const { parsed = {} } = config({ path: '.env.test', override: true });
  if (!parsed.DATABASE_URL?.includes('schema=test')) {
    throw new Error('Refusing to run: .env.test DATABASE_URL must contain ?schema=test');
  }
  execSync('pnpm prisma db push --skip-generate --force-reset', {
    stdio: 'inherit',
    env: { ...process.env, ...parsed },
  });
}
