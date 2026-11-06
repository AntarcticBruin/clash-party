import React, { useState } from 'react'
import { Accordion, AccordionItem, Card, CardBody } from '@renderer/components/ui'
import { IoIosArrowBack } from 'react-icons/io'

interface Props {
  title?: string
  children?: React.ReactNode
  className?: string
}

const SettingCard: React.FC<Props> = (props) => {
  const [isOpen, setIsOpen] = useState(false)

  return !props.title ? (
    <Card className={`setting-card ${props.className ?? ''} m-2`}>
      <CardBody className="px-3 py-2">{props.children}</CardBody>
    </Card>
  ) : (
    <Accordion
      isCompact
      className={`setting-accordion ${props.className ?? ''} my-2 px-2`}
      variant="splitted"
      onSelectionChange={(keys) => {
        setIsOpen(keys instanceof Set ? keys.size > 0 : false)
      }}
    >
      <AccordionItem
        className="app-card setting-card data-[open=true]:pb-2"
        classNames={{
          trigger: 'py-2 min-h-11',
          title: 'text-sm font-semibold',
          content: 'pt-0 pb-1 text-sm'
        }}
        hideIndicator
        keepContentMounted
        textValue={props.title}
        title={
          <div className="flex justify-between items-center w-full">
            <span>{props.title}</span>
            <IoIosArrowBack
              className={`transition duration-200 ml-2 h-8 text-lg text-foreground-500 ${isOpen ? '-rotate-90' : ''}`}
            />
          </div>
        }
      >
        {props.children}
      </AccordionItem>
    </Accordion>
  )
}

export default SettingCard
