import { defineConfig } from '@prisma/client/runtime';
import 'dotenv/config';

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
  generator: {
    provider: 'prisma-client-js',
    output: './node_modules/.prisma/client',
  },
  schema: './prisma/schema.prisma',
});
