import { defineConfig } from 'drizzle-kit';
import * as path from 'path';

export default defineConfig({
  dialect: 'sqlite',
  schema: path.join(__dirname, 'src/db/schema.ts').replace(/\\/g, '/'),
  out: path.join(__dirname, 'drizzle/migrations'),
  dbCredentials: {
    url: process.env['DATABASE_URL'] || path.join(__dirname, 'demo.db'),
  },
});
