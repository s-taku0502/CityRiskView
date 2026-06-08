import type { Facility } from '@/types/facility'

interface OccupancyBadgeProps {
  current: number
  capacity: number | null
}

/**
 * 収容率に応じた色のバッジを表示する。
 * capacity が null の場合は人数のみ表示する。
 */
export default function OccupancyBadge({ current, capacity }: OccupancyBadgeProps) {
  if (capacity == null) {
    return (
      <span className="inline-block px-2 py-0.5 rounded text-sm bg-gray-100 text-gray-700">
        {current} 人
      </span>
    )
  }

  const rate = capacity > 0 ? current / capacity : 0
  const percent = Math.round(rate * 100)

  let colorClass = 'bg-green-100 text-green-800'
  if (rate >= 1) {
    colorClass = 'bg-red-100 text-red-800'
  } else if (rate >= 0.8) {
    colorClass = 'bg-orange-100 text-orange-800'
  } else if (rate >= 0.5) {
    colorClass = 'bg-yellow-100 text-yellow-800'
  }

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-sm font-medium ${colorClass}`}>
      {current} / {capacity} 人（{percent}%）
    </span>
  )
}
