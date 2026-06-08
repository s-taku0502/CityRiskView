'use client'

import OccupancyBadge from './OccupancyBadge'
import type { Facility, FacilityStatus, FacilityType } from '@/types/facility'

const FACILITY_TYPE_LABEL: Record<FacilityType, string> = {
  evacuation_site: '指定緊急避難場所',
  evacuation_shelter: '指定避難所',
  welfare_shelter: '福祉避難所',
  temporary_shelter: '臨時避難所',
}

/** amenities キーの日本語ラベル（GeoJSON 由来の対応災害種別を含む） */
const AMENITY_LABEL: Record<string, string> = {
  flood: '洪水',
  tsunami: '津波',
  volcano: '火山',
  landslide: '土砂災害',
  earthquake: '地震・津波',
  large_fire: '大規模火事',
  storm_surge: '高潮',
  inland_flood: '内水汎濫',
  wifi: 'Wi-Fi',
  barrier_free: 'バリアフリー',
  pet_allowed: 'ペット可',
  generator: '発電機',
  shower: 'シャワー',
  toilet: 'トイレ',
  parking: '駐車場',
  medical: '医療設備',
  food: '食料備蓄',
  water: '飲料水備蓄',
}

const STATUS_LABEL: Record<FacilityStatus, string> = {
  open: '開設中',
  closed: '閉鎖',
  full: '満員',
  damaged: '被災',
  unknown: '不明',
}

const STATUS_COLOR: Record<FacilityStatus, string> = {
  open: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-700',
  full: 'bg-red-100 text-red-800',
  damaged: 'bg-orange-100 text-orange-800',
  unknown: 'bg-neutral-100 text-neutral-600',
}

interface FacilityDetailProps {
  facility: Facility
  onClose: () => void
}

export default function FacilityDetail({ facility, onClose }: FacilityDetailProps) {
  return (
    <aside className="absolute top-0 right-0 h-full w-80 bg-white shadow-xl flex flex-col z-10 overflow-y-auto">
      {/* ヘッダー */}
      <div className="flex items-start justify-between px-5 py-4 border-b sticky top-0 bg-white">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-gray-900 truncate">{facility.name}</h2>
          <span
            className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[facility.status]}`}
          >
            {STATUS_LABEL[facility.status]}
          </span>
        </div>
        <button
          onClick={onClose}
          className="ml-3 mt-0.5 text-gray-400 hover:text-gray-600 text-xl leading-none"
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 px-5 py-4 space-y-5">

        {/* 混雑状況 */}
        <section>
          <SectionTitle>混雑状況</SectionTitle>
          <div className="mt-2">
            <OccupancyBadge
              current={facility.current_occupancy}
              capacity={facility.capacity}
            />
          </div>
          <div className="mt-2 space-y-1">
            <Row
              label="更新方式"
              value={facility.occupancy_source === 'auto' ? '自動（センサー）' : '手動（DMD）'}
            />
            {facility.last_updated_by_dmd && (
              <Row
                label="最終 DMD 更新"
                value={new Date(facility.last_updated_by_dmd).toLocaleString('ja-JP')}
              />
            )}
          </div>
        </section>

        {/* 基本情報 */}
        <section>
          <SectionTitle>基本情報</SectionTitle>
          <div className="mt-2 space-y-1">
            <Row
              label="種別"
              value={FACILITY_TYPE_LABEL[facility.type] ?? facility.type}
            />
            <Row label="住所" value={facility.address} />
            <Row label="市区町村" value={facility.municipality} />
            {facility.contact_phone && (
              <Row label="電話" value={facility.contact_phone} />
            )}
            {facility.contact_email && (
              <Row label="メール" value={facility.contact_email} />
            )}
          </div>
        </section>

        {/* 設備 */}
        {facility.amenities && Object.keys(facility.amenities).length > 0 && (
          <section>
            <SectionTitle>設備・対応災害</SectionTitle>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(facility.amenities).map(([key, available]) => (
                <span
                  key={key}
                  className={`px-2 py-0.5 rounded text-xs ${
                    available
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-gray-100 text-gray-400 line-through'
                  }`}
                >
                  {AMENITY_LABEL[key] ?? key}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 備考 */}
        {facility.notes && (
          <section>
            <SectionTitle>備考</SectionTitle>
            <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{facility.notes}</p>
          </section>
        )}
      </div>

      {/* フッター */}
      <div className="px-5 py-3 border-t text-xs text-gray-400">
        最終更新: {new Date(facility.updated_at).toLocaleString('ja-JP')}
      </div>
    </aside>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{children}</h3>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-24 shrink-0 text-gray-500">{label}</span>
      <span className="text-gray-900 break-all">{value}</span>
    </div>
  )
}
