import {
  ConfigurableLookupDto,
  CreateConfigurableLookupDto,
  UpdateConfigurableLookupDto,
} from './configurable-lookup.dto';

describe('configurable-lookup DTOs', () => {
  it('ConfigurableLookupDto carries all entry fields', () => {
    const dto = new ConfigurableLookupDto();
    dto.id = 1;
    dto.listKey = 'opportunity_stage';
    dto.value = 'won';
    dto.label = 'Won';
    dto.sortOrder = 5;
    dto.isSystem = true;
    dto.isActive = true;
    dto.createdAt = new Date();
    dto.updatedAt = new Date();
    expect(dto.label).toBe('Won');
  });

  it('CreateConfigurableLookupDto allows optional sortOrder and isActive', () => {
    const dto = new CreateConfigurableLookupDto();
    dto.listKey = 'lead_status';
    dto.value = 'new';
    dto.label = 'New';
    expect(dto.sortOrder).toBeUndefined();
    expect(dto.isActive).toBeUndefined();
  });

  it('UpdateConfigurableLookupDto fields are all optional', () => {
    const dto = new UpdateConfigurableLookupDto();
    expect(dto.listKey).toBeUndefined();
    expect(dto.label).toBeUndefined();
    expect(dto.isActive).toBeUndefined();
  });
});
