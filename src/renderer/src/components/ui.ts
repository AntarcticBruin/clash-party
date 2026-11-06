// Shared desktop styling for pages and dialogs. Keep HeroUI behavior and public props.
import {
  Card as HeroCard,
  Input as HeroInput,
  Textarea as HeroTextarea,
  Select as HeroSelect,
  Button as HeroButton,
  Tabs as HeroTabs,
  Modal as HeroModal,
  Popover as HeroPopover,
  Dropdown as HeroDropdown,
  extendVariants
} from '@heroui/react'

export * from '@heroui/react'

export const Card = extendVariants(HeroCard, {
  variants: { desktop: { true: { base: 'app-card' } } },
  defaultVariants: { desktop: true, shadow: 'none' }
}) as typeof HeroCard

export const Input = extendVariants(HeroInput, {
  variants: {
    desktop: { true: { inputWrapper: 'app-control', input: 'text-[13px]', label: 'text-[13px]' } }
  },
  defaultVariants: { desktop: true }
}) as typeof HeroInput

export const Textarea = extendVariants(HeroTextarea, {
  variants: {
    desktop: { true: { inputWrapper: 'app-control', input: 'text-[13px]', label: 'text-[13px]' } }
  },
  defaultVariants: { desktop: true }
}) as typeof HeroTextarea

export const Select = extendVariants(HeroSelect, {
  variants: {
    desktop: {
      true: {
        trigger: 'app-control',
        value: 'text-[13px]',
        label: 'text-[13px]',
        popoverContent: 'app-popover'
      }
    }
  },
  defaultVariants: { desktop: true }
}) as typeof HeroSelect

export const Button = extendVariants(HeroButton, {
  variants: { desktop: { true: 'app-button' } },
  defaultVariants: { desktop: true }
}) as typeof HeroButton

export const Tabs = extendVariants(HeroTabs, {
  variants: {
    desktop: { true: { tabList: 'app-tabs', tab: 'text-[13px]', cursor: 'shadow-none' } }
  },
  defaultVariants: { desktop: true }
}) as typeof HeroTabs

export const Modal = extendVariants(HeroModal, {
  variants: {
    desktop: {
      true: {
        base: 'app-dialog',
        header: 'app-dialog-header',
        body: 'text-[13px]',
        footer: 'app-dialog-footer'
      }
    }
  },
  defaultVariants: { desktop: true }
}) as typeof HeroModal

export const Popover = extendVariants(HeroPopover, {
  variants: { desktop: { true: { content: 'app-popover' } } },
  defaultVariants: { desktop: true }
}) as typeof HeroPopover

export const Dropdown = extendVariants(HeroDropdown, {
  variants: { desktop: { true: { content: 'app-popover' } } },
  defaultVariants: { desktop: true }
}) as typeof HeroDropdown
