import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock Electron globally
vi.mock('electron', () => {
  return {
    app: {
      getPath: vi.fn((name) => {
        if (name === 'userData') return './test-data'
        return ''
      }),
      whenReady: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      quit: vi.fn(),
      setAppUserModelId: vi.fn(),
    },
    ipcMain: {
      handle: vi.fn(),
      on: vi.fn(),
    },
    ipcRenderer: {
      invoke: vi.fn(),
      on: vi.fn(),
      send: vi.fn(),
    },
    BrowserWindow: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      loadFile: vi.fn(),
      loadURL: vi.fn(),
      webContents: {
        send: vi.fn(),
        setWindowOpenHandler: vi.fn(),
      },
      show: vi.fn(),
      isDestroyed: vi.fn().mockReturnValue(false),
    })),
    Notification: vi.fn().mockImplementation(() => ({
      show: vi.fn(),
    })),
    Tray: vi.fn().mockImplementation(() => ({
      setToolTip: vi.fn(),
      setContextMenu: vi.fn(),
    })),
    Menu: {
      buildFromTemplate: vi.fn(),
    },
    powerMonitor: {
      getSystemIdleTime: vi.fn().mockReturnValue(0),
    },
    dialog: {
      showSaveDialog: vi.fn().mockResolvedValue({ canceled: true }),
    }
  }
})

// Mock the global window.api for frontend tests
Object.defineProperty(window, 'api', {
  value: {
    db: {
      getSessions: vi.fn().mockResolvedValue([]),
      getTodos: vi.fn().mockResolvedValue([]),
      getStreaks: vi.fn().mockResolvedValue([]),
      getBadges: vi.fn().mockResolvedValue([]),
      getXP: vi.fn().mockResolvedValue(0),
      getPersonalBests: vi.fn().mockResolvedValue({}),
      getTodaySummary: vi.fn().mockResolvedValue({ sessions: [], totalSeconds: 0 }),
      setSetting: vi.fn().mockResolvedValue(undefined),
      getSetting: vi.fn().mockResolvedValue(null),
    },
    timer: {
      getState: vi.fn().mockResolvedValue({ timeLeft: 1500, isActive: false, mode: 'pomodoro', label: 'General', duration: 1500 }),
      onTick: vi.fn(),
      toggle: vi.fn(),
      switchMode: vi.fn(),
      setLabel: vi.fn(),
      onSessionComplete: vi.fn(),
    }
  },
  writable: true
})
