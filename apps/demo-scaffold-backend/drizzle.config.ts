import path from 'node:path';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: path.join(__dirname, 'src/db/schema.ts'),
  out: path.join(__dirname, 'drizzle/migrations'),
  dbCredentials: {
    url: process.env['DATABASE_URL'] || 'demo.db',
  },
});
