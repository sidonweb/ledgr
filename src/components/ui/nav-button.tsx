import type { ReactNode } from 'react'
import { Button } from './button'
import { cn } from '../../utils/cn'

/**
 * A primary-navigation item. Desktop reads as a list, mobile collapses to an
 * icon over a caption in the bottom bar — both are the stock Button underneath.
 */
export function NavButton({
  active,
  className,
  icon,
  label,
  onClick,
}: {
  active: boolean
  className?: string
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <Button
      aria-current={active ? 'page' : undefined}
      className={cn(
        'h-9 w-full justify-start gap-2.5 px-3 font-normal',
        'max-md:h-auto max-md:flex-col max-md:justify-center max-md:gap-1 max-md:px-1 max-md:py-2 max-md:text-[10px]',
        active && 'font-medium',
        className,
      )}
      onClick={onClick}
      type="button"
      variant={active ? 'secondary' : 'ghost'}
    >
      {icon}
      <span>{label}</span>
    </Button>
  )
}
