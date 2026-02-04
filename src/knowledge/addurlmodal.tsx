/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from "react";

import {
  useState
} from "react";

import {
  Button
} from "@/components/ui/button";

import {
  X,
  Trash2,
  Link2
} from "lucide-react";

import {
  cn
} from "@/lib/utils";

/**
 * Modal handler for a url as the knowledge item
 * 
 * @param options 
 * @returns 
 */
export
function AddUrlModal(options: AddUrlModal.Options): ReactNode {
  // Expand the options
  const { isOpen, onClose, onContinue } = options;

  // list of url items to be submitted
  const [urls, setUrls] = useState<AddUrlModal.Item[]>([]);

  // url input variable
  const [url, setUrl] = useState<string>("");

  if (!isOpen) return null;

  function addUrl() {
    const trimmed = url.trim();
    if (!trimmed) return;

    const item: AddUrlModal.Item = {
      id: crypto.randomUUID(),
      type: "url",
      url: trimmed,
    };

    setUrls((prev) => [...prev, item]);
    setUrl("");
  }

  function removeUrl(id: string) {
    setUrls((prev) => prev.filter((u) => u.id !== id));
  }

  function handleSubmit(items: AddUrlModal.Item[]) {
    onContinue(items);
    handleClose();
  }

  function handleClose() {
    setUrls([]);
    setUrl("");
    onClose();
  }


  // Renders the list of added items to be submitted to the knowledge base
  function itemRows(): ReactNode {
    if (urls.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-sm text-gray-500">
          No URLs yet
        </div>
      )
    }

    return (
      <div className="flex flex-col">
        {urls.map((it) => (
          <div
            key={it.id}
            className="flex items-center justify-between gap-3 px-3 py-2 border-b last:border-b-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Link2 className="h-4 w-4 text-gray-600" />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{it.url}</div>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => removeUrl(it.id)}
              className="h-8 w-8 p-0 flex items-center justify-center"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    )
  }

  /**
   * Return rendered component
   */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div
        className="relative z-10 w-[min(960px,calc(100vw-2rem))] rounded-2xl bg-white shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b">
          <h3 className="text-sm font-semibold truncate">Add URLs</h3>

          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="h-8 w-8 p-0 flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 flex gap-6 h-[70vh]">
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <div className="h-full rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <Link2 className="h-4 w-4" />
                URL
              </div>

              <div className="flex gap-2">
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className={ cn(
                    'flex-1 h-9 px-3 rounded-md border border-gray-300',
                    'text-sm',
                    'focus:ring-2 focus:ring-gray-200'
                  )}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addUrl();
                  }}
                />
                <Button type="button" variant="outline" onClick={addUrl}>
                  Add
                </Button>
              </div>

              <div className="text-xs text-gray-500">
                Add one or more URLs to ingest into the knowledge base.
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0 rounded-xl border border-gray-200 p-4 flex flex-col">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium text-gray-800">URLs</div>
              <div className="text-xs text-gray-500">{urls.length} item(s)</div>
            </div>

            <div className="mt-3 flex-1 overflow-auto rounded-lg border border-gray-100">
              {itemRows()}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={() => handleSubmit(urls)}
                disabled={urls.length === 0}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export namespace AddUrlModal {
  /**
   * Type def for the uploaded url
   */
  export type Item = {
    id: string;
    type: "url";
    url: string;
  };

  /**
   * Url Modal Options
   */
  export type Options = {
    /**
     * Is the modal open
     */
    isOpen: boolean;

    /**
     * Callback fror close button
     */
    onClose: () => void;

    /**
     * Callback to submit the data to the backend
     */
    onContinue: (urls: Item[]) => void;
  };
}
