import { toast } from '@renderer/components/base/toast'
import BorderSwitch from '@renderer/components/base/border-switch'
import { useLocation } from 'react-router-dom'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { triggerSysProxy, updateTrayIconImmediate } from '@renderer/utils/ipc'
import { useControledMihomoConfig } from '@renderer/hooks/use-controled-mihomo-config'
import { AiOutlineGlobal } from 'react-icons/ai'
import React from 'react'
import { useTranslation } from 'react-i18next'
import SiderItem from './sider-item'
import FixedSwitchRow from './fixed-switch-row'

interface Props {
  iconOnly?: boolean
  expanded?: boolean
}

const SysproxySwitcher: React.FC<Props> = (props) => {
  const { t } = useTranslation()
  const { iconOnly, expanded } = props
  const location = useLocation()
  const match = location.pathname.includes('/sysproxy')
  const { appConfig, patchAppConfig } = useAppConfig()
  const { controledMihomoConfig } = useControledMihomoConfig()
  const { sysProxy } = appConfig || {}
  const { tun } = controledMihomoConfig || {}
  const { enable } = sysProxy || {}
  const onChange = async (enable: boolean): Promise<void> => {
    const previousState = !enable
    const tunEnabled = tun?.enable ?? false

    // 立即更新图标
    updateTrayIconImmediate(enable, tunEnabled)

    try {
      await patchAppConfig({ sysProxy: { enable } })
      await triggerSysProxy(enable)

      window.electron.ipcRenderer.send('updateFloatingWindow')
      window.electron.ipcRenderer.send('updateTrayMenu')
    } catch (e) {
      await patchAppConfig({ sysProxy: { enable: previousState } })
      // 回滚图标
      updateTrayIconImmediate(previousState, tunEnabled)
      toast.error(String(e))
    }
  }

  if (iconOnly) {
    return (
      <SiderItem
        title={t('sider.cards.systemProxy')}
        route="/sysproxy"
        icon={<AiOutlineGlobal className="text-[20px]" />}
        expanded={expanded}
      >
        <BorderSwitch
          aria-label={t('sider.cards.systemProxy')}
          isShowBorder={match && enable}
          isSelected={enable ?? false}
          onValueChange={onChange}
        />
      </SiderItem>
    )
  }

  return (
    <FixedSwitchRow
      title={t('sider.cards.systemProxy')}
      route="/sysproxy"
      icon={<AiOutlineGlobal />}
      active={match}
      className="sysproxy-card"
    >
      <BorderSwitch
        aria-label={t('sider.cards.systemProxy')}
        isSelected={enable ?? false}
        onValueChange={onChange}
      />
    </FixedSwitchRow>
  )
}

export default SysproxySwitcher
