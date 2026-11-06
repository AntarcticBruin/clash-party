import { Button, Card, CardBody } from '@renderer/components/ui'
import { mihomoUnfixedProxy } from '@renderer/utils/ipc'
import React, { useMemo, useState, useCallback } from 'react'
import { FaMapPin } from 'react-icons/fa6'
import { LuCheck } from 'react-icons/lu'
import { useTranslation } from 'react-i18next'
import { KeyedMutator } from 'swr'

interface Props {
  mutateProxies: KeyedMutator<IMihomoMixedGroup[]>
  onProxyDelay: (proxy: IMihomoProxy | IMihomoGroup, url?: string) => Promise<IMihomoDelay>
  proxyDisplayMode: 'simple' | 'full'
  proxy: IMihomoProxy | IMihomoGroup
  group: IMihomoMixedGroup
  onSelect: (group: string, proxy: string) => void
  selected: boolean
  isGroupTesting?: boolean
}

function delayColor(delay: number): 'primary' | 'success' | 'warning' | 'danger' {
  if (delay === -1) return 'primary'
  if (delay === 0) return 'danger'
  if (delay < 500) return 'success'
  return 'warning'
}

const ProxyItemBase: React.FC<Props> = (props) => {
  const { t } = useTranslation()
  const {
    mutateProxies,
    proxyDisplayMode,
    group,
    proxy,
    selected,
    onSelect,
    onProxyDelay,
    isGroupTesting = false
  } = props

  const delay = useMemo(() => {
    if (proxy.history.length > 0) {
      return proxy.history[proxy.history.length - 1].delay
    }
    return -1
  }, [proxy.history])

  const [loading, setLoading] = useState(false)

  const isLoading = loading || isGroupTesting

  const delayText = useMemo(() => {
    if (delay === -1) return t('proxies.delay.test')
    if (delay === 0) return t('proxies.delay.timeout')
    return delay.toString()
  }, [delay, t])

  const onDelay = useCallback((): void => {
    setLoading(true)
    onProxyDelay(proxy, group.testUrl).finally(() => {
      mutateProxies()
      setLoading(false)
    })
  }, [proxy, group.testUrl, onProxyDelay, mutateProxies])

  const fixed = useMemo(() => group.fixed && group.fixed === proxy.name, [group.fixed, proxy.name])

  return (
    <Card
      as="div"
      onPress={() => onSelect(group.name, proxy.name)}
      isPressable
      fullWidth
      shadow="none"
      className="proxy-node-card"
      data-selected={selected}
      data-fixed={Boolean(fixed)}
      aria-label={proxy.name}
      aria-pressed={selected}
      radius="sm"
    >
      <CardBody className={proxyDisplayMode === 'full' ? 'px-2.5 py-2' : 'px-2.5 py-1.5'}>
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <div className="flag-emoji truncate text-sm font-medium leading-5" title={proxy.name}>
                {proxy.name}
              </div>
              {selected && !fixed && (
                <LuCheck className="shrink-0 text-primary text-sm" aria-hidden="true" />
              )}
            </div>
            {proxyDisplayMode === 'full' && (
              <div className="proxy-protocols flex gap-1 items-center mt-1 overflow-hidden">
                <span className="proxy-protocol">{proxy.type}</span>
                {['tfo', 'udp', 'xudp', 'mptcp', 'smux'].map(
                  (protocol) =>
                    proxy[protocol as keyof IMihomoProxy] && (
                      <span key={protocol} className="proxy-protocol uppercase">
                        {protocol}
                      </span>
                    )
                )}
              </div>
            )}
          </div>
          {fixed && (
            <Button
              isIconOnly
              title={t('proxies.unpin')}
              aria-label={t('proxies.unpin')}
              color="secondary"
              onPress={async () => {
                await mihomoUnfixedProxy(group.name)
                mutateProxies()
              }}
              variant="light"
              className="h-6 w-6 min-w-6 shrink-0 p-0"
            >
              <FaMapPin className="text-xs" />
            </Button>
          )}
          <Button
            title={t('proxies.delay.test')}
            aria-label={`${t('proxies.delay.test')} ${proxy.name}`}
            isLoading={isLoading}
            color={delayColor(delay)}
            onPress={onDelay}
            variant="light"
            className="proxy-delay h-7 min-w-10 w-auto shrink-0 gap-1 px-1.5 text-[13px] font-medium tabular-nums"
          >
            {delayText}
            {delay > 0 && <span className="text-[10px] font-normal opacity-80">ms</span>}
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

const ProxyItem = React.memo(ProxyItemBase, (prevProps, nextProps) => {
  // 必要时重新渲染
  return (
    prevProps.proxy.name === nextProps.proxy.name &&
    prevProps.proxy.history === nextProps.proxy.history &&
    prevProps.selected === nextProps.selected &&
    prevProps.proxyDisplayMode === nextProps.proxyDisplayMode &&
    prevProps.group.fixed === nextProps.group.fixed &&
    prevProps.isGroupTesting === nextProps.isGroupTesting
  )
})

ProxyItem.displayName = 'ProxyItem'

export default ProxyItem
