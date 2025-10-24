import { DocumentBuilder } from '@nestjs/swagger';

export const globalPrefix = 'api';

export function createSwaggerConfig(): DocumentBuilder {
  return new DocumentBuilder()
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
      'JWT-auth' // This name is used as reference in @ApiBearerAuth('JWT-auth')
    );
}

