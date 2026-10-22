/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { Avatar as AvatarPrimitive } from '@base-ui/react/avatar';

import { cn } from '@/lib/utils';

/**
 * An app-owned avatar built on Base UI.
 *
 * The Nebari registry ships no avatar, so every Nebari app owns one. It lives
 * outside `components/ui/` because that folder holds registry-managed files
 * that `npx shadcn add` may overwrite.
 */
function Avatar({ className, ...props }: AvatarPrimitive.Root.Props) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        'relative flex size-8 shrink-0 select-none overflow-hidden rounded-full',
        className,
      )}
      {...props}
    />
  );
}

/**
 * The avatar image. Base UI renders the fallback while it loads or on error.
 */
function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full object-cover', className)}
      {...props}
    />
  );
}

/**
 * The avatar fallback, typically initials.
 */
function AvatarFallback({
  className,
  ...props
}: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'flex size-full items-center justify-center rounded-full bg-muted text-muted-foreground-strong text-sm',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Derive up to two initials from a display name, falling back to the email.
 */
function getInitials(name?: string, email?: string): string {
  const source = name?.trim() || email?.split('@')[0] || '';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * Derive up to two initials from an agent name, one from each of its first
 * two words.
 *
 * Unlike a person's name, an agent name tends to put its distinguishing word
 * second and trail off into versions or qualifiers ("Claude Sonnet 5.5"), so
 * the last word is a poor pick.
 */
function getAgentInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export { Avatar, AvatarFallback, AvatarImage, getAgentInitials, getInitials };
