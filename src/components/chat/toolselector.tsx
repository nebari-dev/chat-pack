/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  clsx
} from 'clsx';

import {
  Globe, Wrench
} from "lucide-react";

import type {
  ComponentProps, ReactNode
} from 'react';

import {
  useShallow
} from 'zustand/react/shallow';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import {
  Switch
} from "@/components/ui/switch";

import {
  useAppStore
} from "@/store";


/**
 * A React component which renders the tool selector dropdown.
 */
export
function ToolSelector(props: ToolSelector.Props): ReactNode {
  // Extract the props.
  const { tools, setTools } = props;

  // Fetch all of the tool names from the store.
  const allToolNames = useAppStore(useShallow(store =>
    store.tools.map(tool => tool.name)
  ));

  // Set up the callback to toggle a tool.
  const toggleTool = (name: string) => {
    if (tools.includes(name)) {
      setTools(tools.filter(tool => tool !== name));
    } else {
      setTools([...tools, name]);
    }
  };

  // Set up the callback to select all tools.
  const selectAll = () => { setTools([...allToolNames]); };

  // Set up the callback to clear all tools.
  const clearAll = () => { setTools([]); };

  // Create the tool items.
  const toolItems = allToolNames.map(name =>
    <ToolItem
      key={ name }
      name={ name }
      isChecked={ tools.includes(name) }
      onToggle={ toggleTool } />
  );

  // Return the rendered component.
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <TriggerButton enabledCount={ tools.length } />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='w-75 rounded-xs'>
        { toolItems }
        <DropdownMenuSeparator className='mx-0' />
        <SelectClearItem
          enabledCount={ tools.length }
          selectAll={ selectAll }
          clearAll={ clearAll } />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


/**
 * The namespace for the `ToolSelector` component statics
 */
export
namespace ToolSelector {
  /**
   * A type alias for the `ToolSelector` props.
   */
  export
  type Props = {
    /**
     * The selected tools for the selector.
     */
    readonly tools: readonly string[];

    /**
     * The callback to set the selected tools.
     */
    readonly setTools: (tools: readonly string[]) => void;
  };
}


/**
 * A React component that renders a tool as a dropdown menu item.
 */
function ToolItem(props: ToolItem.Props): ReactNode {
  // Extract the props.
  const { name, isChecked, onToggle } = props;

  // Fetch the tool from the store.
  const tool = useAppStore(store => store.tools.find(t => t.name === name)!);

  // Set up the select event handler.
  const handleSelect = (event: Event) => {
    // Prevent the menu from closing.
    event.preventDefault();

    // Toggle the tool.
    onToggle(name);
  };

  // Return the rendered component.
  return (
    <DropdownMenuItem onSelect={ handleSelect } className='rounded-xs'>
      { getIconForTool(name) }
      <div className='flex-auto flex flex-col gap-1'>
        <div className='font-semibold'>
          { tool.display_name }
        </div>
        <div className='text-xs text-muted-foreground'>
          { tool.description }
        </div>
      </div>
      <Switch
        checked={ isChecked }
        className='data-[state=checked]:bg-bg-brand-default' />
    </DropdownMenuItem>
  );
}


/**
 * The namespace for the `ToolItem` component statics.
 */
namespace ToolItem {
  /**
   * A type alias for the `ToolItem` props.
   */
  export
  type Props = {
    /**
     * The name of the tool.
     */
    readonly name: string;

    /**
     * Whether the tool is checked.
     */
    readonly isChecked: boolean;

    /**
     * A callback to toggle the state of the tool.
     */
    readonly onToggle: (name: string) => void;
  };
}


/**
 * A React component that renders the tools trigger button.
 */
function TriggerButton(props: TriggerButton.Props): ReactNode {
  // Extract the props.
  const { enabledCount, ...rest } = props;

  // Return the rendered component.
  return (
    <button { ...rest } className={ clsx(
      'flex-none h-8 px-3 flex flex-row gap-2 items-center justify-center',
      'rounded-xs border border-bd-neutral-default bg-bg-neutral-default',
      'cursor-pointer' ) }>
      <Wrench className='size-4' />
      Tools
      <span className={ clsx(
        'w-4 items-center justify-center rounded-full text-xs',
        'bg-bg-brand-default text-text-brand-on-brand',
        enabledCount === 0 ? 'hidden' : 'inline-flex' ) }>
        { enabledCount }
      </span>
    </button>
  );
}


/**
 * The namespace for the `TriggerButton` component statics.
 */
namespace TriggerButton {
  /**
   * A type alias for the `TriggerButton` props.
   */
  export
  type Props = {
    /**
     * The number of enabled tools.
     */
    readonly enabledCount: number;
  } & ComponentProps<'button'>
}


/**
 * A React component that renders the select-all/clear-all item.
 */
function SelectClearItem(props: SelectClearItem.Props): ReactNode {
  // Extract the props.
  const { enabledCount, selectAll, clearAll, ...rest } = props;

  // Set up the select event handler.
  const handleSelect = (event: Event) => {
    // Prevent the dropdown menu from closing.
    event.preventDefault();

    // Select or clear the items based on the current enabled count.
    if (enabledCount === 0) {
      selectAll();
    } else {
      clearAll();
    }
  };

  // Return the rendered component.
  return (
    <DropdownMenuItem
      { ...rest }
      onSelect={ handleSelect }
      className='rounded-xs'>
      { enabledCount === 0 ? 'Select All' : 'Clear All' }
    </DropdownMenuItem>
  );
}


/**
 * The namespace for the `SelectClearItem` component statics.
 */
namespace SelectClearItem {
  /**
   * A type alias for the `SelectClearItem` props.
   */
  export
  type Props = {
    /**
     * The number of enabled tools.
     */
    readonly enabledCount: number;

    /**
     * A callback to select all of the tools.
     */
    readonly selectAll: () => void;

    /**
     * A callback to clear all the enabled tools.
     */
    readonly clearAll: () => void;
  } & ComponentProps<typeof DropdownMenuItem>;
}


/**
 * Get the icon for a well-known tool name.
 */
function getIconForTool(name: string): ReactNode {
  switch (name) {
  case 'duckduckgo-search':
    return <Globe className='size-5' />;
  default:
    return null;
  }
}
