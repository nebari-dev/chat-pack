import type { ReactNode } from 'react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

/**
 * The application toast surface.
 *
 * `richColors` renders `toast.error` in destructive red without custom CSS,
 * and `closeButton` makes every toast explicitly dismissible.
 */
function Toaster(props: ToasterProps): ReactNode {
  return (
    <Sonner
      theme="light"
      richColors
      closeButton
      position="top-right"
      {...props}
    />
  );
}

export { Toaster };
