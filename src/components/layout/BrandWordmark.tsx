import { appName } from '../../data/constants'
import { cn } from '../../utils/cn'

/**
 * The mark: a soft-cornered tile holding three ascending bars — a ledger
 * read left to right. Currency-agnostic, legible down to 20px.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-grid size-9 shrink-0 place-items-center rounded-[.7rem] bg-primary text-primary-foreground shadow-[0_6px_16px_-8px_var(--primary)]',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-[55%]" role="presentation">
        <rect x="3" y="14" width="4.4" height="7" rx="2.2" fill="currentColor" opacity=".55" />
        <rect x="9.8" y="9" width="4.4" height="12" rx="2.2" fill="currentColor" opacity=".8" />
        <rect x="16.6" y="3" width="4.4" height="18" rx="2.2" fill="currentColor" />
      </svg>
    </span>
  )
}

export function BrandWordmark({ animated = false, className }: { animated?: boolean; className?: string }) {
  return (
    <span className={cn('inline-block font-sans font-extrabold tracking-[-.05em]', animated && 'brand-throb', className)}>
      {appName}
    </span>
  )
}

/** Mark plus wordmark, the lockup used in the sidebar, nav and footer. */
export function BrandLockup({ className, markClassName, wordmarkClassName }: { className?: string; markClassName?: string; wordmarkClassName?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <BrandMark className={markClassName} />
      <BrandWordmark className={cn('text-xl', wordmarkClassName)} />
    </span>
  )
}
