/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  Box, Stack
} from '@chakra-ui/react';

import {
  type ReactNode
} from 'react';

import {
  Thread
} from '@/components/assistant-ui/thread';

import {
  AUIProvider
} from './auiprovider';

import {
  Breadcrumbs
} from './breadcrumbs';


/**
 * A component that renders the Assistant-UI chat panel.
 */
export
function Chat(): ReactNode {
  return (
    <Stack width='100%' gap={0}>
      <Breadcrumbs />
      <Box minW={0} minH={0} flexGrow={1}>
        <AUIProvider>
          <Thread />
        </AUIProvider>
      </Box>
    </Stack>
  );
}
