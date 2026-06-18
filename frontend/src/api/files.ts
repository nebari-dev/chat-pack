/*------------------------------------------------------------------------------
| Copyright (c) 2026-present, OpenTeams Inc.
|-----------------------------------------------------------------------------*/
import * as agui from '@ag-ui/core';
import * as z from 'zod';
import * as auth from '@/auth';

/**
 * The schema for the supported file input content types.
 *
 * Note: This is very close to `agui.InputContent`, but *does not* allow
 * the deprecated binary input content type. This makes the types simpler
 * on both the frontend and backend.
 */
export const FileInputContentSchema = z.discriminatedUnion('type', [
  agui.ImageInputContentSchema,
  agui.AudioInputContentSchema,
  agui.VideoInputContentSchema,
  agui.DocumentInputContentSchema,
]);

/**
 * A type alias for the supported file input content types.
 */
export type FileInputContent = z.infer<typeof FileInputContentSchema>;

/**
 * The custom mime-type for the ravnar file content source.
 *
 * This mime-type allows us to detect ravnar file content, which is
 * type-compatible with ag-ui, but has slightly different semantics.
 */
export const RAVNAR_FILE_CONTENT_SOURCE_MIME_TYPE =
  'application/vnd.ravnar.json-b64';

/**
 * The schema for ravnar file content handles.
 *
 * This schema is compatible with ag-ui input content, but is identified
 * by it's custom mime-type and allows us to handle it appropriately.
 */
export const RavnarFileContentSchema = z.object({
  type: z.enum(['image', 'audio', 'video', 'document']),
  source: z.object({
    type: z.literal('data'),
    value: z.string(),
    mimeType: z.literal(RAVNAR_FILE_CONTENT_SOURCE_MIME_TYPE),
  }),
  metadata: z.record(z.any()).optional(),
});

/**
 * A type alias for a ravnar file content handle.
 *
 * This is the return type from uploading a file to ravnar. It serves as
 * a lightweight handle for retrieving previously uploaded file contents,
 * instead of saturating the message stream with the full file contents.
 */
export type RavnarFileContent = z.infer<typeof RavnarFileContentSchema>;

/**
 * The schema for the decoded source value of a ravnar file content handle.
 *
 * This includes the necessary meta-info to uniquely identify the file
 * on the ravnar server.
 */
const RavnarFileContentSourceValueSchema = z.object({
  fileId: z.string().uuid(),
  mimeType: z.string(),
  sourceType: z.string(),
  createdAt: z.string().datetime(),
  sourceData: z.record(z.any()).nullish(),
});

/**
 * A type alias for a decoded ravnar file content source value.
 */
export type RavnarFileContentSourceValue = z.infer<
  typeof RavnarFileContentSourceValueSchema
>;

/**
 * A convenience function to cast a file input to ravnar file content.
 */
export function isRavnarFileContent(
  content: FileInputContent,
): content is RavnarFileContent {
  return content.source.mimeType === RAVNAR_FILE_CONTENT_SOURCE_MIME_TYPE;
}

/**
 * Given a ravnar file content handle, decode its source value.
 *
 * This is useful when needing to decode the meta info contained within
 * a ravnar file content handle.
 */
export function decodeRavnarFileContentSourceValue(
  content: RavnarFileContent,
): RavnarFileContentSourceValue {
  // Convert the base64 encoded string into an array of bytes.
  const bytes = Uint8Array.fromBase64(content.source.value);

  // Decode the bytes into a string and parse them as JSON.
  const json = JSON.parse(new TextDecoder().decode(bytes));

  // Return the validated JSON.
  return RavnarFileContentSourceValueSchema.parse(json);
}

/**
 * Upload file input content to the server.
 *
 * This returns a ravnar file content handle for later use. Notably, the
 * handle is type-compatible with ag-ui, so it can be used in the content
 * array of ag-ui user messages.
 */
export async function uploadFile(
  content: FileInputContent,
): Promise<RavnarFileContent> {
  // Fetch the resource.
  const resp = await auth.fetch('/api/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(content),
  });

  // Return the parsed result.
  return RavnarFileContentSchema.parse(await resp.json());
}
