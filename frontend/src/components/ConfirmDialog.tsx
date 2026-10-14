import { useEffect, useId, useRef } from 'react'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Modal confirmation built on the native <dialog>: showModal() provides the
 * focus trap, Escape to close and an inert background.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // Start on the safe choice so Enter/Space never confirms by accident.
      dialog.querySelector<HTMLButtonElement>('[data-initial-focus]')?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      // Escape key: keep React state in charge of closing.
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      // A click on the backdrop targets the <dialog> element itself.
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-line bg-surface p-0 text-fg shadow-card backdrop:bg-black/50"
    >
      <div className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-1.5">
          <h2 id={titleId} className="text-lg font-bold">
            {title}
          </h2>
          <p id={descriptionId} className="text-muted">
            {description}
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} data-initial-focus>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </dialog>
  )
}
