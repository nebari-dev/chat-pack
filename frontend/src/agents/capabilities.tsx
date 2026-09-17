/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { Plus, X } from 'lucide-react';

import type { ReactNode } from 'react';

import type * as api from '@/api';

import { Button } from '@/components/ui/button';

import { Checkbox } from '@/components/ui/checkbox';

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { CatalogMcpServer } from '@/config';

/**
 * The maximum number of MCP servers an agent may attach.
 */
const MAX_MCP_SERVERS = 8;

/**
 * The select value that stands for "enter a custom URL".
 */
const CUSTOM_URL = '__custom__';

/**
 * A React component that renders a checklist of catalog entries.
 */
export function CapabilityChecklist(
  props: CapabilityChecklist.Props,
): ReactNode {
  // Extract the props.
  const { idPrefix, legend, description, items, value, onChange, disabled } =
    props;

  // Create the toggle handler.
  const toggle = (id: string, checked: boolean) => {
    const next = value.filter((v) => v !== id);
    onChange(checked ? [...next, id] : next);
  };

  // Create the rows.
  const rows = items.map((item) => {
    const inputId = `${idPrefix}-${item.id}`;
    const checked = value.includes(item.id);
    return (
      <div key={item.id} className="flex flex-row items-start gap-2">
        <Checkbox
          id={inputId}
          checked={checked}
          disabled={disabled}
          className="mt-0.5"
          onCheckedChange={(state) => toggle(item.id, state === true)}
        />
        <div className="flex flex-col">
          <Label htmlFor={inputId} className="font-normal">
            {item.label}
            {item.hint ? (
              <span className="text-muted-foreground"> · {item.hint}</span>
            ) : null}
          </Label>
          {item.description ? (
            <span className="text-xs text-muted-foreground">
              {item.description}
            </span>
          ) : null}
        </div>
      </div>
    );
  });

  // Return the rendered component.
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">{legend}</legend>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {rows}
    </fieldset>
  );
}

/**
 * The namespace for the `CapabilityChecklist` statics.
 */
export namespace CapabilityChecklist {
  /**
   * A selectable catalog entry.
   */
  export type Item = {
    readonly id: string;
    readonly label: string;
    readonly description?: string;
    readonly hint?: string;
  };

  /**
   * A type alias for the `CapabilityChecklist` props.
   */
  export type Props = {
    readonly idPrefix: string;
    readonly legend: string;
    readonly description?: string;
    readonly items: readonly Item[];
    readonly value: readonly string[];
    readonly onChange: (value: string[]) => void;
    readonly disabled: boolean;
  };
}

/**
 * A React component that edits the list of MCP servers attached to an agent.
 *
 * Each row picks a catalog server or, where the deployment allows it, a
 * custom URL (represented by a blank `server`).
 */
export function McpServerRows(props: McpServerRows.Props): ReactNode {
  // Extract the props.
  const { servers, allowCustomUrl, value, onChange, errors, disabled } = props;

  // Create the handler for adding a row, defaulting to the first catalog
  // server or, failing that, a custom URL.
  const handleAdd = () => {
    const first = servers[0];
    onChange([...value, { server: first ? first.id : '', url: '' }]);
  };

  // Create the handler for removing a row.
  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  // Create the handler for editing a row.
  const update = (index: number, patch: Partial<api.McpServerInput>) => {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  // Create the select options.
  const options = servers.map((server) => (
    <SelectItem key={server.id} value={server.id}>
      {server.label}
      {server.auth === 'impersonate' ? ' (acts as you)' : ''}
    </SelectItem>
  ));
  if (allowCustomUrl) {
    options.push(
      <SelectItem key={CUSTOM_URL} value={CUSTOM_URL}>
        Custom URL…
      </SelectItem>,
    );
  }

  // Create the rows.
  const rows = value.map((row, index) => {
    const key = `mcpServers.${index}`;
    const selectId = `mcp-server-${index}`;
    const urlId = `mcp-server-${index}-url`;
    const isCustom = row.server === '';
    const selected = servers.find((s) => s.id === row.server);
    return (
      <fieldset
        key={key}
        className="relative flex flex-col gap-3 rounded-sm border border-border p-3"
      >
        <legend className="px-1 text-sm font-medium">
          MCP server {index + 1}
        </legend>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-2 right-2"
          aria-label={`Remove MCP server ${index + 1}`}
          disabled={disabled}
          onClick={() => remove(index)}
        >
          <X />
        </Button>
        <Field>
          <FieldLabel htmlFor={selectId}>Server</FieldLabel>
          <Select
            value={isCustom ? CUSTOM_URL : row.server}
            disabled={disabled}
            onValueChange={(next) =>
              update(
                index,
                next === CUSTOM_URL
                  ? { server: '', url: row.url }
                  : { server: next, url: '' },
              )
            }
          >
            <SelectTrigger id={selectId} className="w-full">
              <SelectValue placeholder="Select a server..." />
            </SelectTrigger>
            <SelectContent position="popper">{options}</SelectContent>
          </Select>
          {selected?.description ? (
            <FieldDescription>{selected.description}</FieldDescription>
          ) : null}
          {selected?.auth === 'impersonate' ? (
            <FieldDescription>
              Calls to this server are made on behalf of the signed-in user.
            </FieldDescription>
          ) : null}
        </Field>
        {isCustom ? (
          <Field>
            <FieldLabel htmlFor={urlId}>URL</FieldLabel>
            <Input
              id={urlId}
              type="url"
              placeholder="https://"
              value={row.url}
              disabled={disabled}
              aria-invalid={Boolean(errors[`${key}.url`])}
              onChange={(e) => update(index, { url: e.target.value })}
            />
            <FieldDescription>
              A streamable HTTP MCP endpoint. Its host must be on the
              deployment's allowlist.
            </FieldDescription>
            {errors[`${key}.url`] ? (
              <FieldError>{errors[`${key}.url`]}</FieldError>
            ) : null}
          </Field>
        ) : null}
      </fieldset>
    );
  });

  // Return the rendered component.
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-row items-center">
        <div className="flex flex-col">
          <span className="text-sm font-medium">MCP servers</span>
          <FieldDescription>
            Remote tool servers this agent may call.
          </FieldDescription>
        </div>
        <div className="grow" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || value.length >= MAX_MCP_SERVERS}
          onClick={handleAdd}
        >
          <Plus />
          Add MCP server
        </Button>
      </div>
      {rows}
    </div>
  );
}

/**
 * The namespace for the `McpServerRows` statics.
 */
export namespace McpServerRows {
  /**
   * A type alias for the `McpServerRows` props.
   */
  export type Props = {
    readonly servers: readonly CatalogMcpServer[];
    readonly allowCustomUrl: boolean;
    readonly value: readonly api.McpServerInput[];
    readonly onChange: (value: api.McpServerInput[]) => void;
    readonly errors: Readonly<Record<string, string>>;
    readonly disabled: boolean;
  };
}
