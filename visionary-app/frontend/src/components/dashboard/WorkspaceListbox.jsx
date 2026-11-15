import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

/* KAN-210 — the workspace settings listbox.
 *
 * The native <select> fought the workspace's control grammar (hairline
 * fields, apple easing, token colours) and read as non-premium beside the
 * custom controls on the same page (the 2026-10-20 review, finding #5). This
 * control keeps native-grade semantics — role="listbox" with role="option"
 * rows, aria-selected, real roving DOM focus — so screen readers and
 * keyboards get exactly what a select gave them, while the visuals follow
 * the codebase's own listbox pattern (StageDropdown's pill trigger + panel)
 * adapted to the dashboard tokens.
 *
 * Keyboard law: the trigger opens with ArrowDown/ArrowUp/Enter/Space and
 * focuses the selected option; the list supports Arrow navigation, Home/End,
 * first-letter typeahead, Enter/Space commit, Escape closing back to the
 * trigger, and Tab closing without committing. Clicking outside closes. The
 * change commits exactly once per explicit selection — the caller keeps the
 * same save-on-change contract the native selects had.
 */
export default function WorkspaceListbox({ label, value, options, onChange, className = "", menuClassName = "" }) {
  const [open, setOpen] = useState(false);
  const activeRef = useRef(Math.max(0, options.findIndex(option => option.value === value)));
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const baseId = useId();
  const selected = options.find(option => option.value === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;
    const onOutside = event => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  function openList() {
    const index = Math.max(0, options.findIndex(option => option.value === value));
    activeRef.current = index;
    setOpen(true);
    // Focus lands after the panel mounts; the selected row is the anchor.
    requestAnimationFrame(() => {
      const rows = listRef.current?.querySelectorAll('[role="option"]');
      if (rows) (rows[index] || rows[0])?.focus();
    });
  }

  function focusOption(index) {
    const next = Math.min(options.length - 1, Math.max(0, index));
    activeRef.current = next;
    const rows = listRef.current?.querySelectorAll('[role="option"]');
    rows?.[next]?.focus();
  }

  function commit(option) {
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onListKeyDown(event) {
    const index = activeRef.current;
    if (event.key === "ArrowDown") { event.preventDefault(); focusOption(index + 1); }
    else if (event.key === "ArrowUp") { event.preventDefault(); focusOption(index - 1); }
    else if (event.key === "Home") { event.preventDefault(); focusOption(0); }
    else if (event.key === "End") { event.preventDefault(); focusOption(options.length - 1); }
    else if (event.key === "Escape") { event.preventDefault(); setOpen(false); triggerRef.current?.focus(); }
    else if (event.key === "Tab") { setOpen(false); }
    else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      const wanted = event.key.toLowerCase();
      for (let step = 1; step <= options.length; step++) {
        const candidate = (index + step) % options.length;
        if ((options[candidate].label || "").toLowerCase().startsWith(wanted)) { event.preventDefault(); focusOption(candidate); break; }
      }
    }
  }

  function onTriggerKeyDown(event) {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      openList();
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        ref={triggerRef}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${baseId}-listbox` : undefined}
        aria-label={label}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onTriggerKeyDown}
        className="inline-flex min-h-[46px] w-full items-center justify-between gap-3 rounded-[var(--v-radius-control)] border border-[var(--v-outline)] bg-[var(--v-surface)] px-4 py-2.5 text-sm leading-5 text-[var(--v-text)] transition-[border-color,box-shadow] duration-150 ease-apple hover:border-[var(--v-action)] focus-visible:border-[var(--v-action)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--v-action)_25%,transparent)]"
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown aria-hidden="true" size={16} className={`shrink-0 text-[var(--v-muted)] transition-transform duration-150 ease-apple ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul
          ref={listRef}
          id={`${baseId}-listbox`}
          role="listbox"
          aria-label={label}
          onKeyDown={onListKeyDown}
          className={`absolute left-0 z-40 mt-2 w-full min-w-[13rem] max-w-[min(20rem,calc(100vw-3rem))] rounded-[14px] border border-[var(--v-border)] bg-[var(--v-surface)] py-2 shadow-lg ${menuClassName}`}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={-1}
                  onClick={() => commit(option)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors duration-150 ease-apple focus:outline-none focus-visible:bg-[var(--v-soft)] ${isSelected ? "bg-[var(--v-soft)] font-medium text-[var(--v-action)]" : "text-[var(--v-text)] hover:bg-[var(--v-soft)]"}`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check aria-hidden="true" size={16} className="shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
