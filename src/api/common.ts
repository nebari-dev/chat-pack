/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/


/**
 * A type alias for a paginated response of items.
 */
export
type Page<T> = {
  /**
   * The limit of the number of responses per page.
   *
   * This is either echoed from the request, or defined by the server if
   * pagination info was not provided in the request.
   */
  readonly limit: number;

  /**
   * The page number of the provided results.
   *
   * This must agree with the `limit`, `pageCount`, and `totalCount`.
   */
  readonly pageNumber: number;

  /**
   * The total number of pages available based on `limit` and `totalCount`.
   */
  readonly pageCount: number;

  /**
   * The total number of items available, independent of `limit`.
   */
  readonly totalCount: number;

  /**
   * The items for the request.
   *
   * This must always be `<= limit`.
   */
  readonly items: readonly T[];
};


/**
 * A type alias for the (partial) options for requesting a page of items.
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
