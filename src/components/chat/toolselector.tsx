import {
  useState, useMemo
} from "react";

import {
  useAppStore
} from "@/store";

import {
  Settings
} from "lucide-react";

import {
  Button
} from "@/components/ui/button";

import {
  Switch
} from "@/components/ui/switch";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * A React component which renders the tool selector dropdown.
 *
 * This component hooks into the store to get the available tools.
 */
export
function ToolSelector(props: ToolSelector.Props) {
  // Extract the props.
  const { tools, setTools } = props;

  // Fetch the available tools from the store.
  const availableTools = useAppStore((store) => store.tools);

  // List of all tool names (for "Select all")
  const allToolNames = useMemo(
    () => Array.from(availableTools, (tool) => tool.name),
    [availableTools]
  );

  const [isOpen, setIsOpen] = useState(false);

  const selectedCount = tools.length;
  const hasAnySelected = selectedCount > 0;

  // Toggle selection for a tool by name.
  const toggleToolSelection = (toolName: string) => {
  if (tools.includes(toolName)) {
    setTools(tools.filter(tool => tool !== toolName));
  } else {
    setTools([...tools, toolName]);
  }
};


  // Return the rendered component.
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <Settings className="!text-text-neutral-default" />
          <span>Tools</span>

          {selectedCount > 0 && (
            <span
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-xs bg-bg-brand-default text-text-brand-on-brand"
              aria-label={`${selectedCount} selected`}
            >
              {selectedCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
      >
        <DropdownMenuLabel>Available tools</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {availableTools.map((tool) => {
          const isChecked = tools.includes(tool.name);
          const label = tool.display_name;
            
          return (
            <DropdownMenuItem
              key={tool.name}
              // Prevent default Radix select behavior so the menu doesn't close.
              onSelect={(e) => {
                e.preventDefault();
                toggleToolSelection(tool.name);
              }}
              className="flex justify-between"
            >
              <span>{ label }</span>

              <Switch
                checked={isChecked}
                aria-label={label}
                className="pointer-events-none data-[state=checked]:!bg-bg-brand-default"
              />
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            if (hasAnySelected) setTools([]);
            else setTools(allToolNames);
          }}
        >
          {hasAnySelected ? "Clear all" : "Select all"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export
namespace ToolSelector {

  /**
   * A type alias for the `ToolSelector` props.
   */
  export
  type Props = {
    /**
     * The selected tool for the selector.
     */
    readonly tools: string[];
    /**
     * The callback to set the selected tool.
     */
    readonly setTools: (tools: string[]) => void;
  };
}
