import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/lib/schemas/*.schema.ts',
  out: './drizzle/migrations',
  dbCredentials: {
    url: process.env['DATABASE_URL'] || 'demo.db',
  },
});
