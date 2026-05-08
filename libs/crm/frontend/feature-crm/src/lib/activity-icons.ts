import {
  FileText,
  Mail,
  Phone,
  StickyNote,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { ActivityType } from '@open-kingdom/crm-poly-util-domain';

export const CRM_ACTIVITY_ICON_MAP: Record<ActivityType, LucideIcon> = {
  note: StickyNote,
  call: Phone,
  meeting: Users,
  email: Mail,
  task: FileText,
};

export const CRM_ACTIVITY_LABEL_MAP: Record<ActivityType, string> = {
  note: 'Note',
  call: 'Call',
  meeting: 'Meeting',
  email: 'Email',
  task: 'Task',
};
