import type { ReactNode } from 'react'
import { House, Users } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'

import { cn } from '@/lib/utils'

const links = [
  { to: '/', label: 'Početna', icon: House },
  { to: '/friends', label: 'Prijatelji', icon: Users },
]

type AppLayoutProps = {
  /** Shown on the right of the header, e.g. the sign-out button (passed in from src/app). */
  headerAction?: ReactNode
  /** Rendered once above the page, e.g. a toast for incoming challenges. */
  overlay?: ReactNode
}

// Phone-first app shell: header on top, bottom navigation, content in a narrow column on every screen.
export function AppLayout({ headerAction, overlay }: AppLayoutProps) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      {overlay}
      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        <NavLink to="/" className="font-heading text-lg font-bold" aria-label="Ispravi AI, početna">
          Ispravi <span className="rounded-sm bg-marker px-1 text-marker-foreground">AI</span>
        </NavLink>
        {headerAction}
      </header>

      <main className="flex-1 px-4 pt-2 pb-24">
        <Outlet />
      </main>

      <nav
        aria-label="Glavna navigacija"
        className="fixed inset-x-0 bottom-0 border-t bg-background/95 backdrop-blur-sm"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-2">
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
