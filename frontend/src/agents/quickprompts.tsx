/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { Plus, X } from 'lucide-react';

import type { ReactNode } from 'react';

import type * as api from '@/api';

import { Button } from '@/components/ui/button';

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';

import { Input } from '@/components/ui/input';

import { Textarea } from '@/components/ui/textarea';

/**
 * The maximum number of quick prompts an agent may advertise.
 */
const MAX_QUICK_PROMPTS = 12;

/**
 * A React component that edits the list of quick prompts for an agent.
 */
export function QuickPromptRows(props: QuickPromptRows.Props): ReactNode {
  // Extract the props.
  const { value, onChange, errors, disabled } = props;

  // Create the handler for adding a row.
  const handleAdd = () => {
    onChange([...value, { title: '', description: '', prompt: '' }]);
  };

  // Create the handler for removing a row.
  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  // Create the handler for editing one field of a row.
  const update = (
    index: number,
    patch: Partial<api.QuickPromptInput>,
  ): void => {
    onChange(
      value.map((prompt, i) =>
        i === index ? { ...prompt, ...patch } : prompt,
      ),
    );
  };

  // Create the rows.
  const rows = value.map((prompt, index) => {
    const key = `quickPrompts.${index}`;
    const titleId = `quick-prompt-${index}-title`;
    const descriptionId = `quick-prompt-${index}-description`;
    const promptId = `quick-prompt-${index}-prompt`;
    return (
      <fieldset
        key={key}
        className="relative flex flex-col gap-3 rounded-sm border border-border p-3"
      >
        <legend className="px-1 text-sm font-medium">
          Quick prompt {index + 1}
        </legend>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-2 right-2"
          aria-label={`Remove quick prompt ${index + 1}`}
          disabled={disabled}
          onClick={() => remove(index)}
        >
          <X />
        </Button>
        <Field>
          <FieldLabel htmlFor={titleId}>Prompt title</FieldLabel>
          <Input
            id={titleId}
            value={prompt.title}
            disabled={disabled}
            aria-invalid={Boolean(errors[`${key}.title`])}
            onChange={(e) => update(index, { title: e.target.value })}
          />
          {errors[`${key}.title`] ? (
            <FieldError>{errors[`${key}.title`]}</FieldError>
          ) : null}
        </Field>
        <Field>
          <FieldLabel htmlFor={descriptionId}>Prompt description</FieldLabel>
          <Input
            id={descriptionId}
            value={prompt.description}
            disabled={disabled}
            aria-invalid={Boolean(errors[`${key}.description`])}
            onChange={(e) => update(index, { description: e.target.value })}
          />
          {errors[`${key}.description`] ? (
            <FieldError>{errors[`${key}.description`]}</FieldError>
          ) : null}
        </Field>
        <Field>
          <FieldLabel htmlFor={promptId}>Prompt text</FieldLabel>
          <Textarea
            id={promptId}
            rows={2}
            value={prompt.prompt}
            disabled={disabled}
            aria-invalid={Boolean(errors[`${key}.prompt`])}
            onChange={(e) => update(index, { prompt: e.target.value })}
          />
          {errors[`${key}.prompt`] ? (
            <FieldError>{errors[`${key}.prompt`]}</FieldError>
          ) : null}
        </Field>
      </fieldset>
    );
  });

  // Return the rendered component.
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-row items-center">
        <div className="flex flex-col">
          <span className="text-sm font-medium">Quick prompts</span>
          <FieldDescription>
            Starter cards shown in an empty chat with this agent.
          </FieldDescription>
        </div>
        <div className="grow" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || value.length >= MAX_QUICK_PROMPTS}
          onClick={handleAdd}
        >
          <Plus />
          Add quick prompt
        </Button>
      </div>
      {rows}
    </div>
  );
}

/**
 * The namespace for the `QuickPromptRows` statics.
 */
export namespace QuickPromptRows {
  /**
   * A type alias for the `QuickPromptRows` props.
   */
  export type Props = {
    /**
     * The current quick prompts.
     */
    readonly value: readonly api.QuickPromptInput[];

    /**
     * A callback invoked with the updated list.
     */
    readonly onChange: (value: api.QuickPromptInput[]) => void;

    /**
     * Field errors keyed by dotted path, e.g. `quickPrompts.0.title`.
     */
    readonly errors: Readonly<Record<string, string>>;

    /**
     * Whether the inputs are disabled.
     */
    readonly disabled: boolean;
  };
}
