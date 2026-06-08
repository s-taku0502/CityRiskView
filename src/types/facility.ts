export type FacilityStatus = 'open' | 'closed' | 'full' | 'damaged' | 'unknown'

export type FacilityType =
  | 'evacuation_site'     // 指定緊急避難場所
  | 'evacuation_shelter'  // 指定避難所
  | 'welfare_shelter'     // 福祉避難所
  | 'temporary_shelter'   // 臨時避難所

export interface Facility {
  id: number
  name: string
  type: FacilityType
  prefecture_id: number
  municipality: string
  address: string
  // PostGIS の GEOMETRY 型は Supabase JS クライアントで GeoJSON として返される
  location: {
    type: 'Point'
    coordinates: [number, number] // [longitude, latitude]
  }
  capacity: number | null
  current_occupancy: number
  occupancy_source: 'auto' | 'manual'
  status: FacilityStatus
  contact_phone: string | null
  contact_email: string | null
  amenities: Record<string, boolean> | null
  notes: string | null
  last_updated_by_dmd: string | null
  created_at: string
  updated_at: string
}
