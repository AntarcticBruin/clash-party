import { describe, expect, it } from 'vitest'
import { mergeSiderOrder, SIDER_CARD_KEYS } from './sider'

describe('fixed sidebar switches', () => {
  it('restores the fixed pair ahead of legacy saved positions without reordering other cards', () => {
    const result = mergeSiderOrder(['rule', 'tun', 'profile', 'sysproxy', 'proxy'])
    expect(result.slice(0, 5)).toEqual(['sysproxy', 'tun', 'rule', 'profile', 'proxy'])
    expect(new Set(result)).toEqual(new Set(SIDER_CARD_KEYS))
  })

  it('keeps one fixed pair when saved order omits it or contains duplicate and unknown entries', () => {
    const result = mergeSiderOrder(['proxy', 'proxy', 'unknown', 'tun', 'tun'])
    expect(result.slice(0, 3)).toEqual(['sysproxy', 'tun', 'proxy'])
    expect(result).toHaveLength(SIDER_CARD_KEYS.length)
  })

  it('keeps the default order for a new configuration', () => {
    expect(mergeSiderOrder()).toEqual(SIDER_CARD_KEYS)
  })
})
