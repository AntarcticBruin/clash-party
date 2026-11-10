import type { BrowserWindow } from 'electron'

type HideableWindow = Pick<
  BrowserWindow,
  'hide' | 'isVisible' | 'isDestroyed' | 'isClosable' | 'setClosable' | 'getOpacity' | 'setOpacity'
>

// WCO 的按钮状态改变只会安排重绘，5ms 不足以覆盖常见屏幕的一帧。
// 留出两帧的调度余量（60Hz 为 34ms），仍先透明，避免用户看到 hover 淡出。
// 这是重绘预算，不是 compositor 的完成信号；异常刷新率不应长时间阻塞关窗。
export function getCaptionRepaintDelay(displayFrequency: number): number {
  const frequency =
    Number.isFinite(displayFrequency) && displayFrequency > 0 ? displayFrequency : 60
  return Math.min(67, Math.max(5, Math.ceil(2000 / frequency)))
}

export function createWindowHider(
  window: HideableWindow,
  resetCaptionHover: boolean,
  getDisplayFrequency: () => number = () => 60
) {
  let cancelPendingHide: (() => void) | undefined

  return {
    isPending(): boolean {
      return cancelPendingHide !== undefined
    },
    cancel(): void {
      cancelPendingHide?.()
    },
    async hide(): Promise<boolean> {
      if (cancelPendingHide || window.isDestroyed()) return false
      if (!resetCaptionHover || !window.isVisible() || !window.isClosable()) {
        window.hide()
        return true
      }

      const opacity = window.getOpacity()
      try {
        // hide() 会暂停标题栏重绘；透明时仍保持窗口可绘制，但用户看不到状态重置。
        window.setOpacity(0)
        // Disabled 会立即清空 WCO 的 hover 动画，normal 状态仍会播放淡出。
        window.setClosable(false)
        // 每次关闭时读取所在屏幕，兼容窗口跨不同刷新率的显示器移动。
        const captionRepaintDelay = getCaptionRepaintDelay(getDisplayFrequency())
        const shouldHide = await new Promise<boolean>((resolve) => {
          const timer = setTimeout(() => resolve(true), captionRepaintDelay)
          cancelPendingHide = (): void => {
            clearTimeout(timer)
            resolve(false)
          }
        })
        if (!shouldHide || window.isDestroyed()) return false
        window.hide()
        return true
      } finally {
        cancelPendingHide = undefined
        if (!window.isDestroyed()) {
          try {
            window.setClosable(true)
          } finally {
            window.setOpacity(opacity)
          }
        }
      }
    }
  }
}
