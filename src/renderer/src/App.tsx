import { HashRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Timer } from './pages/Timer'
import { Todo } from './pages/Todo'
import { Rules } from './pages/Rules'
import { Streaks } from './pages/Streaks'
import { Analytics } from './pages/Analytics'
import { Settings } from './pages/Settings'
import { MiniTimer } from './components/MiniTimer'

function App() {
  useEffect(() => {
    // Load theme on startup
    // @ts-ignore
    window.api.db.getSetting('theme').then((theme) => {
      const t = theme || 'dark'
      document.body.className = `theme-${t}`
    })
  }, [])

  return (
    <HashRouter>
      <Routes>
        <Route path="/mini" element={<MiniTimer />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="timer" element={<Timer />} />
          <Route path="todo" element={<Todo />} />
          <Route path="rules" element={<Rules />} />
          <Route path="streaks" element={<Streaks />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
