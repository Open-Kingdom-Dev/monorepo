import 'reflect-metadata';
import { join } from 'path';
import { readdirSync, existsSync, readFileSync } from 'fs';
import { DocumentBuilder } from '@nestjs/swagger';
import { generateOpenApi } from './openapi-generator';

interface OpenApiConfig {
  enabled?: boolean;
  outputPath?: string;
}

interface Backend {
  name: string;
  root: string;
  version?: string;
  openApiConfig?: OpenApiConfig;
}

const workspaceRoot = process.argv[2] || process.cwd();

function findBackends(): Backend[] {
  const backends: Backend[] = [];
  const appsDir = join(workspaceRoot, 'apps');

  if (!existsSync(appsDir)) return backends;

  const dirs = readdirSync(appsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const dir of dirs) {
    const projectRoot = join(workspaceRoot, 'apps', dir);
    const packageJsonPath = join(projectRoot, 'package.json');

    if (!existsSync(packageJsonPath)) continue;

    try {
      const packageJson = JSON.parse(
        readFileSync(packageJsonPath, 'utf-8')
      ) as {
        name?: string;
        version?: string;
        openapi?: boolean | OpenApiConfig;
      };

      // Check if OpenAPI is enabled (either boolean true or config object with enabled: true)
      const openApiEnabled =
        packageJson.openapi === true ||
        (typeof packageJson.openapi === 'object' &&
          packageJson.openapi.enabled !== false);

      if (openApiEnabled) {
        const openApiConfig =
          typeof packageJson.openapi === 'object'
            ? packageJson.openapi
            : undefined;

        backends.push({
          name: packageJson.name || `@open-kingdom/${dir}`,
          root: projectRoot,
          version: packageJson.version,
          openApiConfig,
        });
      }
    } catch {
      // Skip projects with invalid package.json
      continue;
    }
  }

  return backends;
}

async function generateAllBackends() {
  const backends = findBackends();

  if (backends.length === 0) {
    console.log('No backends found');
    return;
  }

  console.log(`Found ${backends.length} backend(s)\n`);

  for (const backend of backends) {
    try {
      console.log(` Generating ${backend.name}...`);

      const distPath = join(backend.root, 'dist/app/app.module');
      const srcPath = join(backend.root, 'src/app/app.module');

      let mod;
      try {
        mod = await import(distPath);
      } catch {
        mod = await import(srcPath);
      }

      if (!mod?.AppModule) {
        throw new Error('AppModule not found');
      }

      // Import swagger config from the standard location: {backend}/src/lib/swagger.config.ts
      let globalPrefix = 'api';
      let createSwaggerConfig: () => DocumentBuilder;

      try {
        const swaggerConfigPath = join(
          backend.root,
          'src/config/swagger.config'
        );
        const swaggerModule = await import(swaggerConfigPath);

        if (swaggerModule.globalPrefix && swaggerModule.createSwaggerConfig) {
          globalPrefix = swaggerModule.globalPrefix || 'api';
          createSwaggerConfig = swaggerModule.createSwaggerConfig;
        } else {
          throw new Error(
            'Swagger config file found but missing required exports (globalPrefix, createSwaggerConfig)'
          );
        }
      } catch {
        // Fallback: create a basic config if swagger.config.ts doesn't exist or is invalid
        console.warn(
          `⚠ Warning: Could not load swagger config from ${join(
            backend.root,
            'src/config/swagger.config.ts'
          )}, using default config`
        );
        globalPrefix = 'api';
        createSwaggerConfig = () =>
          new DocumentBuilder()
            .setTitle(`${backend.name} API`)
            .setVersion(backend.version || '1.0');
      }

      const configuredOutputPath = backend.openApiConfig?.outputPath;
      const outputPath = configuredOutputPath
        ? configuredOutputPath.startsWith('/')
          ? configuredOutputPath
          : join(backend.root, configuredOutputPath)
        : join(backend.root, 'openapi.json');
      await generateOpenApi({
        appModule: mod.AppModule,
        globalPrefix,
        documentBuilder: createSwaggerConfig,
        outputPath,
      });
    } catch (error) {
      console.error(`✗ Error generating ${backend.name}:`);
      console.error(error instanceof Error ? error.message : String(error));
      console.log('');
    }
  }
}

generateAllBackends()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
