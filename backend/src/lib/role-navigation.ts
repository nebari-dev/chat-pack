/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  ClipboardList,
  Database,
  GraduationCap,
  HeartPulse,
  LineChart,
  MemoryStick,
  MessageSquarePlus,
  MessagesSquare,
  UsersRound,
} from 'lucide-react';

import type { UserRole } from '@/components/auth';


export type RoleNavLink = {
  readonly to: string;
  readonly text: string;
  readonly icon: LucideIcon;
};


export const ROLE_NAV_LINKS: Record<UserRole, readonly RoleNavLink[]> = {
  student: [
    { to: '/tutor', text: 'Tutor', icon: GraduationCap },
    { to: '/calendar', text: 'Calendar', icon: CalendarDays },
  ],
  teacher: [
    { to: '/teacher-planning', text: 'Planning', icon: ClipboardList },
    { to: '/class-overview', text: 'Class Overview', icon: UsersRound },
  ],
  counselor: [
    { to: '/counselor-dashboard', text: 'Wellness Dashboard', icon: HeartPulse },
    { to: '/calendar', text: 'Calendar', icon: CalendarDays },
  ],
  principal: [
    { to: '/principal-analytics', text: 'School Analytics', icon: LineChart },
  ],
  test: [
    { to: '/chat', text: 'Chat', icon: MessageSquarePlus },
    { to: '/sessions', text: 'Sessions', icon: MessagesSquare },
    { to: '/knowledge', text: 'Knowledge', icon: Database },
    { to: '/memory', text: 'Memory', icon: MemoryStick },
  ],
};


export const ROLE_DEFAULT_ROUTE: Record<UserRole, string> = {
  student: '/tutor',
  teacher: '/teacher-planning',
  counselor: '/counselor-dashboard',
  principal: '/principal-analytics',
  test: '/chat',
};
