/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode,
  FormEvent
} from "react";

import {
  useState,
  useEffect
} from "react";

import {
  Link
} from "@tanstack/react-router";

import {
  useKnowledgeConfig
} from "./configprovider";

import * as api from "@/api";

import {
  Button
} from "@/components/ui/button";

import {
  Input
} from "@/components/ui/input";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";

import {
  X
} from "lucide-react";


/**
 * A detrails renderer for the knowledge item
 * 
 * @param props 
 * @returns ReactNode component for the knowledge item details
 */
export function DetailsRenderer(props: DetailsRenderer.Props): ReactNode {
  // Extract props
  const { detail } = props;

  // get the support functions from the config
  const {
    updateKnowledgeItem,
    deleteKnowledgeItem
  } = useKnowledgeConfig();

  // Form State
  const [name, setName] = useState<string>(detail.name ?? "");
  const [description, setDescription] = useState<string>(detail.description ?? "");
  const [metadata, setMetadata] = useState<Record<string, string>>(
    (detail.metadata as Record<string, string> | null) ?? {}
  );

  // Metadata input helpers
  const [metadataKey, setMetadataKey] = useState<string>("");
  const [metadataVal, setMetadataVal] = useState<string>("");

  // Function that adds metadata to the object
  function handleAddMetadata() {
    const key = metadataKey.trim();
    const val = metadataVal.trim();
    if (!key) return;

    setMetadata((prev) => ({
      ...prev,
      [key]: val,
    }));

    setMetadataKey("");
    setMetadataVal("");
  }

  // removes metadata key/value pair from the object
  function handleRemoveMetadata(keyToRemove: string) {
    setMetadata((prev) => {
      const next = { ...prev };
      delete next[keyToRemove];
      return next;
    });
  }

  // Push form data to the bakcend with a URLForm type
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();

    const knowledge_id = detail.id;

    updateKnowledgeItem({
      knowledge_id,
      body: {
        name: name.trim(),
        description: description.trim(),
        metadata: metadata ?? {},
        reader_id: "",
      },
    });
  }

  // Updates detail fields when knowledge item changes
  useEffect(() => {
    setName(detail.name ?? "");
    setDescription(detail.description ?? "");
    setMetadata(((detail.metadata as Record<string, string> | null) ?? {}) );
    setMetadataKey("");
    setMetadataVal("");
  }, [detail.id]);

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col justify-between">
      <div className="p-6">
        <FieldSet>
          <FieldLegend>Details</FieldLegend>

          <FieldGroup>
            <Field orientation="vertical">
              <FieldTitle>Name</FieldTitle>
              <FieldContent>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </FieldContent>
            </Field>

            <Field orientation="vertical">
              <FieldTitle>
                Description <span className="text-muted-foreground font-normal">(optional)</span>
              </FieldTitle>
              <FieldContent>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  className="min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/20 resize-none"
                />
              </FieldContent>
            </Field>

            <Field orientation="vertical">
              <FieldTitle>Metadata</FieldTitle>

              <FieldContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Key"
                    value={metadataKey}
                    onChange={(e) => setMetadataKey(e.target.value)}
                  />
                  <Input
                    placeholder="Value"
                    value={metadataVal}
                    onChange={(e) => setMetadataVal(e.target.value)}
                  />
                  <Button type="button" variant="outline" onClick={handleAddMetadata}>
                    +
                  </Button>
                </div>

                <FieldDescription>
                  Add optional metadata tags for this knowledge item.
                </FieldDescription>

                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.entries(metadata).map(([k, v]) => (
                    <div
                      key={k}
                      className="h-8 inline-flex items-center gap-2 rounded-full border px-3 text-sm"
                      title={`${k}=${v}`}
                    >
                      <span className="font-mono whitespace-nowrap">
                        {k}={v}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveMetadata(k)}
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-muted"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </FieldContent>
            </Field>

            <Field orientation="vertical">
              <FieldTitle>Content Type</FieldTitle>
              <FieldContent>
                <div className="rounded-md bg-muted px-3 py-2 text-sm font-medium">
                  {detail.type?.toUpperCase?.()}
                </div>
              </FieldContent>
            </Field>

            <Field orientation="vertical">
              <FieldTitle>Last Updated</FieldTitle>
              <FieldContent>
                <div className="rounded-md bg-muted px-3 py-2 text-sm font-medium">
                  {detail.updated_at}
                </div>
              </FieldContent>
            </Field>
          </FieldGroup>
        </FieldSet>
      </div>

      <div className="border-t p-6">
        <div className="flex items-center justify-between">
          <Button
            asChild
            type="button"
            variant="destructive"
            onClick={() => {
              deleteKnowledgeItem(detail.id);
            }}
          >
            <Link to=".." search={(prev) => prev}>
              Delete
            </Link>
          </Button>

          <div className="flex gap-2">
            <Button asChild variant="outline" type="button">
              <Link to=".." search={(prev) => prev}>
                Cancel
              </Link>
            </Button>

            <Button type="submit">Save</Button>
          </div>
        </div>
      </div>
    </form>
  );
}


/**
 * The namespace for the `DetailsRenderer` statics.
 */
export
namespace DetailsRenderer {
  /**
   * A type alias for the `DetailsRenderer` props.
   */
  export
  type Props = {
    /**
     * The session detail data from the api.
     */
    readonly detail: api.KnowledgeDetail;
  };
}
