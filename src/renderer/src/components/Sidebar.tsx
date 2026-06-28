import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { LayoutDashboard, Timer, CheckSquare, BookOpen, Flame, BarChart2, Settings as SettingsIcon, Hexagon, ChevronLeft, ChevronRight } from 'lucide-react'

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
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(isCollapsed))
  }, [isCollapsed])

  return (
    <aside className={`transition-all duration-300 border-r-2 border-foreground bg-card flex flex-col h-screen z-10 shadow-sm relative ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center px-0' : ''}`}>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary flex items-center gap-2">
          <div className="w-8 h-8 flex-shrink-0 rounded-full bg-tertiary shadow-pop-sm flex items-center justify-center border-2 border-foreground">
            <Hexagon className="w-5 h-5 text-foreground stroke-[3px]" />
          </div>
          {!isCollapsed && <span>Tracker</span>}
        </h1>
      </div>
      <nav className={`flex-1 space-y-3 mt-4 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 py-3 rounded-xl transition-all duration-300 font-bold border-2 relative overflow-hidden group ${isCollapsed ? 'justify-center px-0' : 'px-4'} ${
                isActive
                  ? 'bg-primary text-primary-foreground border-foreground shadow-pop'
                  : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted hover:text-foreground hover:border-foreground hover:-translate-y-1 hover:shadow-pop-sm'
              }`
            }
            title={isCollapsed ? item.name : undefined}
          >
            {({ isActive }) => (
              <>
                {/* Decorative background icon stamp */}
                {!isCollapsed && (
                  <div className={`absolute -right-3 -top-3 transition-transform duration-500 group-hover:scale-150 group-hover:rotate-12 pointer-events-none ${isActive ? 'text-primary-foreground opacity-20' : 'text-foreground opacity-5'}`}>
                    <item.icon className="w-16 h-16" />
                  </div>
                )}

                <div className={`p-1.5 flex-shrink-0 rounded-full relative z-10 bg-background text-foreground border-2 border-foreground ${isActive ? 'shadow-[2px_2px_0px_var(--color-primary-foreground)]' : 'shadow-[2px_2px_0px_var(--color-border)]'}`}>
                  <item.icon className="w-4 h-4 stroke-[2.5px]" />
                </div>
                {!isCollapsed && <span className="text-sm relative z-10 whitespace-nowrap">{item.name}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className={`p-4 border-t-2 border-foreground flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase">v1.0.0-pop</p>}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  )
}
