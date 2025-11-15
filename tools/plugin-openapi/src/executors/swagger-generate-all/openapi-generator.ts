import { Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export interface OpenApiGeneratorOptions {
  appModule: Type<unknown>;
  globalPrefix?: string;
  documentBuilder: () => DocumentBuilder;
  outputPath: string;
}

export async function generateOpenApi(
  options: OpenApiGeneratorOptions
): Promise<void> {
  const { appModule, globalPrefix, documentBuilder, outputPath } = options;

  const app = await NestFactory.create(appModule);
  if (globalPrefix) app.setGlobalPrefix(globalPrefix);

  const document = SwaggerModule.createDocument(app, documentBuilder().build());
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(document, null, 2));

  console.log(`Generated: ${outputPath}`);
  await app.close();
}
