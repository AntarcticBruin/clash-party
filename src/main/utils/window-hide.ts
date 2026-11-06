import type { BrowserWindow } from 'electron'

type HideableWindow = Pick<
  BrowserWindow,
  'hide' | 'isVisible' | 'isDestroyed' | 'isClosable' | 'setClosable' | 'getOpacity' | 'setOpacity'
>

// 先透明遮住窗口，再给清除 hover 后的原生控件留出重绘时间。
const captionRepaintDelay = 5

export function createWindowHider(window: HideableWindow, resetCaptionHover: boolean) {
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
