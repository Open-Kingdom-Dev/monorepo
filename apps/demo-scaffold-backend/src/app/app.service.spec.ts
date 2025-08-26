import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(AppService);
  });

  describe('getData', () => {
    it('should return "Hello API"', () => {
      const result = service.getData();
      expect(result).toEqual({ message: 'Hello API' });
    });

    it('should return an object with message property', () => {
      const result = service.getData();
      expect(result).toHaveProperty('message');
      expect(typeof result.message).toBe('string');
    });
  });
});
