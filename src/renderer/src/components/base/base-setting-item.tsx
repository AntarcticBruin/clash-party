import { Divider } from '@renderer/components/ui'
import React from 'react'

interface Props {
  title: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
  divider?: boolean
}

const SettingItem: React.FC<Props> = (props) => {
  const { title, actions, children, divider = false } = props

  return (
    <>
      <div className="setting-item select-text min-h-10 w-full flex items-center justify-between gap-3">
        <div className="setting-item-label min-w-0 flex items-center gap-1.5">
          <h4 className="text-[14px] leading-5 font-medium">{title}</h4>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
        {children}
      </div>
      {divider && <Divider className="setting-divider my-1" />}
    </>
  )
}

export default SettingItem
