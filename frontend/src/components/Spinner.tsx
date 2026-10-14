import { cn } from '../lib/cn'

/** Decorative spinner; pair it with visible or screen-reader text. */
export function Spinner({ large = false }: { large?: boolean }) {
  return (
    <span
      className={cn(
        'animate-spin rounded-full border-current border-r-transparent motion-reduce:[animation-duration:2s]',
        large ? 'size-8 border-3 text-primary' : 'size-4 border-2',
      )}
      aria-hidden="true"
    />
  )
}
