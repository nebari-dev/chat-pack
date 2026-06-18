/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type * as agui from '@ag-ui/core';

import type { ReactNode } from 'react';

import * as api from '@/api';

import { Badge } from '@/components/ui/badge';

/**
 * A react component that renders an ag-ui `UserMessage`.
 */
export function UserMessage(props: UserMessage.Props): ReactNode {
  // Extract the props.
  const { message } = props;

  // Collect the text from the user message.
  const { text, files } = Private.collectInfo(message);

  // Create the badges for the attached files.
  const fileBadges = files.map(({ id, name }) => (
    <Badge key={id} variant="outline">
      {name}
    </Badge>
  ));

  // Create the container for the file badges, if needed.
  const badges =
    fileBadges.length > 0 ? (
      <div className="flex flex-row flex-wrap gap-2 justify-end">
        {fileBadges}
      </div>
    ) : null;

  // Return the rendered component.
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row justify-end">
        <div className="px-4 py-2 rounded-md border bg-muted">{text}</div>
      </div>
      {badges}
    </div>
  );
}

/**
 * The namespace for the `UserMessage` statics.
 */
export namespace UserMessage {
  /**
   * A type alias for the `UserMessage` props.
   */
  export type Props = {
    /**
     * The ag-ui user message.
     */
    readonly message: agui.UserMessage;
  };
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * The relevant info about an attached file.
   */
  export type FileInfo = {
    /**
     * The unqiue id of the file.
     */
    readonly id: string;

    /**
     * The name of the file, if available.
     */
    readonly name: string;
  };

  /**
   * A type alias for collected info from a user message.
   */
  export type Info = {
    /**
     * The complete text of the user message.
     */
    readonly text: string;

    /**
     * The file attached to the user message.
     */
    readonly files: readonly FileInfo[];
  };

  /**
   * Collect the info from an ag-ui user message.
   */
  export function collectInfo(message: agui.UserMessage): Info {
    // Quick exit if the content is a string.
    if (typeof message.content === 'string') {
      return { text: message.content, files: [] };
    }

    // Create the variables to hold the info parts.
    let text: string = '';
    const files: FileInfo[] = [];

    // Extract the info from the parts.
    for (const part of message.content) {
      switch (part.type) {
        case 'text':
          text += part.text;
          break;
        case 'audio':
        case 'image':
        case 'video':
        case 'document': {
          // Ignore files that are not ravnar content.
          if (!api.isRavnarFileContent(part)) {
            continue;
          }

          // Decode the source value of the input content.
          const value = api.decodeRavnarFileContentSourceValue(part);

          // Add the file using the decoded info.
          files.push({
            id: value.fileId,
            name: part.metadata?.name ?? value.fileId,
          });
          break;
        }
        default:
          console.error('unhandled message part', part);
      }
    }

    // Return the collected info.
    return { text, files };
  }
}
