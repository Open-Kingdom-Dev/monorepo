const fs = require('fs');
const path = require('path');

const openapiPath = path.join(__dirname, 'libs/shared/frontend/data-access-api-client/src/lib/demo-scaffold-backend/openapi.json');
const data = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));

// Add paths
data.paths['/api/twin/status'] = {
  get: {
    description: 'Get twin status',
    operationId: 'TwinController_getStatus',
    parameters: [],
    responses: {
      200: {
        description: 'Returns twin status (running, healthy, port, url)',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                running: { type: 'boolean', example: true },
                healthy: { type: 'boolean', example: true },
                port: { type: 'number', example: 9013 },
                url: { type: 'string', example: 'http://localhost:9013', nullable: true },
              },
            },
          },
        },
      },
    },
    summary: 'Get twin status',
    tags: ['Twin'],
  },
};

data.paths['/api/twin/start'] = {
  post: {
    description: 'Start the GCS twin',
    operationId: 'TwinController_start',
    parameters: [],
    responses: {
      200: {
        description: 'Twin started successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: 'GCS twin started on port 9013' },
                url: { type: 'string', example: 'http://localhost:9013', nullable: true },
              },
            },
          },
        },
      },
      500: {
        description: 'Failed to start twin',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                message: { type: 'string', example: 'Failed to start twin: some error' },
              },
            },
          },
        },
      },
    },
    summary: 'Start the GCS twin',
    tags: ['Twin'],
  },
};

data.paths['/api/twin/stop'] = {
  post: {
    description: 'Stop the GCS twin',
    operationId: 'TwinController_stop',
    parameters: [],
    responses: {
      200: {
        description: 'Twin stopped successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: 'GCS twin stopped' },
              },
            },
          },
        },
      },
      500: {
        description: 'Failed to stop twin',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                message: { type: 'string', example: 'Failed to stop twin: some error' },
              },
            },
          },
        },
      },
    },
    summary: 'Stop the GCS twin',
    tags: ['Twin'],
  },
};

// Ensure tags array includes 'Twin'
if (data.tags && !data.tags.find(t => t.name === 'Twin')) {
  data.tags.push({ name: 'Twin', description: 'GCS twin control endpoints' });
}

fs.writeFileSync(openapiPath, JSON.stringify(data, null, 2));
console.log('Added twin paths to openapi.json');