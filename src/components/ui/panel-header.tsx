import type { ReactNode } from 'react'
import { CardTitle } from './card'

export function PanelHeader({ action, title }: { action?: ReactNode; title: string }) {
  return (
    <div className="flex min-h-8 items-center justify-between gap-3">
      <CardTitle>{title}</CardTitle>
      {action && <span className="shrink-0 text-xs font-medium text-muted-foreground">{action}</span>}
    </div>
  )
}
