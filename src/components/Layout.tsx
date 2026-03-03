import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

const navItems: { to: string; label: string }[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/accounts', label: 'Accounts' },
  { to: '/bills', label: 'Bills' },
]

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-[var(--surface)] text-gray-100">
      <aside className="hidden w-60 flex-shrink-0 border-r border-border bg-surface-muted md:flex md:flex-col">
        <div className="border-b border-border px-4 py-4">
          <div className="text-lg font-semibold tracking-tight text-white">Vence</div>
          <p className="mt-1 text-xs text-gray-400">Daily Driver Core</p>
        </div>
        <nav className="flex-1 space-y-1 px-2 py-4 text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex items-center rounded-md px-3 py-2 transition-colors',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white',
                ].join(' ')
              }
              end={item.to === '/'}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="border-b border-border bg-surface-muted/80 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-2 md:hidden">
              <span className="text-base font-semibold tracking-tight text-white">Vence</span>
              <span className="text-xs text-gray-400">Dashboard</span>
            </div>
            <div className="hidden items-baseline gap-2 md:flex">
              <span className="text-xl font-semibold tracking-tight text-white">Vence</span>
              <span className="text-sm text-gray-400">Personal finance, on autopilot.</span>
            </div>
            <nav className="flex items-center gap-1 text-xs font-medium md:hidden">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'rounded-full px-3 py-1',
                      isActive
                        ? 'bg-white text-surface'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10',
                    ].join(' ')
                  }
                  end={item.to === '/'}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}

