import { contextBridge, ipcRenderer } from 'electron'

const api = {
  saveNote: (note: { title: string; body: string; topic: string; tags: string[] }) =>
    ipcRenderer.invoke('note:save', note),

  updateNote: (filePath: string, note: { title: string; body: string; topic: string; tags: string[] }) =>
    ipcRenderer.invoke('note:update', filePath, note),

  listNotes: (filter?: {
    topic?: string
    yearMonth?: string
    date?: string
    searchQuery?: string
  }) => ipcRenderer.invoke('note:list', filter),

  readNote: (filePath: string) => ipcRenderer.invoke('note:read', filePath),

  deleteNote: (filePath: string) => ipcRenderer.invoke('note:delete', filePath),

  getTopics: () => ipcRenderer.invoke('topic:list'),

  createTopic: (name: string) => ipcRenderer.invoke('topic:create', name),

  getDateGroups: () => ipcRenderer.invoke('date:groups'),

  getNotesDir: () => ipcRenderer.invoke('fs:notesDir'),

  openInExplorer: (filePath: string) => ipcRenderer.invoke('fs:openExplorer', filePath)
}

contextBridge.exposeInMainWorld('api', api)
