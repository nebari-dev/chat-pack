/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createContext, useContext
} from 'react';


/**
 * A type alias for the knowledge context value.
 */
export
type KnowledgeContextValue = { };


/**
 * The knowledge context.
 */
export
const KnowledgeContext = createContext<KnowledgeContextValue | undefined>(undefined);


/**
 * A hook which returns the knowledge context value.
 */
export
function useKnowledge(): KnowledgeContextValue {
  const value = useContext(KnowledgeContext);
  if (value === undefined) {
    throw new Error('`useKnowledge` must be called within a `KnowledgeContext`');
  }
  return value;
}
