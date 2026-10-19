import { atom, read, update } from 'claude-code'
import type { Register, SessionUsage } from 'claude-code'

import type { Snapshot } from '../types'

const snapshot = atom({ plugin: 'limits-band', key: 'snapshot' } as const, null)
const isHidden = atom({ plugin: 'limits-band', key: 'isHidden' } as const, false)

const LABELS: Record<string, string> = {
  five_hour: '5h',
  seven_day: '7d',
  spend_limit: 'Budget',
}

const toSnapshot = (u: Pick<SessionUsage, 'rateLimits' | 'context' | 'cost'>): Snapshot => ({
  limits: u.rateLimits.map(l => ({ kind: l.kind, percentUsed: l.percentUsed, resetsAt: l.resetsAt })),
  contextPercent: u.context.percent,
  usd: u.cost?.usd,
})

const colorFor = (percent: number) => (percent >= 80 ? 'error' : percent >= 50 ? 'warning' : 'success')

const untilReset = (resetsAt: string | undefined, now: number) => {
  if (resetsAt === undefined) return ''
  const minutes = Math.max(0, Math.round((Date.parse(resetsAt) - now) / 60000))
  if (Number.isNaN(minutes)) return ''
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = minutes % 60
  if (days > 0) return `↻ ${days}d ${hours}h`
  if (hours > 0) return `↻ ${hours}h ${mins}m`
  return `↻ ${mins}m`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await update($, snapshot, () => null)
    $.command.register({ name: 'limits', description: 'Limit-Anzeige über dem Prompt ein- oder ausblenden' })
    return result
  })

  on('command.run', { name: 'limits' }, async ($, e, next) => {
    const hidden = await update($, isHidden, h => !h)
    return { text: hidden ? 'Limit-Anzeige ausgeblendet.' : 'Limit-Anzeige eingeblendet.' }
  })

  on('session.measure', async ($, e, next) => {
    await update($, snapshot, () => toSnapshot(e))
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || (await read($, isHidden))) {
      return next(e)
    }

    const snap = (await read($, snapshot)) ?? toSnapshot(await $.session.usage())
    const hasAnything = snap.limits.length > 0 || snap.contextPercent !== undefined || snap.usd !== undefined
    if (!hasAnything) {
      return next(e)
    }

    const now = await $.clock.now()
    const { Box, Text } = $.ui.resolve(e)

    const Meter = ({ label, percent, suffix }: { label: string; percent: number; suffix?: string }) => (
      <Box flexDirection="row" columnGap={1}>
        <Text dimColor>{label}</Text>
        <Text bold color={colorFor(percent)}>{percent}%</Text>
        {suffix ? <Text dimColor>{suffix}</Text> : null}
      </Box>
    )

    return (
      <Box flexDirection="row" flexWrap="nowrap" columnGap={2}>
        {snap.limits.map(l => (
          <Box key={`limit-${l.kind}`} flexShrink={0}>
            <Meter label={LABELS[l.kind] ?? l.kind} percent={l.percentUsed} suffix={untilReset(l.resetsAt, now)} />
          </Box>
        ))}
        {snap.contextPercent !== undefined && (
          <Box key="context" flexShrink={0}>
            <Meter label="Kontext" percent={snap.contextPercent} />
          </Box>
        )}
        {snap.usd !== undefined && (
          <Box key="cost" flexShrink={0}>
            <Box flexDirection="row" columnGap={1}>
              <Text dimColor>Kosten</Text>
              <Text>${snap.usd.toFixed(2)}</Text>
            </Box>
          </Box>
        )}
      </Box>
    )
  })
}
