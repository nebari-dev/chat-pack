/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as z from 'zod';


/**
 * Create a schema for a paginated response.
 *
 * @param itemSchema - The schema for the items in the page.
 *
 * @returns A schema for a paginated response of the given item type.
 */
export
function createPageSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    /**
     * The limit of the number of responses per page.
     *
     * This is either echoed from the request, or defined by the server if
     * pagination info was not provided in the request.
     */
    limit: z.number(),

    /**
     * The page number of the provided results.
     *
     * This must agree with the `limit`, `pageCount`, and `totalCount`.
     */
    pageNumber: z.number(),

    /**
     * The total number of pages available based on `limit` and `totalCount`.
     */
    pageCount: z.number(),

    /**
     * The total number of items available, independent of `limit`.
     */
    totalCount: z.number(),

    /**
     * The items for the request.
     *
     * The `length` must always be `<= limit`.
     */
    items: z.array(itemSchema)
  });
}


/**
 * A type alias for the options for requesting a page of items.
 */
export
type PageOptions<T> = {
  /**
   * The upper limit of the number of responses to return per page.
   */
  readonly limit?: number;

  /**
   * The page to return based on the specified limit.
   */
  readonly page?: number;

  /**
   * The item key to use for sorting.
   */
  readonly sortBy?: keyof T;

  /**
   * The sort order based on the sort key.
   */
  readonly sortOrder?: 'ascending' | 'descending';
};
