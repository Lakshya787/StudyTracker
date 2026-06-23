import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
import { ipcRenderer } from 'electron'

const api = {
  db: {
    getSessions: () => ipcRenderer.invoke('getSessions'),
    addSession: (...args) => ipcRenderer.invoke('addSession', ...args),
    updateSessionMood: (...args) => ipcRenderer.invoke('updateSessionMood', ...args),
    getTodaySummary: () => ipcRenderer.invoke('getTodaySummary'),
    getTodos: () => ipcRenderer.invoke('getTodos'),
    getArchivedTodos: () => ipcRenderer.invoke('getArchivedTodos'),
    addTodo: (...args) => ipcRenderer.invoke('addTodo', ...args),
    updateTodo: (...args) => ipcRenderer.invoke('updateTodo', ...args),
    updateTodoTag: (...args) => ipcRenderer.invoke('updateTodoTag', ...args),
    updateTodoOrder: (...args) => ipcRenderer.invoke('updateTodoOrder', ...args),
    addStudiedSeconds: (...args) => ipcRenderer.invoke('addStudiedSeconds', ...args),
    archiveTodo: (...args) => ipcRenderer.invoke('archiveTodo', ...args),
    deleteTodo: (...args) => ipcRenderer.invoke('deleteTodo', ...args),
    getRules: () => ipcRenderer.invoke('getRules'),
    addRule: (...args) => ipcRenderer.invoke('addRule', ...args),
    updateRule: (...args) => ipcRenderer.invoke('updateRule', ...args),
    deleteRule: (...args) => ipcRenderer.invoke('deleteRule', ...args),
    getStreaks: () => ipcRenderer.invoke('getStreaks'),
    addOrUpdateStreak: (...args) => ipcRenderer.invoke('addOrUpdateStreak', ...args),
    getSetting: (...args) => ipcRenderer.invoke('getSetting', ...args),
    setSetting: (...args) => ipcRenderer.invoke('setSetting', ...args),
    getXP: () => ipcRenderer.invoke('getXP'),
    getBadges: () => ipcRenderer.invoke('getBadges'),
    getPersonalBests: () => ipcRenderer.invoke('getPersonalBests'),
    exportData: () => ipcRenderer.invoke('exportData'),
  },
  timer: {
    getState: () => ipcRenderer.invoke('timer-getState'),
    start: () => ipcRenderer.invoke('timer-start'),
    pause: () => ipcRenderer.invoke('timer-pause'),
    toggle: () => ipcRenderer.invoke('timer-toggle'),
    switchMode: (mode: string, autoStart: boolean) => ipcRenderer.invoke('timer-switchMode', mode, autoStart),
    setLabel: (label: string) => ipcRenderer.invoke('timer-setLabel', label),
    toggleMiniWidget: () => ipcRenderer.invoke('timer-toggleMiniWidget'),
    reloadSettings: () => ipcRenderer.invoke('timer-reloadSettings'),
    onTick: (callback: (state: any) => void) => {
      // Need to clean up old listeners if called multiple times, or just use `on`
      ipcRenderer.removeAllListeners('timer-tick')
      ipcRenderer.on('timer-tick', (_event, state) => callback(state))
    },
    onSessionComplete: (callback: (payload: any) => void) => {
      ipcRenderer.removeAllListeners('session-complete')
      ipcRenderer.on('session-complete', (_event, payload) => callback(payload))
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to

// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
