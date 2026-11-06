import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@renderer/components/ui'
import { useAppConfig } from '@renderer/hooks/use-app-config'

interface Props {
  title: string
  route: string
  icon: ReactNode
  active: boolean
  className: string
  children: ReactNode
}

export default function FixedSwitchRow({ title, route, icon, active, className, children }: Props) {
  const navigate = useNavigate()
  const { appConfig } = useAppConfig()

  return (
    <div className={`sider-switch-row ${className}`} data-active={active}>
      <Button
        aria-current={active ? 'page' : undefined}
        disableRipple
        disableAnimation={appConfig?.disableAnimations}
        variant="light"
        onPress={() => navigate(route)}
        className={`h-full min-w-0 flex-1 justify-start gap-2 rounded-none bg-transparent px-3 data-[hover=true]:bg-transparent data-[pressed=true]:scale-100 ${active ? 'text-primary' : 'text-foreground'}`}
      >
        <span className="flex w-6 shrink-0 justify-center text-[21px]">{icon}</span>
        <span className="truncate text-sm font-semibold">{title}</span>
      </Button>
      <div className="flex h-full shrink-0 items-center pr-2">{children}</div>
    </div>
  )
}
