'use client'

import type { ReactNode } from 'react'
import App from '@/App'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

/**
 * `App` is rendered here, from the root layout, rather than from the page.
 *
 * Every screen is served by the same `[[...view]]` route, so navigating between
 * tabs changes that segment's param — which makes Next tear down and rebuild the
 * page (and any layout inside the segment). That remount reset the verified
 * session on every click, and a single failed re-check signed the user out.
 * The root layout is the one place that survives client navigation, so the app
 * shell lives here and reads the active tab from the pathname instead.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      <App />
      {children}
      <Toaster closeButton position="bottom-right" />
    </TooltipProvider>
  )
}
