import { Rank } from '@prisma/client'

export const RANK_THRESHOLDS: Record<Rank, number> = {
  BRONZE: 0,
  SILVER: 1_000,
  GOLD: 5_000,
  PLATINUM: 20_000,
  DIAMOND: 100_000,
}

export const RANK_ORDER: Rank[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']

export function computeRank(expPoints: number): Rank {
  let rank: Rank = 'BRONZE'
  for (const r of RANK_ORDER) {
    if (expPoints >= RANK_THRESHOLDS[r]) rank = r
  }
  return rank
}

export function expForOrder(orderTotal: number): number {
  return 100 + Math.floor(orderTotal * 0.1)
}

export function progressToNextRank(expPoints: number): { current: Rank; next: Rank | null; pct: number } {
  const current = computeRank(expPoints)
  const currentIdx = RANK_ORDER.indexOf(current)
  const next = currentIdx < RANK_ORDER.length - 1 ? RANK_ORDER[currentIdx + 1] : null

  if (!next) return { current, next: null, pct: 100 }

  const floor = RANK_THRESHOLDS[current]
  const ceiling = RANK_THRESHOLDS[next]
  const pct = Math.min(100, Math.round(((expPoints - floor) / (ceiling - floor)) * 100))
  return { current, next, pct }
}
