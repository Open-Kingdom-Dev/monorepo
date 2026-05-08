import { Test, TestingModule } from '@nestjs/testing';

import { LeadConversionController } from './lead-conversion.controller';
import { LeadConversionService } from '../services/lead-conversion.service';

describe('LeadConversionController', () => {
  let controller: LeadConversionController;
  let conversion: jest.Mocked<LeadConversionService>;

  beforeEach(async () => {
    conversion = {
      convert: jest.fn(),
    } as unknown as jest.Mocked<LeadConversionService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeadConversionController],
      providers: [{ provide: LeadConversionService, useValue: conversion }],
    }).compile();
    controller = module.get(LeadConversionController);
  });

  it('forwards the request to the conversion service', async () => {
    conversion.convert.mockResolvedValue({
      lead: {} as never,
      contact: {} as never,
      company: null,
      opportunity: null,
    });

    await controller.convert(42, {
      contactId: 10,
      companyId: 20,
      createOpportunity: false,
      opportunityTitle: 'Big deal',
      opportunityEstimatedValue: 10000,
    });

    expect(conversion.convert).toHaveBeenCalledWith({
      leadId: 42,
      contactId: 10,
      companyId: 20,
      createOpportunity: false,
      opportunityTitle: 'Big deal',
      opportunityEstimatedValue: 10000,
    });
  });
});
