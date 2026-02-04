/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import {
  useState
} from 'react'

import {
  KnowledgeDetail
} from './knowledgedetail';

import{
  KnowledgeTable 
} from './knowledgetable'

import {
  useKnowledgeConfig
} from './configprovider';

import {
  Button
} from "@/components/ui/button"

import {
  SelectContentModal
} from "./selectcontentmodal";

import {
  AddFileModal
} from "./addfilemodal";

import {
  AddUrlModal
} from "./addurlmodal";

import {
  AddTextModal
} from "./addtextmodal";

/**
 * A React component that renders system knowledge.
 */
export
function Knowledge(): ReactNode {
  const { detail, uploadKnowledgeItem } = useKnowledgeConfig();

  // Modal States
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isFileOpen, setIsFileOpen] = useState(false);
  const [isWebOpen, setIsWebOpen] = useState(false);
  const [isTextOpen, setIsTextOpen] = useState(false);

  return (
    <main className='grow flex flex-col'>
      <div className='px-4 py-2 border-b border-bd-neutral-default flex justify-between'>
        <h2 className='text-lg font-semibold'>
          Knowledge
        </h2>
        <Button
          type="button"
          variant="outline"
          className="px-3 py-1.5 rounded-md text-sm font-medium border border-bd-neutral-default hover:bg-bd-neutral-subtle"
          onClick={() => setIsSelectOpen(true)}
        >
          + Add content
        </Button>

        <SelectContentModal
          isOpen={isSelectOpen}
          onClose={() => setIsSelectOpen(false)}
          onSelect={(source) => {
            if (source === "file") setIsFileOpen(true);
            if (source === "web") setIsWebOpen(true);
            if (source === "text") setIsTextOpen(true);
          }}
        />

        <AddFileModal
          isOpen={isFileOpen}
          onClose={() => setIsFileOpen(false)}
          onContinue={(items) => {
            for (const item of items) {
              if (item.type === "file") uploadKnowledgeItem({ file: item.file });
              else uploadKnowledgeItem({ url: item.url });
            }
          }}
        />

        <AddUrlModal
          isOpen={isWebOpen}
          onClose={() => setIsWebOpen(false)}
          onContinue={(items) => {
            for (const item of items) {
              uploadKnowledgeItem({ url: item.url });
            }
            setIsWebOpen(false);
          }}
        />

        <AddTextModal
          isOpen={isTextOpen}
          onClose={() => setIsTextOpen(false)}
          onSubmit={async (values) => {
            const metadataRecord = Object.fromEntries(
              values.metadata.map((m) => [m.key, m.value])
            );

            await uploadKnowledgeItem({
              name: values.name || null,
              description: values.description || null,
              text_content: values.content || null,
              reader_id: values.reader || null,
              chunker: values.configureChunking ? "default" : null,
              metadata:
                Object.keys(metadataRecord).length > 0
                  ? JSON.stringify(metadataRecord)
                  : null,
            });
          }}
        />
      </div>
      <div className={ `grow grid grid-flow-col auto-cols-fr min-h-0` }>
        <KnowledgeTable />
        { detail ? <KnowledgeDetail detail={ detail } /> : null }
      </div>
    </main>
  );
}
