import { ipcMain, shell } from 'electron'
import * as noteService from './services/note-service'
import * as topicService from './services/topic-service'
import path from 'path'

export function registerIpcHandlers(): void {
  ipcMain.handle('note:save', (_event, note) => noteService.saveNote(note))

  ipcMain.handle('note:update', (_event, filePath, note) =>
    noteService.updateNote(filePath, note)
  )

  ipcMain.handle('note:list', (_event, filter?) => noteService.listNotes(filter))

  ipcMain.handle('note:read', (_event, filePath) => noteService.readNote(filePath))

  ipcMain.handle('note:delete', (_event, filePath) => noteService.deleteNote(filePath))

  ipcMain.handle('topic:list', () => topicService.getTopics())

  ipcMain.handle('topic:create', (_event, name) => topicService.createTopic(name))

  ipcMain.handle('date:groups', () => noteService.getDateGroups())

  ipcMain.handle('fs:notesDir', () => noteService.getNotesDir())

  ipcMain.handle('fs:openExplorer', (_event, filePath) => {
    shell.showItemInFolder(path.normalize(filePath))
  })
}
