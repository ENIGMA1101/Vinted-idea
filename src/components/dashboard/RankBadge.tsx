import { Rank } from '@prisma/client'
import { clsx } from 'clsx'

const RANK_CONFIG: Record<Rank, { label: string; color: string }> = {
  BRONZE: { label: 'Bronze', color: 'text-rank-bronze' },
  SILVER: { label: 'Silver', color: 'text-rank-silver' },
  GOLD: { label: 'Gold', color: 'text-rank-gold' },
  PLATINUM: { label: 'Platinum', color: 'text-rank-platinum' },
  DIAMOND: { label: 'Diamond', color: 'text-rank-diamond' },
}

interface RankBadgeProps {
  rank: Rank
  showLabel?: boolean
  className?: string
}

export function RankBadge({ rank, showLabel = true, className }: RankBadgeProps) {
  const { label, color } = RANK_CONFIG[rank]
  return (
    <span className={clsx('inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider', color, className)}>
      <span>◆</span>
      {showLabel && <span>{label}</span>}
    </span>
  )
}
