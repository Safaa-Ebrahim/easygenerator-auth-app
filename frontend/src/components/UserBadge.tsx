import { getInitials } from '../lib/initials'

interface UserBadgeProps {
  name: string
  email: string
}

/** Avatar with initials plus name and email; the text collapses on narrow screens. */
export function UserBadge({ name, email }: UserBadgeProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand-strong"
        aria-hidden="true"
      >
        {getInitials(name)}
      </span>
      {/* On mobile only the avatar is visible; screen readers still get the text. */}
      <div className="flex min-w-0 flex-col leading-tight max-[479px]:sr-only">
        <span className="truncate text-sm font-semibold text-fg">{name}</span>
        <span className="truncate text-xs text-muted">{email}</span>
      </div>
    </div>
  )
}
