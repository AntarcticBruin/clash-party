import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createWindowHider, getCaptionRepaintDelay } from './window-hide'

function createWindow(initialOpacity = 1) {
  let visible = true
  let closable = true
  let destroyed = false
  let opacity = initialOpacity
  return {
    hide: vi.fn(() => {
      visible = false
    }),
    show: () => {
      visible = true
    },
    isVisible: () => visible,
    isClosable: () => closable,
    isDestroyed: () => destroyed,
    getOpacity: () => opacity,
    setOpacity: vi.fn((value: number) => {
      opacity = value
    }),
    setClosable: vi.fn((value: boolean) => {
      closable = value
    }),
    destroy: () => {
      destroyed = true
    }
  }
}

describe('closing a window to the tray', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('conceals the window before resetting the close button, then hides and restores opacity', async () => {
    const window = createWindow()
    const hider = createWindowHider(window, true)
    const hidden = hider.hide()
    expect(window.isVisible()).toBe(true)
    expect(window.getOpacity()).toBe(0)
    expect(window.isClosable()).toBe(false)
    expect(window.setOpacity.mock.invocationCallOrder[0]).toBeLessThan(
      window.setClosable.mock.invocationCallOrder[0]
    )
    await vi.advanceTimersByTimeAsync(33)
    expect(window.isVisible()).toBe(true)
    expect(window.getOpacity()).toBe(0)
    await vi.advanceTimersByTimeAsync(1)
    expect(await hidden).toBe(true)
    expect(window.isVisible()).toBe(false)
    expect(window.isClosable()).toBe(true)
    expect(window.getOpacity()).toBe(1)
    expect(window.hide.mock.invocationCallOrder[0]).toBeLessThan(
      window.setOpacity.mock.invocationCallOrder[1]
    )
  })

  it('keeps a window open when it is requested again before the hide finishes', async () => {
    const window = createWindow()
    const hider = createWindowHider(window, true)
    const hidden = hider.hide()
    await vi.advanceTimersByTimeAsync(2)
    hider.cancel()
    expect(await hidden).toBe(false)
    await vi.advanceTimersByTimeAsync(200)
    expect(window.hide).not.toHaveBeenCalled()
    expect(window.isVisible()).toBe(true)
    expect(window.isClosable()).toBe(true)
    expect(window.getOpacity()).toBe(1)
  })

  it('does not accumulate delayed hides after repeated close requests', async () => {
    const window = createWindow()
    const hider = createWindowHider(window, true)
    const hidden = hider.hide()
    expect(await hider.hide()).toBe(false)
    await vi.advanceTimersByTimeAsync(34)
    expect(await hidden).toBe(true)
    expect(window.hide).toHaveBeenCalledTimes(1)
  })

  it('does not call native methods after the window is destroyed', async () => {
    const window = createWindow()
    const hider = createWindowHider(window, true)
    const hidden = hider.hide()
    window.destroy()
    hider.cancel()
    expect(await hidden).toBe(false)
    await vi.advanceTimersByTimeAsync(200)
    expect(window.hide).not.toHaveBeenCalled()
    expect(window.setClosable).toHaveBeenCalledTimes(1)
    expect(window.setOpacity).toHaveBeenCalledTimes(1)
  })

  it('hides other title bars immediately without changing their controls', async () => {
    const window = createWindow()
    expect(await createWindowHider(window, false).hide()).toBe(true)
    expect(window.isVisible()).toBe(false)
    expect(window.setClosable).not.toHaveBeenCalled()
    expect(window.setOpacity).not.toHaveBeenCalled()
  })

  it('preserves an intentionally disabled close button', async () => {
    const window = createWindow()
    window.setClosable(false)
    window.setClosable.mockClear()
    expect(await createWindowHider(window, true).hide()).toBe(true)
    expect(window.isClosable()).toBe(false)
    expect(window.setClosable).not.toHaveBeenCalled()
    expect(window.setOpacity).not.toHaveBeenCalled()
  })

  it('preserves the original opacity when hiding and reopening', async () => {
    const window = createWindow(0.6)
    const hider = createWindowHider(window, true)
    const hidden = hider.hide()
    await vi.advanceTimersByTimeAsync(34)
    expect(await hidden).toBe(true)
    expect(window.getOpacity()).toBe(0.6)
  })

  it('restores opacity if resetting the native button fails', async () => {
    const window = createWindow()
    window.setClosable.mockImplementationOnce(() => {
      throw new Error('native button reset failed')
    })
    const hider = createWindowHider(window, true)
    await expect(hider.hide()).rejects.toThrow('native button reset failed')
    expect(window.getOpacity()).toBe(1)
    expect(window.isClosable()).toBe(true)
    expect(window.hide).not.toHaveBeenCalled()
    expect(hider.isPending()).toBe(false)
  })

  it('keeps the native window paintable beyond the old 5ms deadline', async () => {
    const window = createWindow()
    const hider = createWindowHider(window, true, () => 60)
    const hidden = hider.hide()
    await vi.advanceTimersByTimeAsync(5)
    expect(window.hide).not.toHaveBeenCalled()
    expect(window.getOpacity()).toBe(0)
    expect(window.isClosable()).toBe(false)
    // Reopening must still cancel a hide during the longer repaint interval.
    hider.cancel()
    expect(await hidden).toBe(false)
    await vi.advanceTimersByTimeAsync(100)
    expect(window.hide).not.toHaveBeenCalled()
    expect(window.getOpacity()).toBe(1)
    expect(window.isClosable()).toBe(true)
  })

  it('uses the current display on each close after moving the window', async () => {
    const window = createWindow()
    let frequency = 75
    const hider = createWindowHider(window, true, () => frequency)
    const firstHide = hider.hide()
    await vi.advanceTimersByTimeAsync(26)
    expect(window.hide).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(await firstHide).toBe(true)

    window.show()
    frequency = 60
    const secondHide = hider.hide()
    await vi.advanceTimersByTimeAsync(27)
    expect(window.hide).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(7)
    expect(await secondHide).toBe(true)
    expect(window.hide).toHaveBeenCalledTimes(2)
    expect(window.getOpacity()).toBe(1)
  })
})

describe('native caption repaint budget', () => {
  it.each([
    [60, 34],
    [75, 27],
    [120, 17],
    [144, 14],
    [240, 9],
    [0, 34],
    [Number.NaN, 34],
    [Number.POSITIVE_INFINITY, 34],
    [-1, 34],
    [1, 67],
    [1000, 5]
  ])('allows repaint time at %s Hz without an unbounded delay', (frequency, delay) => {
    expect(getCaptionRepaintDelay(frequency)).toBe(delay)
  })
})
