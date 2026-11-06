import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Chip,
  Progress,
  Tooltip
} from '@renderer/components/ui'
import { useProfileConfig } from '@renderer/hooks/use-profile-config'
import { useLocation } from 'react-router-dom'
import { calcTraffic, calcPercent } from '@renderer/utils/calc'
import { CgLoadbarDoc } from 'react-icons/cg'
import { IoMdRefresh } from 'react-icons/io'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import 'dayjs/locale/zh-cn'
import dayjs from '@renderer/utils/dayjs'
import React, { lazy, Suspense, useState } from 'react'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { TiFolder } from 'react-icons/ti'
import { useTranslation } from 'react-i18next'
import { isLocalProfile } from '../../../../shared/local-config'
import SiderItem from './sider-item'

const ConfigViewer = lazy(() => import('./config-viewer'))

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

interface Props {
  iconOnly?: boolean
  expanded?: boolean
}

const ProfileCard: React.FC<Props> = (props) => {
  const { t } = useTranslation()
  const { appConfig, patchAppConfig } = useAppConfig()
  const { iconOnly, expanded } = props
  const {
    profileCardStatus = 'col-span-2',
    profileDisplayDate = 'expire',
    disableAnimations = false
  } = appConfig || {}
  const location = useLocation()
  const match = location.pathname.includes('/profiles')
  const [updating, setUpdating] = useState(false)
  const [showRuntimeConfig, setShowRuntimeConfig] = useState(false)
  const { profileConfig, addProfileItem } = useProfileConfig()
  const { current, items } = profileConfig ?? {}
  const {
    attributes,
    listeners,
    setNodeRef,
    transform: tf,
    transition,
    isDragging
  } = useSortable({
    id: 'profile'
  })
  const transform = tf ? { x: tf.x, y: tf.y, scaleX: 1, scaleY: 1 } : null
  const info = items?.find((item) => item && item.id === current) ?? {
    id: 'default',
    type: 'local',
    name: t('sider.cards.emptyProfile')
  }

  const extra = info?.extra
  const usage = (extra?.upload ?? 0) + (extra?.download ?? 0)
  const total = extra?.total ?? 0

  if (iconOnly) {
    return (
      <SiderItem
        className={profileCardStatus}
        title={t('sider.cards.profiles')}
        route="/profiles"
        icon={<TiFolder className="text-[20px]" />}
        expanded={expanded}
      />
    )
  }

  return (
    <div
      style={{
        position: 'relative',
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 'calc(infinity)' : undefined
      }}
      className={`${profileCardStatus} profile-card`}
    >
      {showRuntimeConfig && (
        <Suspense fallback={null}>
          <ConfigViewer onClose={() => setShowRuntimeConfig(false)} />
        </Suspense>
      )}
      {profileCardStatus === 'col-span-2' ? (
        <Card
          fullWidth
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          className={`sider-surface ${match ? 'is-active' : ''} ${disableAnimations ? '' : `motion-reduce:transition-transform-background ${isDragging ? 'scale-[0.95] tap-highlight-transparent' : ''}`}`}
        >
          <CardBody className="pb-1">
            <div
              ref={setNodeRef}
              {...attributes}
              {...listeners}
              className="flex justify-between h-8"
            >
              <h3
                title={info?.name}
                className={`text-ellipsis whitespace-nowrap overflow-hidden text-md font-bold leading-8 ${match ? 'text-primary' : 'text-foreground'}`}
              >
                {info?.name}
              </h3>
              <div className="flex">
                <Button
                  isIconOnly
                  size="sm"
                  title={t('sider.cards.viewRuntimeConfig')}
                  variant="light"
                  color="default"
                  onPress={() => {
                    setShowRuntimeConfig(true)
                  }}
                >
                  <CgLoadbarDoc
                    className={`text-[20px] ${match ? 'text-primary' : 'text-foreground'}`}
                  />
                </Button>
                {info.type === 'remote' && (
                  <Tooltip placement="top" delay={1000} content={dayjs(info.updated).fromNow()}>
                    <Button
                      isIconOnly
                      size="sm"
                      disabled={updating}
                      variant="light"
                      color="default"
                      onPress={async () => {
                        setUpdating(true)
                        await addProfileItem(info)
                        setUpdating(false)
                      }}
                    >
                      <IoMdRefresh
                        className={`text-[20px] ${match ? 'text-primary' : 'text-foreground'} ${updating ? 'animate-spin' : ''}`}
                      />
                    </Button>
                  </Tooltip>
                )}
              </div>
            </div>
            {info.type === 'remote' && extra && (
              <div
                className={`mt-2 flex justify-between ${match ? 'text-primary' : 'text-foreground'} `}
              >
                <small>{`${calcTraffic(usage)} / ${calcTraffic(total)}`}</small>
                {profileDisplayDate === 'expire' ? (
                  <Button
                    size="sm"
                    variant="light"
                    className={`h-5 p-1 m-0 ${match ? 'text-primary' : 'text-foreground'}`}
                    onPress={async () => {
                      await patchAppConfig({ profileDisplayDate: 'update' })
                    }}
                  >
                    {extra.expire
                      ? new Date(extra.expire * 1000).toLocaleDateString()
                      : t('sider.cards.neverExpire')}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="light"
                    className={`h-5 p-1 m-0 ${match ? 'text-primary' : 'text-foreground'}`}
                    onPress={async () => {
                      await patchAppConfig({ profileDisplayDate: 'expire' })
                    }}
                  >
                    {dayjs(info.updated).fromNow()}
                  </Button>
                )}
              </div>
            )}
          </CardBody>
          <CardFooter className="pt-0">
            {info.type === 'remote' && !extra && (
              <div
                className={`w-full mt-2 flex justify-between ${match ? 'text-primary' : 'text-foreground'}`}
              >
                <Chip
                  size="sm"
                  variant="bordered"
                  className={`${match ? 'text-primary border-primary/30' : 'border-primary text-primary'}`}
                >
                  {t('sider.cards.remote')}
                </Chip>
                <small>{dayjs(info.updated).fromNow()}</small>
              </div>
            )}
            {isLocalProfile(info) && (
              <div
                className={`mt-2 flex justify-between ${match ? 'text-primary' : 'text-foreground'}`}
              >
                <Chip
                  size="sm"
                  variant="bordered"
                  className={`${match ? 'text-primary border-primary/30' : 'border-primary text-primary'}`}
                >
                  {t('sider.cards.local')}
                </Chip>
              </div>
            )}
            {extra && (
              <Progress
                className="w-full"
                aria-label={t('sider.cards.trafficUsage')}
                classNames={{ track: 'h-1.5 bg-default-200/70', indicator: 'bg-primary' }}
                value={calcPercent(extra?.upload, extra?.download, extra?.total)}
              />
            )}
          </CardFooter>
        </Card>
      ) : (
        <Card
          fullWidth
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          className={`sider-surface ${match ? 'is-active' : ''} ${disableAnimations ? '' : `motion-reduce:transition-transform-background ${isDragging ? 'scale-[0.95] tap-highlight-transparent' : ''}`}`}
        >
          <CardBody className="pb-1 pt-0 px-0">
            <div className="flex justify-between">
              <Button
                isIconOnly
                className="bg-transparent pointer-events-none"
                variant="flat"
                color="default"
              >
                <TiFolder
                  color="default"
                  className={`${match ? 'text-primary' : 'text-foreground'} text-[20px]`}
                />
              </Button>
            </div>
          </CardBody>
          <CardFooter className="pt-1">
            <h3
              className={`text-md font-bold sider-card-title ${match ? 'text-primary' : 'text-foreground'}`}
            >
              {t('sider.cards.profiles')}
            </h3>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

export default ProfileCard
