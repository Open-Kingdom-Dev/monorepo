import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import {
  CompaniesService,
  ContactsService,
} from '@open-kingdom/shared-backend-data-access-contacts';
import {
  LeadsService,
  OpportunitiesService,
} from '@open-kingdom/shared-backend-data-access-opportunities';

import { LeadConversionService } from './lead-conversion.service';

describe('LeadConversionService', () => {
  let service: LeadConversionService;
  let leads: jest.Mocked<LeadsService>;
  let contacts: jest.Mocked<ContactsService>;
  let companies: jest.Mocked<CompaniesService>;
  let opportunities: jest.Mocked<OpportunitiesService>;

  const lead = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    name: 'Jane Doe',
    companyName: 'Acme',
    email: 'jane@acme.com',
    phone: null,
    source: 'website',
    status: 'new',
    notes: null,
    contactId: null,
    companyId: null,
    convertedAt: null,
    convertedToContactId: null,
    convertedToCompanyId: null,
    ownerId: 42,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    leads = {
      findById: jest.fn(),
      markConverted: jest.fn(),
    } as unknown as jest.Mocked<LeadsService>;
    contacts = {
      findById: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<ContactsService>;
    companies = {
      findById: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<CompaniesService>;
    opportunities = {
      create: jest.fn(),
    } as unknown as jest.Mocked<OpportunitiesService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadConversionService,
        { provide: LeadsService, useValue: leads },
        { provide: ContactsService, useValue: contacts },
        { provide: CompaniesService, useValue: companies },
        { provide: OpportunitiesService, useValue: opportunities },
      ],
    }).compile();
    service = module.get(LeadConversionService);
  });

  it('throws when the lead does not exist', async () => {
    leads.findById.mockResolvedValue(undefined);
    await expect(service.convert({ leadId: 1 })).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('throws when the lead has already been converted', async () => {
    leads.findById.mockResolvedValue(
      lead({ convertedAt: new Date() }) as never
    );
    await expect(service.convert({ leadId: 1 })).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('creates company and contact from lead data when no ids supplied', async () => {
    leads.findById.mockResolvedValue(lead() as never);
    companies.create.mockResolvedValue({ id: 10, name: 'Acme' } as never);
    contacts.create.mockResolvedValue({ id: 20, firstName: 'Jane' } as never);
    opportunities.create.mockResolvedValue({ id: 30 } as never);
    leads.markConverted.mockResolvedValue(
      lead({ convertedAt: new Date() }) as never
    );

    const result = await service.convert({ leadId: 1 });

    expect(companies.create).toHaveBeenCalled();
    expect(contacts.create).toHaveBeenCalled();
    expect(opportunities.create).toHaveBeenCalled();
    expect(leads.markConverted).toHaveBeenCalledWith(1, 20, 10);
    expect(result.opportunity).toBeDefined();
  });

  it('reuses existing company when companyId is provided', async () => {
    leads.findById.mockResolvedValue(lead() as never);
    companies.findById.mockResolvedValue({ id: 99, name: 'Existing' } as never);
    contacts.create.mockResolvedValue({ id: 20 } as never);
    opportunities.create.mockResolvedValue({ id: 30 } as never);
    leads.markConverted.mockResolvedValue(lead() as never);

    await service.convert({ leadId: 1, companyId: 99 });

    expect(companies.findById).toHaveBeenCalledWith(99);
    expect(companies.create).not.toHaveBeenCalled();
  });

  it('throws when referenced company is not found', async () => {
    leads.findById.mockResolvedValue(lead() as never);
    companies.findById.mockResolvedValue(undefined);
    await expect(
      service.convert({ leadId: 1, companyId: 99 })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('reuses existing contact and retargets companyId when different', async () => {
    leads.findById.mockResolvedValue(lead() as never);
    companies.create.mockResolvedValue({ id: 10 } as never);
    contacts.findById.mockResolvedValue({ id: 7, companyId: null } as never);
    contacts.update.mockResolvedValue({ id: 7, companyId: 10 } as never);
    opportunities.create.mockResolvedValue({ id: 30 } as never);
    leads.markConverted.mockResolvedValue(lead() as never);

    await service.convert({ leadId: 1, contactId: 7 });

    expect(contacts.update).toHaveBeenCalledWith(7, { companyId: 10 });
  });

  it('throws when referenced contact is not found', async () => {
    leads.findById.mockResolvedValue(lead() as never);
    contacts.findById.mockResolvedValue(undefined);
    await expect(
      service.convert({ leadId: 1, contactId: 99 })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('skips opportunity creation when createOpportunity=false', async () => {
    leads.findById.mockResolvedValue(lead() as never);
    companies.create.mockResolvedValue({ id: 10 } as never);
    contacts.create.mockResolvedValue({ id: 20 } as never);
    leads.markConverted.mockResolvedValue(lead() as never);

    const result = await service.convert({
      leadId: 1,
      createOpportunity: false,
    });

    expect(opportunities.create).not.toHaveBeenCalled();
    expect(result.opportunity).toBeNull();
  });

  it('skips retargeting contact company when already attached to same company', async () => {
    leads.findById.mockResolvedValue(lead() as never);
    companies.findById.mockResolvedValue({ id: 10 } as never);
    contacts.findById.mockResolvedValue({ id: 7, companyId: 10 } as never);
    opportunities.create.mockResolvedValue({ id: 30 } as never);
    leads.markConverted.mockResolvedValue(lead() as never);

    await service.convert({ leadId: 1, contactId: 7, companyId: 10 });

    expect(contacts.update).not.toHaveBeenCalled();
  });

  it('handles lead with no company name by skipping company creation', async () => {
    leads.findById.mockResolvedValue(lead({ companyName: null }) as never);
    contacts.create.mockResolvedValue({ id: 20 } as never);
    leads.markConverted.mockResolvedValue(lead() as never);

    const result = await service.convert({ leadId: 1 });

    expect(companies.create).not.toHaveBeenCalled();
    expect(opportunities.create).not.toHaveBeenCalled();
    expect(result.company).toBeNull();
  });
});
