import { expect, mock, test } from 'claude-code/testing'
import type { RenderPropsOf, SessionUsage } from 'claude-code'

const PROPS = {
  hasSurvey: false,
  isWorking: false,
  maxRows: 10,
  bodyColumns: 100,
  scroll: { bodyRows: 9, top: 0 },
  view: {},
} as unknown as RenderPropsOf['AbovePrompt']

const USAGE: SessionUsage = {
  startedAt: 0,
  context: { window: 200000, tokens: 70000, percent: 35 },
  rateLimits: [
    { kind: 'five_hour', percentUsed: 42 },
    { kind: 'seven_day', percentUsed: 85 },
  ],
  cost: { usd: 1.234 },
}

test('band shows limits, context and cost on terminal and desktop', async ($, on) => {
  on('session.usage', () => ({ value: USAGE }))
  on('ui.render', () => ({ type: 'Box', props: { key: 'engine' }, children: [] }))
  mock.clock(on)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'limits-band', surface, component: 'AbovePrompt', props: PROPS })
    const five = await ui.find({ key: 'limit-five_hour' })
    expect(five?.text).toMatch(/5h.*42%/)
    const seven = await ui.find({ key: 'limit-seven_day' })
    expect(seven?.text).toMatch(/7d.*85%/)
    expect((await ui.find({ key: 'context' }))?.text).toMatch(/35%/)
    expect((await ui.find({ key: 'cost' }))?.text).toMatch(/\$1\.23/)
    await ui.unmount()
  }
})

test('/limits hides the band', async ($, on) => {
  on('session.usage', () => ({ value: USAGE }))
  on('ui.render', () => ({ type: 'Box', props: { key: 'engine' }, children: [] }))
  mock.clock(on)

  const result = await $.command.run({ name: 'limits', args: '' } as never)
  expect(result.text).toMatch(/ausgeblendet/)
  const ui = await $.ui.mount({ plugin: 'limits-band', surface: 'terminal', component: 'AbovePrompt', props: PROPS })
  expect(await ui.find({ key: 'limit-five_hour' })).toBeUndefined()
  await ui.unmount()
})
