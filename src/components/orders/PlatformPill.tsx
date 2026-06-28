import { Platform } from '@prisma/client'

const PLATFORM_CONFIG: Record<Platform, { label: string }> = {
  EBAY: { label: 'eBay' },
}

export function PlatformPill({ platform }: { platform: Platform }) {
  const { label } = PLATFORM_CONFIG[platform]
  return (
    <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-light ring-1 ring-accent/20">
      {label}
    </span>
  )
}
