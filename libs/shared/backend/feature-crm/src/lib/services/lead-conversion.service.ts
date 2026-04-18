import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CompaniesService,
  ContactsService,
  type Company,
  type Contact,
} from '@open-kingdom/shared-backend-data-access-contacts';
import {
  LeadsService,
  OpportunitiesService,
  type Lead,
  type Opportunity,
} from '@open-kingdom/shared-backend-data-access-opportunities';

export interface ConvertLeadInput {
  leadId: number;
  contactId?: number;
  companyId?: number;
  createOpportunity?: boolean;
  opportunityTitle?: string;
  opportunityEstimatedValue?: number;
}

export interface ConvertLeadResult {
  lead: Lead;
  contact: Contact;
  company: Company | null;
  opportunity: Opportunity | null;
}

@Injectable()
export class LeadConversionService {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly contactsService: ContactsService,
    private readonly companiesService: CompaniesService,
    private readonly opportunitiesService: OpportunitiesService
  ) {}

  async convert(input: ConvertLeadInput): Promise<ConvertLeadResult> {
    const lead = await this.leadsService.findById(input.leadId);
    if (!lead) throw new NotFoundException(`Lead ${input.leadId} not found`);
    if (lead.convertedAt) {
      throw new BadRequestException('Lead has already been converted');
    }

    const company = await this.resolveCompany(input, lead);
    const contact = await this.resolveContact(input, lead, company?.id ?? null);

    let opportunity: Opportunity | null = null;
    const shouldCreateOpp = input.createOpportunity !== false;
    if (shouldCreateOpp && company) {
      opportunity = await this.opportunitiesService.create(
        {
          title:
            input.opportunityTitle ??
            `${company.name}${lead.name ? ` — ${lead.name}` : ''}`,
          companyId: company.id,
          primaryContactId: contact.id,
          estimatedValue: input.opportunityEstimatedValue,
        },
        lead.ownerId
      );
    }

    const updatedLead = await this.leadsService.markConverted(
      lead.id,
      contact.id,
      company?.id ?? null
    );

    return { lead: updatedLead, contact, company, opportunity };
  }

  private async resolveCompany(
    input: ConvertLeadInput,
    lead: Lead
  ): Promise<Company | null> {
    if (input.companyId !== undefined) {
      const existing = await this.companiesService.findById(input.companyId);
      if (!existing) {
        throw new NotFoundException(`Company ${input.companyId} not found`);
      }
      return existing;
    }
    if (lead.companyName) {
      return this.companiesService.create(
        { name: lead.companyName, status: 'prospect' },
        lead.ownerId
      );
    }
    return null;
  }

  private async resolveContact(
    input: ConvertLeadInput,
    lead: Lead,
    companyId: number | null
  ): Promise<Contact> {
    if (input.contactId !== undefined) {
      const existing = await this.contactsService.findById(input.contactId);
      if (!existing) {
        throw new NotFoundException(`Contact ${input.contactId} not found`);
      }
      if (companyId && existing.companyId !== companyId) {
        return this.contactsService.update(existing.id, { companyId });
      }
      return existing;
    }
    const [firstName, ...rest] = lead.name.trim().split(/\s+/);
    const lastName = rest.join(' ') || firstName;
    return this.contactsService.create(
      {
        firstName,
        lastName,
        email: lead.email ?? undefined,
        phone: lead.phone ?? undefined,
        companyId: companyId ?? undefined,
        leadSource: lead.source ?? undefined,
      },
      lead.ownerId
    );
  }
}
