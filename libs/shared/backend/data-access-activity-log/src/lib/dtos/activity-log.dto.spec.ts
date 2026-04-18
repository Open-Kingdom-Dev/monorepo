import {
  ActivityLogEntryDto,
  CompleteActivityLogEntryDto,
  CreateActivityLogEntryDto,
  UpdateActivityLogEntryDto,
} from './activity-log.dto';

describe('activity-log DTOs', () => {
  it('ActivityLogEntryDto carries all entry fields', () => {
    const dto = new ActivityLogEntryDto();
    dto.id = 1;
    dto.relatedType = 'contact';
    dto.relatedId = 42;
    dto.type = 'note';
    dto.subject = 'Kickoff';
    dto.description = null;
    dto.dueAt = null;
    dto.completedAt = null;
    dto.ownerId = 7;
    dto.createdAt = new Date();
    dto.updatedAt = new Date();
    expect(dto.subject).toBe('Kickoff');
  });

  it('CreateActivityLogEntryDto allows optional description and dueAt', () => {
    const dto = new CreateActivityLogEntryDto();
    dto.relatedType = 'company';
    dto.relatedId = 5;
    dto.type = 'task';
    dto.subject = 'Follow up';
    expect(dto.description).toBeUndefined();
    expect(dto.dueAt).toBeUndefined();
  });

  it('UpdateActivityLogEntryDto fields are all optional', () => {
    const dto = new UpdateActivityLogEntryDto();
    expect(dto.subject).toBeUndefined();
    expect(dto.description).toBeUndefined();
    expect(dto.dueAt).toBeUndefined();
  });

  it('CompleteActivityLogEntryDto carries optional outcome notes', () => {
    const dto = new CompleteActivityLogEntryDto();
    dto.outcomeNotes = 'signed';
    expect(dto.outcomeNotes).toBe('signed');
  });
});
