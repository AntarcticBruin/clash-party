import { beforeEach, describe, expect, it, vi } from 'vitest'
import { parse, stringify } from '../utils/yaml'
import { defaultLocalDraft, type LocalState } from '../../shared/local-config'
import { configureLocalSource } from './service'
import { compileLocalConfig } from './compiler'
import { resolveLocalDraft } from './subscriptions'

let item: IProfileItem
let state: LocalState
let saved: Record<string, unknown>
const node = { name: 'node', type: 'http', server: '127.0.0.1', port: 8080 }
const unrelated = { ...node, name: 'unrelated' }

vi.mock('electron', () => ({ app: { getVersion: () => '2.0.4' }, dialog: {} }))
vi.mock('../config/app', () => ({ getAppConfig: async () => ({}) }))
vi.mock('../config/profile', () => ({
  getProfileItem: async () => item,
  getProfileConfig: async () => ({ current: 'local', items: [item] }),
  getProfile: async () => ({ proxies: [node] })
}))
vi.mock('./store', () => ({
  localWriteQueue: { run: (operation: () => unknown) => operation() },
  getLocalState: async () => structuredClone(state),
  commitLocalState: async (_previous: LocalState, next: LocalState) => {
    const result = compileLocalConfig(await resolveLocalDraft(next.published))
    saved = parse(result.yaml)
    return result
  },
  saveLocalState: vi.fn(),
  compileAndWriteLocal: vi.fn(),
  isLocalProfileActive: async () => false
}))

beforeEach(() => {
  item = { id: 'subscription', type: 'remote', name: 'Renamed', url: 'https://example.test/sub' }
  const draft = defaultLocalDraft()
  draft.modules.proxies = stringify([{ ...node, name: '[Old] node' }, unrelated])
  draft.modules['proxy-groups'] = stringify([
    { name: 'PROXY', type: 'select', proxies: ['[Old] node', 'unrelated'] }
  ])
  state = { version: 2, revision: 1, draft, published: structuredClone(draft) }
  saved = {}
})

describe('editing persisted subscription sources', () => {
  it('renames a legacy node source without duplicating nodes or losing group members', async () => {
    const reference = await configureLocalSource(
      item.id,
      { mode: 'nodes', providerName: 'Old', prefix: '[Old] ', targetGroups: ['PROXY'] },
      { ...item, name: 'Old' }
    )
    expect(reference).toEqual({ name: 'Old', prefix: '[Old] ' })
    expect((saved.proxies as { name: string }[]).map((entry) => entry.name).sort()).toEqual([
      '[Old] node',
      'unrelated'
    ])
    expect((saved['proxy-groups'] as { proxies: string[] }[])[0].proxies.sort()).toEqual([
      '[Old] node',
      'unrelated'
    ])
  })

  it('uses the saved source reference after the display name changes again', async () => {
    item.sourceReference = { name: 'Old', prefix: '[Old] ' }
    const reference = await configureLocalSource(item.id, { mode: 'nodes', prefix: '[New] ' })
    expect(reference).toEqual({ name: 'Old', prefix: '[New] ' })
    expect((saved.proxies as { name: string }[]).map((entry) => entry.name).sort()).toEqual([
      '[New] node',
      'unrelated'
    ])
    expect((saved['proxy-groups'] as { proxies: string[] }[])[0].proxies).toContain('[New] node')
  })

  it('converts legacy nodes to a provider while retaining unrelated nodes and references', async () => {
    item.sourceReference = { name: 'Old', prefix: '[Old] ' }
    await configureLocalSource(item.id, { mode: 'group', targetGroups: ['PROXY'] })
    expect((saved.proxies as { name: string }[]).map((entry) => entry.name)).toEqual(['unrelated'])
    expect(saved['proxy-providers']).toHaveProperty('Old')
    expect((saved['proxy-groups'] as { proxies: string[]; use: string[] }[])[0]).toMatchObject({
      proxies: ['unrelated'],
      use: ['Old']
    })
  })

  it('limits an unprefixed source to its own nodes', async () => {
    item.sourceReference = { name: 'Old', prefix: '' }
    state.draft.modules.proxies = stringify([node, unrelated])
    state.draft.modules['proxy-groups'] = stringify([
      { name: 'PROXY', type: 'select', proxies: ['node', 'unrelated'] }
    ])
    state.published = structuredClone(state.draft)
    await configureLocalSource(item.id, { mode: 'group', targetGroups: ['PROXY'] })
    expect((saved.proxies as { name: string }[]).map((entry) => entry.name)).toEqual(['unrelated'])
    expect((saved['proxy-groups'] as { proxies: string[] }[])[0].proxies).toEqual(['unrelated'])
  })
})
