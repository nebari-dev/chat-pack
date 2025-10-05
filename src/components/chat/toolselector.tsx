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
  ReactNode
} from 'react';

import type {
  Selection
} from 'react-aria-components';

import {
  Button, Menu, MenuItem, MenuSection, MenuTrigger, Popover, Switch, Text
} from 'react-aria-components';

import {
  useAppStore
} from "@/store";


/**
 * A React component that renders the tool selector dropdown.
 */
export
function ToolSelector(props: ToolSelector.Props): ReactNode {
  // Extract the props.
  const { tools, setTools } = props;

  // Fetch all the tool objects from the store.
  const $tools = useAppStore(store => store.tools);

  // Convert the selected tools to a set, which is needed by react-aria.
  const selectedTools = new Set(tools);

  // Create the change event handler for the menu.
  const handleSelectionChange = (selection: Selection) => {
    if (selection === 'all') {
      setTools($tools.map(t => t.name));
    } else {
      setTools([...(selection as Set<string>)]);
    }
  };

  // Return the rendered component.
  return (
    <MenuTrigger aria-label='Tool Selector'>
      <Button className={clsx(
        'h-8 px-3 gap-2 flex flex-row items-center bg-bg-neutral-default',
        'rounded-xs border border-bd-neutral-default cursor-pointer',
        'outline-none data-focused:border-bd-brand-default')}>
        <Wrench className='size-4' />
        Tools
      </Button>
      <Popover className={clsx(
        'min-w-(--trigger-width) p-1 bg-bg-white rounded-xs',
        'border border-bd-neutral-default shadow-md',
        'transition-opacity data-entering:opacity-0 data-exiting:opacity-0')}>
        <Menu
          selectionMode='multiple'
          selectedKeys={selectedTools}
          onSelectionChange={handleSelectionChange}
          className='outline-none' >
          <MenuSection items={$tools}>
            {tool =>
              <MenuItem
                id={tool.name}
                textValue={tool.display_name}
                className={clsx(
                  'px-2 py-1.5 flex flex-row gap-2 items-center rounded-xs',
                  'select-none cursor-pointer outline-none',
                  'data-focused:bg-bg-neutral-dark')}>
                {rp => <>
                  {iconForTool(tool.name)}
                  <div className='flex-auto flex flex-col'>
                    <Text
                      slot='label'
                      className='font-semibold'>
                      {tool.display_name}
                    </Text>
                    <Text
                      slot='description'
                      className='text-xs text-muted-foreground'>
                      {tool.description}
                    </Text>
                  </div>
                  <Switch
                    className='w-9 h-5 flex-none relative cursor-pointer'>
                    <div className={clsx(
                      'w-full h-full px-0.5 flex flex-row items-center',
                      'rounded-full',
                      rp.isSelected ?
                        'bg-bg-brand-default' :
                        'bg-bg-neutral-xdark')}>
                      <span className={clsx(
                        'block w-4 h-4 rounded-full bg-bg-white',
                        'transition-transform',
                        rp.isSelected ? 'translate-x-full' : '')}/>
                    </div>
                  </Switch>
                </>}
              </MenuItem>}
          </MenuSection>
        </Menu>
      </Popover>
    </MenuTrigger>
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
     * The currently selected tools by `tool.name`.
     */
    readonly tools: readonly string[];

    /**
     * The callback to set the selected tools by `tool.name`.
     */
    readonly setTools: (tools: readonly string[]) => void;
  };
}


/**
 * Get the icon for a well-known tool name.
 */
function iconForTool(name: string): ReactNode {
  switch (name) {
  case 'duckduckgo-search':
    return <Globe className='size-5' />;
  default:
    return null;
  }
}
