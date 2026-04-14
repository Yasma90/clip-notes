import { ClipNotesAPI } from '../renderer/src/types'

declare global {
  interface Window {
    api: ClipNotesAPI
  }
}
