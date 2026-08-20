import { BrandMark, BrandWordmark } from './BrandWordmark'

export function LaunchScreen() {
  return (
    <main className="grid min-h-screen place-content-center justify-items-center gap-5 bg-background text-foreground">
      <BrandMark className="size-14 rounded-[1.1rem] brand-throb" />
      <BrandWordmark className="text-2xl text-muted-foreground" />
    </main>
  )
}
