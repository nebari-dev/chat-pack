/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as z from 'zod';

/**
 * A type alias for a request pagination options.
 */
export type PaginationOptions<T> = {
  /**
   * The upper limit of the number of responses to return per page.
   */
  readonly pageSize?: number;

  /**
   * The page to return based on the page size. 1-based.
   */
  readonly pageNumber?: number;

  /**
   * The item key to use for sorting.
   */
  readonly sortBy?: keyof T;

  /**
   * The sort order based on the sort key.
   */
  readonly sortOrder?: 'ascending' | 'descending';
};

/**
 * Create a schema for a paginated response.
 *
 * @param itemSchema - The schema for the items in the page.
 *
 * @returns A schema for a paginated response of the given item type.
 */
export function createPageSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    /**
     * The limit of the number of responses per page.
     *
     * This is either echoed from the request, or defined by the server if
     * pagination info was not provided in the request.
     */
    pageSize: z.number(),

    /**
     * The page number of the provided results.
     *
     * This must agree with the `pageSize`, `pageCount`, and `totalCount`.
     */
    pageNumber: z.number(),

    /**
     * The total number of pages available based on `pageSize` and `totalCount`.
     */
    pageCount: z.number(),

    /**
     * The total number of items available, independent of `pageSize`.
     */
    totalCount: z.number(),

    /**
     * The items for the request.
     *
     * The `length` must always be `<= pageSize`.
     */
    items: z.array(itemSchema),
  });
}
