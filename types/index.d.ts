export type Limit = { kind: string; percentUsed: number; resetsAt?: string }

export type Snapshot = {
  limits: Limit[]
  contextPercent?: number
  usd?: number
}

declare module 'claude-code' {
  interface PluginState {
    'limits-band': { snapshot: Snapshot | null; isHidden: boolean }
  }
}
