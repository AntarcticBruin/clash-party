import { useLayoutEffect, useEffect, useState } from 'react'
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import { useNavigate } from 'react-router-dom'
import SysproxySwitcher from '@renderer/components/sider/sysproxy-switcher'
import TunSwitcher from '@renderer/components/sider/tun-switcher'
import ProfileCard from '@renderer/components/sider/profile-card'
import ProxyCard from '@renderer/components/sider/proxy-card'
import RuleCard from '@renderer/components/sider/rule-card'
import DNSCard from '@renderer/components/sider/dns-card'
import SniffCard from '@renderer/components/sider/sniff-card'
import OverrideCard from '@renderer/components/sider/override-card'
import ConnCard from '@renderer/components/sider/conn-card'
import LogCard from '@renderer/components/sider/log-card'
import MihomoCoreCard from '@renderer/components/sider/mihomo-core-card'
import ResourceCard from '@renderer/components/sider/resource-card'
import SubStoreCard from '@renderer/components/sider/substore-card'
import NetworkCard from '@renderer/components/sider/network-card'
import UsageCard from '@renderer/components/sider/usage-card'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { mergeSiderOrder, SIDER_CARD_ROUTES, FIXED_SIDER_CARD_KEYS } from '@renderer/utils/sider'
import { markInitialContentPartReady } from '@renderer/utils/startup'
import { DEFAULT_SIDER_ORDER } from '../../../../shared/appConfig'

const componentMap: Record<SiderCardKey, React.FC<{ iconOnly?: boolean; expanded?: boolean }>> = {
  sysproxy: SysproxySwitcher,
  tun: TunSwitcher,
  profile: ProfileCard,
  proxy: ProxyCard,
  mihomo: MihomoCoreCard,
  connection: ConnCard,
  dns: DNSCard,
  sniff: SniffCard,
  log: LogCard,
  rule: RuleCard,
  resource: ResourceCard,
  override: OverrideCard,
  substore: SubStoreCard,
  network: NetworkCard,
  usage: UsageCard
}

interface Props {
  iconOnly?: boolean
  expanded?: boolean
}

const SiderCards = (props: Props): React.JSX.Element => {
  const { iconOnly = false, expanded = false } = props
  const { appConfig, patchAppConfig } = useAppConfig()
  const siderOrder = appConfig?.siderOrder ?? DEFAULT_SIDER_ORDER
  const lockSiderCards = appConfig?.lockSiderCards ?? false
  const [order, setOrder] = useState<SiderCardKey[]>(mergeSiderOrder(siderOrder))
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const navigate = useNavigate()

  useLayoutEffect(() => {
    markInitialContentPartReady('sider')
  }, [])

  useEffect(() => {
    setOrder(mergeSiderOrder(siderOrder))
  }, [siderOrder])

  const onDragEnd = async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event
    if (lockSiderCards || !over || active.id === over.id) return
    const activeId = active.id as SiderCardKey
    const from = order.indexOf(activeId)
    const to = order.indexOf(over.id as SiderCardKey)
    if (from < 0 || to < 0 || FIXED_SIDER_CARD_KEYS.includes(activeId)) return
    const newOrder = order.slice()
    newOrder.splice(from, 1)
    newOrder.splice(to, 0, activeId)
    setOrder(newOrder)
    await patchAppConfig({ siderOrder: newOrder })
  }

  const draggableOrder = order.filter((key) => !FIXED_SIDER_CARD_KEYS.includes(key))
  const cards = draggableOrder.map((key) => {
    const Component = componentMap[key]
    if (iconOnly) return <Component key={key} iconOnly expanded={expanded} />
    return (
      <div
        key={key}
        className="contents"
        onClick={(event) => {
          const target = event.target
          if (!(target instanceof Element) || !event.currentTarget.contains(target)) return
          const surface = target.closest('.sider-surface')
          const control = target.closest(
            'button, a, label, input, select, textarea, [role="switch"]'
          )
          if (surface && (!control || control === surface)) navigate(SIDER_CARD_ROUTES[key])
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return
          const target = event.target
          if (target instanceof HTMLElement && target.matches('.sider-surface')) {
            event.preventDefault()
            if (!event.repeat) target.click()
          }
        }}
      >
        <Component />
      </div>
    )
  })

  if (iconOnly) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
        <div className="min-h-full w-full flex flex-col gap-2">
          <SysproxySwitcher iconOnly expanded={expanded} />
          <TunSwitcher iconOnly expanded={expanded} />
          {cards}
        </div>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'clip' }} className="flex flex-col gap-2 p-2">
      <div className="sider-switch-group">
        <SysproxySwitcher />
        <TunSwitcher />
      </div>
      <DndContext
        sensors={lockSiderCards ? [] : sensors}
        collisionDetection={closestCorners}
        onDragEnd={onDragEnd}
      >
        <div className="sider-card-grid grid grid-cols-2 gap-2">
          <SortableContext items={draggableOrder}>{cards}</SortableContext>
        </div>
      </DndContext>
    </div>
  )
}

export default SiderCards
