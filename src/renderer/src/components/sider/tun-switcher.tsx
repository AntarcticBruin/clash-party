import { useControledMihomoConfig } from '@renderer/hooks/use-controled-mihomo-config'
import BorderSwitch from '@renderer/components/base/border-switch'
import { TbDeviceIpadHorizontalBolt } from 'react-icons/tb'
import { useLocation } from 'react-router-dom'
import { updateTrayIconImmediate } from '@renderer/utils/ipc'
import React from 'react'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { useTranslation } from 'react-i18next'
import SiderItem from './sider-item'
import FixedSwitchRow from './fixed-switch-row'

interface Props {
  iconOnly?: boolean
  expanded?: boolean
}

const TunSwitcher: React.FC<Props> = (props) => {
  const { t } = useTranslation()
  const { iconOnly, expanded } = props
  const location = useLocation()
  const match = location.pathname.includes('/tun') || false
  const { appConfig } = useAppConfig()
  const sysProxyEnabled = appConfig?.sysProxy?.enable ?? false
  const { controledMihomoConfig, patchControledMihomoConfig } = useControledMihomoConfig()
  const { tun } = controledMihomoConfig || {}
  const { enable } = tun || {}
  const onChange = async (enable: boolean): Promise<void> => {
    updateTrayIconImmediate(sysProxyEnabled, enable)
    if (enable) {
      try {
        // 检查内核权限
        const hasPermissions = await window.electron.ipcRenderer.invoke(
          'checkMihomoCorePermissions'
        )

        if (!hasPermissions) {
          if (window.electron.process.platform === 'win32') {
            const confirmed = await window.electron.ipcRenderer.invoke('showTunPermissionDialog')
            if (confirmed) {
              try {
                const notification = new Notification(t('tun.permissions.restarting'))
                await window.electron.ipcRenderer.invoke('restartAsAdmin')
                notification.close()
                return
              } catch (error) {
                console.error('Failed to restart as admin:', error)
                await window.electron.ipcRenderer.invoke(
                  'showErrorDialog',
                  t('tun.permissions.failed'),
                  String(error)
                )
                updateTrayIconImmediate(sysProxyEnabled, false)
                return
              }
            } else {
              updateTrayIconImmediate(sysProxyEnabled, false)
              return
            }
          } else {
            // macOS/Linux下尝试自动获取权限
            try {
              await window.electron.ipcRenderer.invoke('requestTunPermissions')
            } catch (error) {
              console.warn('Permission grant failed:', error)
              await window.electron.ipcRenderer.invoke(
                'showErrorDialog',
                t('tun.permissions.failed'),
                String(error)
              )
              updateTrayIconImmediate(sysProxyEnabled, false)
              return
            }
          }
        }
      } catch (error) {
        console.warn('Permission check failed:', error)
      }

      await patchControledMihomoConfig({ tun: { enable }, dns: { enable: true } })
      if (enable) {
        const autoRunEnabled = await window.electron.ipcRenderer.invoke('checkAutoRun')
        if (autoRunEnabled) {
          await window.electron.ipcRenderer.invoke('enableAutoRun')
        }
      }
    } else {
      await patchControledMihomoConfig({ tun: { enable } })
    }
    window.electron.ipcRenderer.send('updateFloatingWindow')
    window.electron.ipcRenderer.send('updateTrayMenu')
  }

  if (iconOnly) {
    return (
      <SiderItem
        title={t('sider.cards.tun')}
        route="/tun"
        icon={<TbDeviceIpadHorizontalBolt className="text-[20px]" />}
        expanded={expanded}
      >
        <BorderSwitch
          aria-label={t('sider.cards.tun')}
          isShowBorder={match && enable}
          isSelected={enable ?? false}
          onValueChange={onChange}
        />
      </SiderItem>
    )
  }

  return (
    <FixedSwitchRow
      title={t('sider.cards.tun')}
      route="/tun"
      icon={<TbDeviceIpadHorizontalBolt />}
      active={match}
      className="tun-card"
    >
      <BorderSwitch
        aria-label={t('sider.cards.tun')}
        isSelected={enable ?? false}
        onValueChange={onChange}
      />
    </FixedSwitchRow>
  )
}

export default TunSwitcher
