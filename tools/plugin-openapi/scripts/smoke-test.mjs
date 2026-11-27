import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Install the tarball, never a workspace link: undeclared dependencies must fail.
const root = mkdtempSync(join(tmpdir(), 'fast-track-codegen-'));
console.log(`Standalone consumer: ${root}`);
const env = {
  ...Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith('NX_'))
  ),
  NX_DAEMON: 'false',
  NX_ISOLATE_PLUGINS: 'false',
};
delete env.NODE_PATH;
const run = (command, args, cwd = root) =>
  execFileSync(command, args, { cwd, env, stdio: 'inherit' });
const write = (file, contents) => {
  const path = join(root, file);
  mkdirSync(resolve(path, '..'), { recursive: true });
  writeFileSync(path, contents);
};
const json = (file, value) => write(file, JSON.stringify(value, null, 2));

const packed = JSON.parse(
  execFileSync(
    'npm',
    ['pack', './tools/plugin-openapi', '--json', '--pack-destination', root],
    { encoding: 'utf8' }
  )
)[0];
for (const required of [
  'dist/index.js',
  'dist/index.d.ts',
  'executors.json',
  'dist/executors/swagger-generate-all/schema.json',
  'dist/executors/generate-all-client/schema.json',
]) {
  assert(
    packed.files.some(({ path }) => path === required),
    `Missing ${required}`
  );
}
json('package.json', {
  name: 'fast-track-codegen-consumer',
  private: true,
  dependencies: {
    '@open-kingdom/plugin-openapi': `file:${join(root, packed.filename)}`,
    '@nestjs/platform-express': '^11.0.0',
    '@reduxjs/toolkit': '^2.11.0',
    react: '^19.0.0',
    'react-redux': '^9.2.0',
    nx: '24.0.3',
    typescript: '^6.0.3',
  },
});
// Reuse the workspace's locked dependency versions and download cache. The
// plugin itself is installed from the tarball with only its declared runtime
// dependencies, never from the workspace link in the source lockfile.
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const manifest = JSON.parse(
  readFileSync('tools/plugin-openapi/package.json', 'utf8')
);
const consumer = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
lock.name = consumer.name;
delete lock.version;
lock.packages[''] = consumer;
lock.packages['node_modules/@open-kingdom/plugin-openapi'] = {
  version: manifest.version,
  resolved: `file:${join(root, packed.filename)}`,
  integrity: packed.integrity,
  dependencies: manifest.dependencies,
};
delete lock.packages['tools/plugin-openapi'];
json('package-lock.json', lock);
run('npm', ['ci', '--no-audit', '--no-fund', '--prefer-offline']);
json('nx.json', { plugins: [], analytics: false });
json('project.json', {
  name: 'consumer',
  targets: {
    swagger: { executor: '@open-kingdom/plugin-openapi:swagger-generate-all' },
    client: { executor: '@open-kingdom/plugin-openapi:generate-all-client' },
    'custom-client': {
      executor: '@open-kingdom/plugin-openapi:generate-all-client',
      options: { outputRoot: 'custom-api' },
    },
    typecheck: {
      executor: 'nx:run-commands',
      options: { command: 'tsc --noEmit -p tsconfig.json' },
    },
  },
});
json('apps/backend/package.json', { name: '@consumer/backend', openapi: true });
write(
  'apps/backend/src/app/app.module.ts',
  `import { Module } from '@nestjs/common';
export class AppModule {}
Module({})(AppModule);
`
);
write(
  'apps/backend/src/config/swagger.config.ts',
  `import { DocumentBuilder } from '@nestjs/swagger';
export const globalPrefix = 'api';
export const createSwaggerConfig = () => new DocumentBuilder().setTitle('Consumer API').setVersion('1.0');
`
);
// A built Nest module keeps this check independent of application build tooling.
write(
  'apps/backend/dist/app/app.module.js',
  `require('reflect-metadata');
const { Controller, Get, Module } = require('@nestjs/common');
class HealthController { health() { return { status: 'ok' }; } }
Controller('health')(HealthController);
Get()(HealthController.prototype, 'health', Object.getOwnPropertyDescriptor(HealthController.prototype, 'health'));
class AppModule {}
Module({ controllers: [HealthController] })(AppModule);
exports.AppModule = AppModule;
`
);
const apiRoot = 'libs/shared/frontend/data-access-api-client/src/lib';
const baseApi = `import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
export const baseApi = createApi({ baseQuery: fetchBaseQuery({ baseUrl: '/api' }), endpoints: () => ({}) });
`;
write(`${apiRoot}/baseApi.ts`, baseApi);
json('tsconfig.json', {
  compilerOptions: {
    target: 'ES2022',
    module: 'ESNext',
    moduleResolution: 'bundler',
    strict: true,
    skipLibCheck: true,
  },
  include: ['libs/**/*.ts', 'custom-api/**/*.ts'],
});
run('node', ['-e', "require('@open-kingdom/plugin-openapi')"]);
const nx = (target) =>
  run('npx', ['nx', 'run', `consumer:${target}`, '--output-style=static']);
nx('swagger');
const schema = JSON.parse(
  readFileSync(join(root, apiRoot, 'backend/openapi.json'))
);
assert(schema.paths['/api/health']);
assert.equal(schema.info.title, 'Consumer API');
nx('client');
const generated = readFileSync(join(root, apiRoot, 'backend/api.ts'), 'utf8');
assert.match(generated, /useHealthControllerHealthQuery/);
assert.match(generated, /injectEndpoints/);
assert.doesNotMatch(generated, /createApi\(/);

// A configured outputRoot must also be used for schema discovery.
json('custom-api/custom/openapi.json', schema);
write('custom-api/baseApi.ts', baseApi);
nx('custom-client');
assert.match(
  readFileSync(join(root, 'custom-api/index.ts'), 'utf8'),
  /custom\/api/
);
nx('typecheck');

// The packaged loader also supports source-only apps and TypeScript config.
renameSync(
  join(root, 'apps/backend/dist/app/app.module.js'),
  join(root, 'apps/backend/dist/app/app.module.js.bak')
);
nx('swagger');
assert.deepEqual(
  JSON.parse(readFileSync(join(root, apiRoot, 'backend/openapi.json'))).paths,
  {}
);

// A failing backend must make Nx fail rather than silently accept stale output.
json('apps/broken/package.json', { name: '@consumer/broken', openapi: true });
const failure = spawnSync(
  'npx',
  ['nx', 'run', 'consumer:swagger', '--output-style=static'],
  {
    cwd: root,
    env,
    encoding: 'utf8',
  }
);
assert.notEqual(failure.status, 0, failure.stdout + failure.stderr);
assert.match(failure.stdout + failure.stderr, /OpenAPI generation failed/);
write('custom-api/custom/openapi.json', '{ invalid JSON');
const clientFailure = spawnSync(
  'npx',
  ['nx', 'run', 'consumer:custom-client', '--output-style=static'],
  {
    cwd: root,
    env,
    encoding: 'utf8',
  }
);
assert.notEqual(
  clientFailure.status,
  0,
  clientFailure.stdout + clientFailure.stderr
);
console.log(
  'Standalone package, schema generation, hooks, types, custom paths, and failure propagation passed.'
);
