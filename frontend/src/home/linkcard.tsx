/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { Link } from '@tanstack/react-router';

import type { ReactNode } from 'react';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * A React component the renders a link card for the home page.
 */
export function LinkCard(props: LinkCard.Props): ReactNode {
  // Extract the props.
  const { to, icon, title, description } = props;

  // Return the rendered component.
  return (
    <Link to={to}>
      <Card className="py-3 rounded-sm hover:border-bd-brand-default">
        <CardHeader>
          <CardTitle className="flex flex-row gap-2">
            {icon}
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

/**
 * The namespace for the `LinkCard` statics.
 */
export namespace LinkCard {
  /**
   * A type alias for the `LinkCard` props.
   */
  export type Props = {
    /**
     * The URL for navigating from the card.
     */
    readonly to: string;

    /**
     * The display title for the card.
     */
    readonly title: string;

    /**
     * The description for the card.
     */
    readonly description: string;

    /**
     * The icon for the card.
     */
    readonly icon: ReactNode;
  };
}
