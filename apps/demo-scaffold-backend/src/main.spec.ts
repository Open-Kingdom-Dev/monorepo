// Mock all the problematic dependencies
jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
  },
}));

jest.mock('@nestjs/common', () => ({
  Logger: {
    log: jest.fn(),
  },
}));

const mockSwaggerModule = {
  createDocument: jest.fn(),
  setup: jest.fn(),
};

const mockDocumentBuilderInstance = {
  build: jest.fn().mockReturnValue({}),
};

jest.mock('@nestjs/swagger', () => ({
  SwaggerModule: mockSwaggerModule,
}));

jest.mock('./config/swagger.config', () => ({
  globalPrefix: 'api',
  createSwaggerConfig: jest.fn(() => mockDocumentBuilderInstance),
}));

jest.mock('./app/app.module', () => ({
  AppModule: class MockAppModule {},
}));

describe('Main Module', () => {
  let mockApp: {
    setGlobalPrefix: jest.Mock;
    listen: jest.Mock<Promise<void>>;
  };
  let NestFactory: {
    create: jest.Mock;
  };
  let bootstrap: () => Promise<void>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const nestCore = await import('@nestjs/core');
    NestFactory = nestCore.NestFactory as unknown as {
      create: jest.Mock;
    };

    mockApp = {
      setGlobalPrefix: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
    };
    NestFactory.create.mockResolvedValue(mockApp);

    mockSwaggerModule.createDocument.mockReturnValue({});

    const mainModule = await import('./main.js');
    bootstrap = mainModule.bootstrap;
  });

  it('should be importable', async () => {
    await expect(import('./main.js')).resolves.toBeDefined();
  });

  it('should execute bootstrap function successfully', async () => {
    await bootstrap();

    expect(NestFactory.create).toHaveBeenCalledTimes(1);
    expect(mockApp.setGlobalPrefix).toHaveBeenCalledWith('api');
    expect(mockDocumentBuilderInstance.build).toHaveBeenCalledTimes(1);
    expect(mockSwaggerModule.setup).toHaveBeenCalledWith(
      'swagger',
      mockApp,
      expect.any(Function),
      expect.objectContaining({
        swaggerOptions: { persistAuthorization: true },
      })
    );
    const [, , documentFactory] = mockSwaggerModule.setup.mock.calls[0];
    documentFactory();
    expect(mockSwaggerModule.createDocument).toHaveBeenCalledWith(
      mockApp,
      expect.any(Object)
    );
    expect(mockApp.listen).toHaveBeenCalled();
  });
});
