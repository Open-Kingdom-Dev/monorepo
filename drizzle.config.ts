import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: ['./libs/shared/data-access-backend-users/src/lib/schema.ts'],
  dialect: 'sqlite',
  dbCredentials: {
    url: 'file:demo.db',
  },
});
