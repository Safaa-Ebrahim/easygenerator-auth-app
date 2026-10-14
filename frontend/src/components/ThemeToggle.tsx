import { useTheme } from '../theme/theme'
import { cn } from '../lib/cn'
import { MoonIcon, SunIcon } from './icons'

/** Switches between light and dark; the icon shows the theme you'll switch to. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-muted hover:bg-soft hover:text-fg motion-safe:transition-colors',
        className,
      )}
    >
      {isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
    </button>
  )
}
