import { Rank } from '@prisma/client'
import { progressToNextRank, RANK_THRESHOLDS } from '@/lib/exp'
import { RankBadge } from './RankBadge'

const RANK_BAR_COLOR: Record<Rank, string> = {
  BRONZE: 'from-rank-bronze to-yellow-600',
  SILVER: 'from-rank-silver to-slate-400',
  GOLD: 'from-rank-gold to-yellow-400',
  PLATINUM: 'from-rank-platinum to-blue-300',
  DIAMOND: 'from-rank-diamond to-sky-400',
}

interface ExpProgressProps {
  expPoints: number
  currentRank: Rank
}

export function ExpProgress({ expPoints, currentRank }: ExpProgressProps) {
  const { next, pct } = progressToNextRank(expPoints)
  const barColor = RANK_BAR_COLOR[currentRank]

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <RankBadge rank={currentRank} />
        {next ? (
          <span className="text-gray-500">{expPoints.toLocaleString()} / {RANK_THRESHOLDS[next].toLocaleString()} XP</span>
        ) : (
          <span className="text-gray-500">{expPoints.toLocaleString()} XP · Max rank</span>
        )}
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-gray-800">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
