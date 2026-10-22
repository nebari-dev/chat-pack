/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { Menu as MenuPrimitive } from '@base-ui/react/menu';

import { Monitor, Moon, Sun } from 'lucide-react';

import type { ReactNode } from 'react';

import { useTheme } from '@/hooks/theme-provider';
import { isThemeMode, type ThemeMode } from '@/hooks/use-theme-preference';
import { cn } from '@/lib/utils';

/**
 * The selectable theme modes, in display order.
 */
const OPTIONS: readonly {
  value: ThemeMode;
  label: string;
  text: string;
  icon: ReactNode;
}[] = [
  { value: 'light', label: 'Light mode', text: 'Light', icon: <Sun /> },
  { value: 'dark', label: 'Dark mode', text: 'Dark', icon: <Moon /> },
  { value: 'system', label: 'System theme', text: 'System', icon: <Monitor /> },
];

/**
 * A React component that renders the Light/Dark/System picker in the account
 * menu.
 *
 * It is a menu radio group (`role="menuitemradio"`), not tabs: picking one of
 * three values inside a menu is exactly what `menuitemradio` means, and tabs
 * would promise a tab panel that does not exist. It only looks segmented.
 */
export function ThemePicker(): ReactNode {
  const { themeMode, setThemeMode } = useTheme();

  const handleValueChange = (value: unknown) => {
    if (typeof value === 'string' && isThemeMode(value)) {
      setThemeMode(value);
    }
  };

  // Keep the menu open on click so the user can compare modes in place.
  const items = OPTIONS.map((option) => (
    <MenuPrimitive.RadioItem
      key={option.value}
      value={option.value}
      aria-label={option.label}
      title={option.label}
      closeOnClick={false}
      className={cn(
        'flex h-auto flex-1 cursor-pointer items-center justify-center gap-1 rounded-sm border border-transparent px-1.5 py-0.5 font-medium text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4',
        'text-muted-foreground-strong hover:text-foreground',
        'data-checked:border-border-strong data-checked:bg-card data-checked:text-foreground data-checked:shadow-[0_1px_3px_0_rgba(0,0,0,0.10)]',
      )}
    >
      {option.icon}
      <span>{option.text}</span>
    </MenuPrimitive.RadioItem>
  ));

  return (
    <div className="py-2">
      <MenuPrimitive.RadioGroup
        aria-label="Theme"
        value={themeMode}
        onValueChange={handleValueChange}
        className="flex h-[34px] items-center gap-1 rounded-md bg-muted p-1"
      >
        {items}
      </MenuPrimitive.RadioGroup>
    </div>
  );
}
