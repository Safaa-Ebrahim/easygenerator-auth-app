import type { ReactNode } from 'react'
import { BrandMark } from './BrandMark'
import { ThemeToggle } from './ThemeToggle'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

/** Centered card layout shared by the sign-up and sign-in pages. */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="bg-auth-glow relative grid min-h-svh place-items-center px-4 py-16 sm:py-6">
      <ThemeToggle className="absolute top-3 right-3 sm:top-4 sm:right-4" />
      <main className="flex w-full max-w-110 flex-col gap-6 rounded-[20px] border border-line bg-surface px-6 py-8 shadow-card sm:px-12 sm:pt-12 sm:pb-8">
        <BrandMark />
        <header className="flex flex-col gap-1">
          <h1 className="text-[1.625rem] leading-tight font-bold tracking-tight">{title}</h1>
          <p className="text-muted">{subtitle}</p>
        </header>
        {children}
        <footer className="border-t border-line pt-4 text-center text-[0.95rem] text-muted">
          {footer}
        </footer>
      </main>
    </div>
  )
}
