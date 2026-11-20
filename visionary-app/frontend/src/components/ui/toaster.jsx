import { useToast } from "@/components/ui/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

/**
 * Toaster — toast shim DOM-safety law (FAP-86):
 * - The use-toast store keeps two Radix-compat fields on every toast
 *   (open, onOpenChange) for API faithfulness. They are NOT DOM props:
 *   both are destructured out here so the raw <div> inside ui/toast.jsx
 *   never receives the camelCase handler that made React warn "Unknown
 *   event handler property `onOpenChange`" on every toast render.
 * - `open === false` hides the toast (the store's dismiss() sets it), and
 *   ToastClose is wired to onOpenChange(false) — the same Radix semantic —
 *   so the shim's x control actually dismisses.
 * - The store (use-toast.jsx) and the primitives (toast.jsx) stay
 *   byte-identical; all non-DOM handling lives in this consumer.
 */
export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, open = true, onOpenChange, ...props }) {
        if (!open) return null;
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose onClick={() => onOpenChange(false)} />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
} 