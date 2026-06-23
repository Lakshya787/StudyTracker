import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Timer, CheckSquare, BookOpen, Flame, BarChart2, Settings as SettingsIcon, Hexagon } from 'lucide-react'

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Timer', path: '/timer', icon: Timer },
  { name: 'Todo', path: '/todo', icon: CheckSquare },
  { name: 'Rules', path: '/rules', icon: BookOpen },
  { name: 'Streaks', path: '/streaks', icon: Flame },
  { name: 'Analytics', path: '/analytics', icon: BarChart2 },
  { name: 'Settings', path: '/settings', icon: SettingsIcon },
]

export function Sidebar() {
  return (
    <aside className="w-64 border-r-2 border-foreground bg-card flex flex-col h-screen z-10 shadow-sm relative">
      <div className="p-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-primary flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-tertiary shadow-pop-sm flex items-center justify-center border-2 border-foreground">
            <Hexagon className="w-5 h-5 text-foreground stroke-[3px]" />
          </div>
          Tracker
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-3 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-bold border-2 relative overflow-hidden group ${
                isActive
                  ? 'bg-primary text-primary-foreground border-foreground shadow-pop'
                  : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted hover:text-foreground hover:border-foreground hover:-translate-y-1 hover:shadow-pop-sm'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Decorative background icon stamp */}
                <div className={`absolute -right-3 -top-3 transition-transform duration-500 group-hover:scale-150 group-hover:rotate-12 pointer-events-none ${isActive ? 'text-primary-foreground opacity-20' : 'text-foreground opacity-5'}`}>
                  <item.icon className="w-16 h-16" />
                </div>

                <div className={`p-1.5 rounded-full relative z-10 bg-background text-foreground border-2 border-foreground ${isActive ? 'shadow-[2px_2px_0px_var(--color-primary-foreground)]' : 'shadow-[2px_2px_0px_var(--color-border)]'}`}>
                  <item.icon className="w-4 h-4 stroke-[2.5px]" />
                </div>
                <span className="text-sm relative z-10">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t-2 border-foreground">
        <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase">v1.0.0-pop</p>
      </div>
    </aside>
  )
}
