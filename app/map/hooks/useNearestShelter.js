'use client'
/*
  最寄りの避難所を見つけるフック。
  現在地を基に、最も近い避難所を計算する。
  Supabase から都道府県ごとの避難所データを取得し、
  距離（km）と徒歩時間（分）を算出する。
*/
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { calculateDistance } from '../utils/distance'
import { separatedPrefectures } from '../../utils/prefectures' // 追加

export const useNearestShelter = (currentLocation, prefCode) => {
  const [nearestShelter, setNearestShelter] = useState(null)
  const [allShelters, setAllShelters] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // テーブル名解決: 入力はコード(1/01/13)、都道府県名("東京都")、または英語サブドメイン("tokyo") を許容
  const resolveTableName = (input) => {
    // デフォルトは pref17（変更不要ならそのまま）
    const defaultTable = 'emergency_shelters_pref17'
    if (!input || String(input).trim() === '') return { tableName: defaultTable }

    const s = String(input).trim()
    let code = null

    // 数字のみなら県コードとみなす（1 -> 01）。範囲チェック（01〜47）
    if (/^\d+$/.test(s)) {
      const padded = String(Number(s)).padStart(2, '0')
      const n = Number(padded)
      if (n >= 1 && n <= 47) code = padded
    } else {
      // 名前または英語サブドメインでマッチ（小文字許容）
      const found = separatedPrefectures.find(
        (p) =>
          p.code === s ||
          p.name === s ||
          p.prefName === s ||
          p.prefName.toLowerCase() === s.toLowerCase()
      )
      if (found) code = found.code
    }

    // 解決できなければデフォルトにフォールバック
    if (!code) return { tableName: defaultTable }

    const prefObj = separatedPrefectures.find((p) => p.code === code)
    const prefName = prefObj ? prefObj.name : null

    // 常に emergency_shelters_pref{xx} を返す（xx は 2 桁）
    return {
      tableName: `emergency_shelters_pref${String(code).padStart(2, '0')}`,
      resolvedCode: String(code).padStart(2, '0'),
      resolvedPrefName: prefName
    }
  }

  // 座標を抽出するユーティリティ（複数フォーマットに対応）
  const extractCoords = (shelter) => {
    if (!shelter) return null

    // 1) 明示的なフィールド名
    const latCandidates = ['latitude', 'lat', 'y']
    const lngCandidates = ['longitude', 'lng', 'lon', 'x']

    for (const la of latCandidates) {
      for (const lo of lngCandidates) {
        if (shelter[la] != null && shelter[lo] != null) {
          const lat = Number(shelter[la])
          const lon = Number(shelter[lo])
          if (!Number.isNaN(lat) && !Number.isNaN(lon)) return { latitude: lat, longitude: lon }
        }
      }
    }

    // 2) location が "POINT(lon lat)" 形式の文字列
    if (typeof shelter.location === 'string') {
      const m = shelter.location.match(/POINT\(\s*([-0-9.]+)\s+([-0-9.]+)\s*\)/i)
      if (m) {
        const lon = Number(m[1])
        const lat = Number(m[2])
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) return { latitude: lat, longitude: lon }
      }
    }

    // 3) GeoJSON 形式: { type: 'Point', coordinates: [lon, lat] }
    if (shelter.location && shelter.location.type === 'Point' && Array.isArray(shelter.location.coordinates)) {
      const [lon, lat] = shelter.location.coordinates
      if (lat != null && lon != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lon))) {
        return { latitude: Number(lat), longitude: Number(lon) }
      }
    }

    // 4) geom や point オブジェクトの可能性
    if (shelter.geom && Array.isArray(shelter.geom.coordinates)) {
      const [lon, lat] = shelter.geom.coordinates
      if (lat != null && lon != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lon))) {
        return { latitude: Number(lat), longitude: Number(lon) }
      }
    }

    return null
  }

  // 避難所データを取得
  const fetchShelters = async () => {
    const { tableName, resolvedCode, resolvedPrefName } = resolveTableName(prefCode)
    console.log('[useNearestShelter] fetchShelters start', { tableName, resolvedCode, resolvedPrefName })

    try {
      setLoading(true)
      setError(null)

      const { data: shelters, error: supabaseError } = await supabase
        .from(tableName)
        .select('*')

      console.log('[useNearestShelter] raw shelters fetched', { len: shelters?.length, supabaseError })

      // フォールバック: 指定テーブルが無ければ共通テーブルを試す（pref_code を使わない）
      if (supabaseError) {
        if (tableName !== 'emergency_shelters_pref17') {
          const { data: fallbackData, error: fallbackErr } = await supabase
            .from('emergency_shelters_pref17')
            .select('*')
          if (!fallbackErr && Array.isArray(fallbackData)) {
            // 可能なら resolvedPrefName があれば pref_name で絞る（存在する場合のみ）
            const filtered = resolvedPrefName
              ? fallbackData.filter((s) => String(s.pref_name || '').trim() === resolvedPrefName)
              : fallbackData
            const withCoords = (filtered || []).map((s) => ({ ...s })).filter((s) => extractCoords(s))
            setAllShelters(withCoords || [])
            return withCoords || []
          }
        }
        throw supabaseError
      }

      // 座標を持つ避難所だけ残す（描画と距離計算に必須）
      const valid = (shelters || []).filter((s) => extractCoords(s))
      console.log('[useNearestShelter] valid with coords', { validLen: valid.length })
      setAllShelters(valid)
      return valid
    } catch (err) {
      console.error('避難所データの取得に失敗:', err)
      setError(err.message || String(err))
      return []
    } finally {
      setLoading(false)
    }
  }

  // 最寄り避難所を計算（extractCoords を利用）
  const findNearestShelter = (location, shelters) => {
    if (!location || !shelters || shelters.length === 0) return null

    const sheltersWithDistance = shelters
      .map((shelter) => {
        const coords = extractCoords(shelter)
        if (!coords) return null
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          coords.latitude,
          coords.longitude
        )
        return {
          ...shelter,
          latitude: coords.latitude,
          longitude: coords.longitude,
          distance: distance / 1000, // km
          walkingTime: Math.round((distance / 1000) * 12), // 徒歩時間（分）
        }
      })
      .filter(Boolean)

    if (sheltersWithDistance.length === 0) return null
    sheltersWithDistance.sort((a, b) => a.distance - b.distance)
    return sheltersWithDistance[0]
  }

  // 現在地が変わったら再計算
  useEffect(() => {
    if (currentLocation && allShelters.length > 0) {
      const nearest = findNearestShelter(currentLocation, allShelters)
      setNearestShelter(nearest)
    }
  }, [currentLocation, allShelters])

  // 初回・prefCode変更時に再取得
  useEffect(() => {
    fetchShelters()
  }, [prefCode])

  // 距離順リスト
  const getSheltersByDistance = () => {
    if (!currentLocation || allShelters.length === 0) return []

    return allShelters
      .map((shelter) => {
        const coords = extractCoords(shelter)
        if (!coords) return null
        const distance = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          coords.latitude,
          coords.longitude
        )

        return {
          ...shelter,
          latitude: coords.latitude,
          longitude: coords.longitude,
          distance: distance / 1000,
          walkingTime: Math.round((distance / 1000) * 12),
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance)
  }

  return {
    nearestShelter,
    allShelters: getSheltersByDistance(),
    loading,
    error,
    refreshShelters: fetchShelters,
  }
}
