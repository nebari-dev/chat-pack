/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { getRouteApi, useNavigate } from '@tanstack/react-router';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

import { Field, FieldLabel } from '@/components/ui/field';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useHistoryConfig } from '@/context';

/**
 * The available rows-per-page options.
 */
const PAGE_SIZES = [10, 25, 50, 100] as const;

/**
 * The route API for reading the history search params.
 */
const routeApi = getRouteApi('/_authenticated/history');

/**
 * A React component that renders the pagination controls for the page.
 *
 * The controls render directly below the table. The selected page size and
 * page number are read from the route search params so the controls reflect
 * the user's selection immediately, while `pageCount` comes from the loaded
 * page. Changes are written to the search params, which re-runs the loader.
 */
export function PageNav(): ReactNode {
  // Fetch the loaded thread page.
  const { page } = useHistoryConfig();

  // The total page count comes from the loaded page.
  const { pageCount } = page;

  // The selected page size and number come from the search params, so the
  // controls update immediately on selection regardless of the server echo.
  const { pageSize, pageNumber } = routeApi.useSearch();

  // Fetch the navigation handler for updating the search params.
  const navigate = useNavigate();

  // Create the callback to handle changing the page size.
  const handlePageSizeChange = (value: string) => {
    const nextPageSize = Number(value);
    navigate({
      to: '.',
      search: (prev) => ({ ...prev, pageSize: nextPageSize, pageNumber: 1 }),
    });
  };

  // Create the callback to handle moving to the previous page.
  const handlePrevious = () => {
    navigate({
      to: '.',
      search: (prev) => ({ ...prev, pageNumber: pageNumber - 1 }),
    });
  };

  // Create the callback to handle moving to the next page.
  const handleNext = () => {
    navigate({
      to: '.',
      search: (prev) => ({ ...prev, pageNumber: pageNumber + 1 }),
    });
  };

  // Return the rendered component.
  return (
    <nav className="flex w-full flex-row items-center justify-end gap-4 px-4 pb-4">
      <Field orientation="horizontal" className="w-fit">
        <FieldLabel
          htmlFor="history-rows-per-page"
          className="whitespace-nowrap text-sm text-muted-foreground"
        >
          Rows per page
        </FieldLabel>
        <Select value={`${pageSize}`} onValueChange={handlePageSizeChange}>
          <SelectTrigger id="history-rows-per-page" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <span className="whitespace-nowrap text-sm text-muted-foreground">
        {`Page ${pageNumber} of ${Math.max(pageCount, 1)}`}
      </span>
      <div className="flex items-center gap-2">
        <Button
          className="rounded-sm cursor-pointer"
          variant="ghost"
          size="sm"
          disabled={pageNumber <= 1}
          onClick={handlePrevious}
        >
          <ChevronLeft />
          Previous
        </Button>
        <Button
          className="rounded-sm cursor-pointer"
          variant="ghost"
          size="sm"
          disabled={pageNumber >= pageCount}
          onClick={handleNext}
        >
          Next
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
