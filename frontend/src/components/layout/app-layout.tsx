import type { ReactNode } from 'react'
import { House, UserRound, Users } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'

import { cn } from '@/lib/utils'

const links = [
  { to: '/', label: 'Početna', icon: House },
  { to: '/friends', label: 'Prijatelji', icon: Users },
  { to: '/profile', label: 'Profil', icon: UserRound },
]

type AppLayoutProps = {
  /** Shown on the right of the header, e.g. the sign-out button (passed in from src/app). */
  headerAction?: ReactNode
  /** Rendered once above the page, e.g. a toast for incoming challenges. */
  overlay?: ReactNode
}

function Brand() {
  return (
    <NavLink to="/" className="font-heading text-xl font-bold" aria-label="Ispravi AI, početna">
      Ispravi <span className="rounded-sm bg-marker px-1 text-marker-foreground">AI</span>
    </NavLink>
  )
}

export function AppLayout({ headerAction, overlay }: AppLayoutProps) {
  return (
    <div className="min-h-dvh">
      {overlay}

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-background px-5 py-7 lg:flex">
        <Brand />
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          AI griješi namjerno. Ti pronađi grešku.
        </p>
        <DesktopNavigation />
        <div className="mt-auto rounded-xl border bg-secondary p-4">
          <p className="text-sm font-semibold">Spreman za učenje?</p>
          <p className="mt-1 text-xs text-muted-foreground">Nastavi tamo gdje si stao.</p>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col lg:pl-64">
        <header className="lg:hidden">
          <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6">
            <Brand />
            {headerAction}
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-4 pb-24 sm:px-6 sm:pt-6 lg:px-10 lg:pt-8 lg:pb-12">
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="Glavna navigacija"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-sm lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-3">
          {links.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-14 flex-col items-center justify-center gap-1 text-xs text-muted-foreground',
                    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                    isActive && 'font-semibold text-primary',
                  )
                }
              >
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

function DesktopNavigation() {
  return (
    <nav aria-label="Glavna navigacija" className="mt-10">
      <ul className="flex flex-col gap-2">
        {links.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold text-muted-foreground',
                  'transition-colors hover:bg-secondary hover:text-foreground',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  isActive && 'bg-secondary text-primary',
                )
              }
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
