import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let app: TestingModule;
  let controller: AppController;
  let service: AppService;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    controller = app.get<AppController>(AppController);
    service = app.get<AppService>(AppService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(AppController);
  });

  it('should inject AppService', () => {
    expect(controller['appService']).toBeDefined();
    expect(controller['appService']).toBe(service);
  });

  describe('getData', () => {
    it('should return "Hello API"', () => {
      const result = controller.getData();
      expect(result).toEqual({ message: 'Hello API' });
    });

    it('should call appService.getData', () => {
      const getDataSpy = jest.spyOn(service, 'getData');

      controller.getData();

      expect(getDataSpy).toHaveBeenCalledTimes(1);
    });

    it('should return the same result as service', () => {
      const serviceResult = service.getData();
      const controllerResult = controller.getData();

      expect(controllerResult).toEqual(serviceResult);
    });
  });
});
