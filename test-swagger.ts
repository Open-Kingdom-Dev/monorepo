import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './apps/demo-scaffold-backend/src/app/app.module';

async function test() {
  console.log('Creating Nest app...');
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  const config = new DocumentBuilder()
    .setTitle('Demo scaffold API')
    .setDescription('API support for the demo scaffold application')
    .setVersion('1.0')
    .addTag('demo-scaffold')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .build();
  try {
    console.log('Generating Swagger document...');
    const document = SwaggerModule.createDocument(app, config);
    console.log('Success!');
    // Check for twin paths
    const paths = Object.keys(document.paths);
    console.log(`Total paths: ${paths.length}`);
    const twinPaths = paths.filter((p) => p.includes('twin'));
    console.log(`Twin paths: ${twinPaths.length}`);
    if (twinPaths.length > 0) {
      console.log(twinPaths);
    }
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('Error generating Swagger:', error);
    console.error(error.stack);
    await app.close();
    process.exit(1);
  }
}

test().catch(console.error);
