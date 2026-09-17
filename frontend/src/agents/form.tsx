/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type { FormEvent, ReactNode } from 'react';

import { useState } from 'react';

import * as api from '@/api';

import { Button } from '@/components/ui/button';

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';

import { Input } from '@/components/ui/input';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Spinner } from '@/components/ui/spinner';

import { Textarea } from '@/components/ui/textarea';

import { useAgentsConfig } from '@/context';

import { CapabilityChecklist, McpServerRows } from './capabilities';

import { QuickPromptRows } from './quickprompts';

/**
 * A React component that renders the agent authoring form.
 *
 * The form is controlled and validated on submit with `AgentDefinitionSchema`;
 * there is no form library in this app, so field errors are a flat map keyed
 * by the zod issue path.
 */
export function AgentForm(props: AgentForm.Props): ReactNode {
  // Extract the props.
  const { initial, submitLabel, pending, onSubmit } = props;

  // Fetch the authoring options.
  const { models, tools, databases, mcpServers, mcpEnabled } =
    useAgentsConfig();

  // Setup the form state.
  const [draft, setDraft] = useState<api.AgentDefinition>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Create a helper for patching the draft.
  const patch = (update: Partial<api.AgentDefinition>) => {
    setDraft((prev) => ({ ...prev, ...update }));
  };

  // Create the submit handler.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = api.AgentDefinitionSchema.safeParse(draft);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.');
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    await onSubmit(result.data);
  };

  // A model saved earlier may since have been removed from the allowlist. Keep
  // it selectable-but-disabled so the form shows what the agent currently uses.
  const staleModel =
    draft.model && !models.some((m) => m.id === draft.model)
      ? draft.model
      : null;

  // Create the model options.
  const modelItems = models.map((model) => (
    <SelectItem key={model.id} value={model.id}>
      {model.label ?? model.id}
    </SelectItem>
  ));

  // The MCP section is offered when the catalog lists servers or custom URLs
  // are allowed; editing an agent that already has rows always shows it.
  const showMcp =
    mcpServers.length > 0 || mcpEnabled || draft.mcpServers.length > 0;

  // Return the rendered component.
  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <Field>
        <FieldLabel htmlFor="agent-name">Name</FieldLabel>
        <Input
          id="agent-name"
          value={draft.name}
          disabled={pending}
          aria-invalid={Boolean(errors.name)}
          onChange={(e) => patch({ name: e.target.value })}
        />
        {errors.name ? <FieldError>{errors.name}</FieldError> : null}
      </Field>

      <Field>
        <FieldLabel htmlFor="agent-description">Description</FieldLabel>
        <Input
          id="agent-description"
          value={draft.description}
          disabled={pending}
          aria-invalid={Boolean(errors.description)}
          onChange={(e) => patch({ description: e.target.value })}
        />
        <FieldDescription>Shown in the agent picker.</FieldDescription>
        {errors.description ? (
          <FieldError>{errors.description}</FieldError>
        ) : null}
      </Field>

      <Field>
        <FieldLabel htmlFor="agent-model">Model</FieldLabel>
        <Select
          value={draft.model}
          disabled={pending}
          onValueChange={(model) => patch({ model })}
        >
          <SelectTrigger
            id="agent-model"
            className="w-full"
            aria-invalid={Boolean(errors.model)}
          >
            <SelectValue placeholder="Select a model..." />
          </SelectTrigger>
          <SelectContent position="popper">
            {modelItems}
            {staleModel ? (
              <SelectItem value={staleModel} disabled>
                {staleModel} (no longer available)
              </SelectItem>
            ) : null}
          </SelectContent>
        </Select>
        {staleModel ? (
          <FieldDescription>
            This model is no longer offered. Pick another to save.
          </FieldDescription>
        ) : null}
        {errors.model ? <FieldError>{errors.model}</FieldError> : null}
      </Field>

      <Field>
        <FieldLabel htmlFor="agent-instructions">Instructions</FieldLabel>
        <Textarea
          id="agent-instructions"
          rows={10}
          value={draft.instructions}
          disabled={pending}
          aria-invalid={Boolean(errors.instructions)}
          onChange={(e) => patch({ instructions: e.target.value })}
        />
        <FieldDescription>
          The system prompt. Describe the agent's role, tone, and limits.
        </FieldDescription>
        {errors.instructions ? (
          <FieldError>{errors.instructions}</FieldError>
        ) : null}
      </Field>

      {tools.length > 0 ? (
        <CapabilityChecklist
          idPrefix="agent-tool"
          legend="Tools"
          description="Built-in tools this agent may call."
          items={tools.map((tool) => ({
            id: tool.id,
            label: tool.label,
            description: tool.description,
            hint: tool.kind,
          }))}
          value={draft.tools}
          disabled={pending}
          onChange={(selected) => patch({ tools: selected })}
        />
      ) : null}

      {databases.length > 0 ? (
        <CapabilityChecklist
          idPrefix="agent-database"
          legend="Data"
          description="Databases this agent may query, read-only."
          items={databases}
          value={draft.databases}
          disabled={pending}
          onChange={(selected) => patch({ databases: selected })}
        />
      ) : null}

      {showMcp ? (
        <McpServerRows
          servers={mcpServers}
          allowCustomUrl={mcpEnabled}
          value={draft.mcpServers}
          errors={errors}
          disabled={pending}
          onChange={(rows) => patch({ mcpServers: rows })}
        />
      ) : null}

      <QuickPromptRows
        value={draft.quickPrompts}
        errors={errors}
        disabled={pending}
        onChange={(quickPrompts) => patch({ quickPrompts })}
      />

      <div className="flex flex-row justify-end gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner /> : null}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

/**
 * The namespace for the `AgentForm` statics.
 */
export namespace AgentForm {
  /**
   * A type alias for the `AgentForm` props.
   */
  export type Props = {
    /**
     * The definition to seed the form with.
     */
    readonly initial: api.AgentDefinition;

    /**
     * The label for the submit button.
     */
    readonly submitLabel: string;

    /**
     * Whether a submission is in flight.
     */
    readonly pending: boolean;

    /**
     * A callback invoked with the validated definition on submit.
     */
    readonly onSubmit: (definition: api.AgentDefinition) => Promise<void>;
  };
}
