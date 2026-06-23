import { app, shell, BrowserWindow, ipcMain, Tray, Menu, powerMonitor, dialog } from 'electron'
import * as fs from 'fs'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.ico?asset'
import * as db from '../db/db'
import { timerManager } from './timer'

let tray: Tray | null = null

function updateTrayTooltip(db: any) {
  if (!tray) return
  try {
    const streaks = db.getStreaks()
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const dateStr = `${yyyy}-${mm}-${dd}`
    const todayStreak = streaks.find((s: any) => s.date === dateStr)
    const seconds = todayStreak ? todayStreak.total_seconds : 0
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`
    tray.setToolTip(`StudyTracker\nFocus Today: ${timeStr}`)
  } catch (err) {
    console.error(err)
  }
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    title: 'StudyTracker',
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  timerManager.addWindow(mainWindow)
}

let miniWindow: BrowserWindow | null = null

function toggleMiniWidget() {
  if (miniWindow && !miniWindow.isDestroyed()) {
    miniWindow.close()
    miniWindow = null
    return
  }

  miniWindow = new BrowserWindow({
    width: 250,
    height: 120,
    show: false,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    resizable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  miniWindow.on('ready-to-show', () => miniWindow?.show())

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    miniWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '#/mini')
  } else {
    miniWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'mini' })
  }

  timerManager.addWindow(miniWindow)
}

// ─── Badge Checking ───────────────────────────────────────────────────────────

function checkAndAwardBadges(db: typeof import('../db/db')) {
  const sessions = db.getSessions().filter((s: any) => s.type === 'pomodoro')
  const streaks = db.getStreaks()
  const totalXP = db.getXP()

  // Build streak count
  function calcCurrentStreak() {
    const recordMap = new Map<string, number>(streaks.map((r: any) => [r.date, Number(r.total_seconds)]))
    let count = 0
    const d = new Date()
    while ((recordMap.get(formatDateLocal(d)) ?? 0) > 0) {
      count++
      d.setDate(d.getDate() - 1)
    }
    // Also accept if yesterday was the last day
    if (count === 0) {
      const yest = new Date(); yest.setDate(yest.getDate() - 1)
      if ((recordMap.get(formatDateLocal(yest)) ?? 0) > 0) {
        let d2 = new Date(yest)
        while ((recordMap.get(formatDateLocal(d2)) ?? 0) > 0) {
          count++
          d2.setDate(d2.getDate() - 1)
        }
      }
    }
    return count
  }

  function formatDateLocal(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
  }

  const totalSeconds = sessions.reduce((a: number, s: any) => a + s.duration_seconds, 0)
  const totalHours = totalSeconds / 3600
  const currentStreak = calcCurrentStreak()

  // Sessions in a single day
  const today = formatDateLocal(new Date())
  const todaySessions = sessions.filter((s: any) => s.date === today).length

  // Longest single session
  const maxSessionSeconds = sessions.reduce((max: number, s: any) => Math.max(max, s.duration_seconds), 0)

  // Calculate maximum unlocked tiers
  const maxStreakTier = Math.floor(currentStreak / 7) // Every 7 days
  const maxHoursTier = Math.floor(totalHours / 50) // Every 50 hours
  const maxDailySessionsTier = Math.floor(todaySessions / 5) // Every 5 sessions a day
  const maxXpTier = Math.floor(totalXP / 1000) // Every 1000 XP
  const maxSessionLenTier = Math.floor(maxSessionSeconds / 3600) // Every 60 minutes single session

  const newBadges: string[] = []
  if (sessions.length >= 1) newBadges.push('first_session')

  for (let i = 1; i <= maxStreakTier; i++) newBadges.push(`streak_tier_${i}`)
  for (let i = 1; i <= maxHoursTier; i++) newBadges.push(`hours_tier_${i}`)
  for (let i = 1; i <= maxDailySessionsTier; i++) newBadges.push(`daily_sessions_tier_${i}`)
  for (let i = 1; i <= maxXpTier; i++) newBadges.push(`xp_tier_${i}`)
  for (let i = 1; i <= maxSessionLenTier; i++) newBadges.push(`session_len_tier_${i}`)

  newBadges.forEach(key => {
    db.earnBadge(key)
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize DB
  db.initDB()
  timerManager.init()

  // Setup Tray
  tray = new Tray(icon)
  const buildTrayMenu = () => {
    const state = timerManager.getState()
    const toggleLabel = state.isActive ? '⏸️ Pause Session' : '▶️ Start Session'
    const contextMenu = Menu.buildFromTemplate([
      { label: toggleLabel, click: () => {
          timerManager.toggle()
          buildTrayMenu()
        }
      },
      { label: '🪟 Toggle Mini Widget', click: () => toggleMiniWidget() },
      { type: 'separator' },
      { label: 'Quit StudyTracker', click: () => app.quit() }
    ])
    tray?.setContextMenu(contextMenu)
  }
  buildTrayMenu()
  updateTrayTooltip(db)

  // Update tray menu state periodically or when timer changes
  setInterval(() => {
    buildTrayMenu()
  }, 1000)

  // Auto-pause detection (5 mins = 300 secs)
  setInterval(() => {
    const idleTime = powerMonitor.getSystemIdleTime()
    if (idleTime >= 300) {
      if (timerManager.getState().isActive && timerManager.getState().mode === 'pomodoro') {
        timerManager.pause('idle')
        buildTrayMenu()
      }
    }
  }, 10000)

  // Timer IPC handlers
  ipcMain.handle('timer-getState', () => timerManager.getState())
  ipcMain.handle('timer-start', () => { timerManager.start(); buildTrayMenu() })
  ipcMain.handle('timer-pause', () => { timerManager.pause(); buildTrayMenu() })
  ipcMain.handle('timer-toggle', () => { timerManager.toggle(); buildTrayMenu() })
  ipcMain.handle('timer-switchMode', (_, mode, autoStart) => { timerManager.switchMode(mode, autoStart); buildTrayMenu() })
  ipcMain.handle('timer-setLabel', (_, label) => timerManager.setLabel(label))
  ipcMain.handle('timer-toggleMiniWidget', () => toggleMiniWidget())
  ipcMain.handle('timer-reloadSettings', () => timerManager.reloadSettings())

  ipcMain.handle('exportData', async () => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export StudyTracker Backup',
      defaultPath: 'studytracker-backup.json',
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    })
    
    if (canceled || !filePath) return false

    try {
      const data = {
        sessions: db.getSessions(),
        todos: db.getTodos(),
        archived_todos: db.getArchivedTodos(),
        streaks: db.getStreaks(),
        settings: {
          pomodoro_duration: db.getSetting('pomodoro_duration'),
          break_duration: db.getSetting('break_duration'),
          daily_goal_hours: db.getSetting('daily_goal_hours'),
          theme: db.getSetting('theme'),
          sound: db.getSetting('sound'),
          auto_start: db.getSetting('auto_start')
        }
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
      return true
    } catch (err) {
      console.error('Export failed', err)
      return false
    }
  })

  // IPC handlers for DB
  ipcMain.handle('getSessions', () => db.getSessions())
  ipcMain.handle('addSession', (_, ...args) => {
    const res = db.addSession(...args)
    updateTrayTooltip(db)

    // Award XP: 1 XP per minute of pomodoro
    const [, duration_seconds, type] = args
    if (type === 'pomodoro') {
      const xpEarned = Math.floor(duration_seconds / 60)
      db.addXP(xpEarned)
    }

    // Badge checks
    checkAndAwardBadges(db)

    return { ...res, newXP: db.getXP() }
  })
  ipcMain.handle('updateSessionMood', (_, ...args) => db.updateSessionMood(...args))
  ipcMain.handle('getTodaySummary', () => db.getTodaySummary())

  ipcMain.handle('getTodos', () => db.getTodos())
  ipcMain.handle('getArchivedTodos', () => db.getArchivedTodos())
  ipcMain.handle('addTodo', (_, ...args) => db.addTodo(...args))
  ipcMain.handle('updateTodo', (_, ...args) => db.updateTodo(...args))
  ipcMain.handle('updateTodoTag', (_, ...args) => db.updateTodoTag(...args))
  ipcMain.handle('updateTodoOrder', (_, orderedIds) => db.updateTodoOrder(orderedIds))
  ipcMain.handle('addStudiedSeconds', (_, ...args) => db.addStudiedSeconds(...args))
  ipcMain.handle('archiveTodo', (_, ...args) => db.archiveTodo(...args))
  ipcMain.handle('deleteTodo', (_, ...args) => db.deleteTodo(...args))

  ipcMain.handle('getRules', () => db.getRules())
  ipcMain.handle('addRule', (_, ...args) => db.addRule(...args))
  ipcMain.handle('updateRule', (_, ...args) => db.updateRule(...args))
  ipcMain.handle('deleteRule', (_, ...args) => db.deleteRule(...args))

  ipcMain.handle('getStreaks', () => db.getStreaks())
  ipcMain.handle('addOrUpdateStreak', (_, ...args) => {
    const res = db.addOrUpdateStreak(...args)
    updateTrayTooltip(db)
    return res
  })

  ipcMain.handle('getSetting', (_, key) => db.getSetting(key))
  ipcMain.handle('setSetting', (_, key, value) => db.setSetting(key, value))

  ipcMain.handle('getXP', () => db.getXP())
  ipcMain.handle('getBadges', () => db.getBadges())
  ipcMain.handle('getPersonalBests', () => db.getPersonalBests())

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
