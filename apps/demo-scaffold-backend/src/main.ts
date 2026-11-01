/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import {
  createConfigService,
  nodeEnvAdapter,
} from '@open-kingdom/shared-poly-util-env-config';
import {
  createBootLogger,
  installCrashLogging,
  useLogging,
} from '@open-kingdom/shared-backend-util-logging';
import { createSwaggerConfig, globalPrefix } from './config/swagger.config';
import { loggingConfig } from './config/logging.config';
import { json, urlencoded } from 'express';

import { AppModule } from './app/app.module';

const envKeys = ['PORT'] as const;
const configService = createConfigService(envKeys, nodeEnvAdapter);

const bootLogger = createBootLogger(loggingConfig);
installCrashLogging(bootLogger);

export async function bootstrap() {
  bootLogger.info('Starting');
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  // Before the body parsers below, so requests they reject still get an access line.
  useLogging(app);
  app.setGlobalPrefix(globalPrefix);

  // Increase body size limits for file uploads (base64-encoded content)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  const port = configService.get('PORT', '3000');

  const config = createSwaggerConfig().build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true, // Persist authorization across page refreshes
    },
  });
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

void bootstrap();
