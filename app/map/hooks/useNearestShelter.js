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

export const useNearestShelter = (currentLocation, prefCode) => {
  const [nearestShelter, setNearestShelter] = useState(null)
  const [allShelters, setAllShelters] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 後方互換対応：prefCode がない場合は共通テーブル「shelters」を使用
  const resolveTableName = (code) => {
    if (!code || String(code).trim() === '') return 'shelters'
    const padded = String(code).padStart(2, '0')
    return `shelters_pref${padded}`
  }

  // 避難所データを取得
  const fetchShelters = async () => {
    const tableName = resolveTableName(prefCode)

    try {
      setLoading(true)
      setError(null)

      const { data: shelters, error: supabaseError } = await supabase
        .from(tableName)
        .select('*')

      if (supabaseError) {
        // フォールバック: 指定テーブルが無ければ共通テーブルを試す
        if (tableName !== 'shelters') {
          const { data: fallbackData, error: fallbackErr } = await supabase
            .from('shelters')
            .select('*')
            .eq('pref_code', String(prefCode).padStart(2, '0'))
          if (!fallbackErr) {
            setAllShelters(fallbackData || [])
            return fallbackData || []
          }
        }
        throw supabaseError
      }

      setAllShelters(shelters || [])
      return shelters || []
    } catch (err) {
      console.error('避難所データの取得に失敗:', err)
      setError(err.message || String(err))
      return []
    } finally {
      setLoading(false)
    }
  }

  // 最寄り避難所を計算
  const findNearestShelter = (location, shelters) => {
    if (!location || !shelters || shelters.length === 0) return null

    const sheltersWithDistance = shelters.map((shelter) => {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        shelter.latitude,
        shelter.longitude
      )

      return {
        ...shelter,
        distance: distance / 1000, // km
        walkingTime: Math.round((distance / 1000) * 12), // 徒歩時間（分）
      }
    })

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
        const distance = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          shelter.latitude,
          shelter.longitude
        )

        return {
          ...shelter,
          distance: distance / 1000,
          walkingTime: Math.round((distance / 1000) * 12),
        }
      })
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
