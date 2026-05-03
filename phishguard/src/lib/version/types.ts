export interface UpdateState {
  updateAvailable: boolean
  dismissedVersion: string | null
  loading: boolean
  error: string | null
  remoteVersion: string | null
}

export type UpdateAction =
  | { type: 'DISMISS'; version: string }
  | { type: 'SET_REMOTE'; version: string }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'RESET' }

export const INITIAL_STATE: UpdateState = {
  updateAvailable: false,
  dismissedVersion: null,
  loading: false,
  error: null,
  remoteVersion: null,
}