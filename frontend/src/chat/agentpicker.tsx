/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { Menu as MenuPrimitive } from '@base-ui/react/menu';

import { useNavigate } from '@tanstack/react-router';

import { Check, ChevronDown } from 'lucide-react';

import type { ReactNode } from 'react';

import { Avatar, AvatarFallback, getInitials } from '@/components/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroupLabel,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  dropdownMenuItemVariants,
} from '@/components/ui/dropdown-menu';
import { useAgents, useChatConfig } from '@/context';
import { cn } from '@/lib/utils';

/**
 * A React component that renders the agent picker in the composer.
 *
 * On a new chat it switches the agent. A thread is bound to the agent it was
 * started with, so on an existing thread it only shows that agent.
 */
export function AgentPicker(): ReactNode {
  const agents = useAgents();
  const { agentId, thread } = useChatConfig();
  const navigate = useNavigate();

  const agent = agents.find((a) => a.id === agentId);
  const name = agent?.capabilities.identity?.name || agentId;

  const label = (
    <>
      <Avatar className="size-5">
        <AvatarFallback className="font-semibold text-[10px]">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <span className="max-w-[12rem] truncate">{name}</span>
    </>
  );

  // An existing thread, or nothing to choose from: a static label.
  if (thread || agents.length < 2) {
    return (
      <span
        className="inline-flex h-7 items-center gap-1.5 px-1.5 font-medium text-muted-foreground-strong text-sm"
        data-slot="agent-label"
      >
        {label}
      </span>
    );
  }

  const handleValueChange = (value: unknown) => {
    if (typeof value === 'string' && value !== agentId) {
      navigate({ to: '.', search: { agentId: value } });
    }
  };

  const items = agents.map((a) => {
    const itemName = a.capabilities.identity?.name || a.id;
    return (
      <MenuPrimitive.RadioItem
        key={a.id}
        value={a.id}
        className={cn(dropdownMenuItemVariants(), 'pr-7')}
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate">{itemName}</span>
          {a.capabilities.identity?.description ? (
            <span className="truncate text-muted-foreground text-xs">
              {a.capabilities.identity.description}
            </span>
          ) : null}
        </span>
        <MenuPrimitive.RadioItemIndicator className="absolute right-1.5 inline-flex size-4 items-center justify-center">
          <Check className="size-4" />
        </MenuPrimitive.RadioItemIndicator>
      </MenuPrimitive.RadioItem>
    );
  });

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        variant="ghost"
        aria-label={`Agent: ${name}. Change agent`}
        className="h-7 gap-1.5 px-1.5 hover:no-underline data-[popup-open]:no-underline"
      >
        {label}
        <ChevronDown className="size-3.5" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent side="top" className="w-72">
          <MenuPrimitive.RadioGroup
            value={agentId}
            onValueChange={handleValueChange}
          >
            <DropdownMenuGroupLabel>Agent</DropdownMenuGroupLabel>
            {items}
          </MenuPrimitive.RadioGroup>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
