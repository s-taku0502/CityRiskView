'use client'

/* 最寄りの避難所をみつける。
   現在地を基に、最も近い避難所を計算するフック
   Supabaseから避難所データを取得し、距離と徒歩時間を計算する
*/
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { calculateDistance } from '../utils/distance'

export const useNearestShelter = (currentLocation) => {
    const [nearestShelter, setNearestShelter] = useState(null)
    const [allShelters, setAllShelters] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // 避難所データを取得
    const fetchShelters = async () => {
        try {
            setLoading(true)
            setError(null)

            const { data: shelters, error: supabaseError } = await supabase
                .from('shelters')
                .select('*')

            if (supabaseError) throw supabaseError

            setAllShelters(shelters || [])
            return shelters || []
        } catch (err) {
            console.error('避難所データの取得に失敗:', err)
            setError(err.message)
            return []
        } finally {
            setLoading(false)
        }
    }

    // 最寄り避難所を計算
    const findNearestShelter = (location, shelters) => {
        if (!location || !shelters || shelters.length === 0) {
            return null
        }

        // 各避難所までの距離を計算
        const sheltersWithDistance = shelters.map(shelter => {
            const distance = calculateDistance(
                location.latitude,
                location.longitude,
                shelter.latitude,
                shelter.longitude
            )

            return {
                ...shelter,
                distance: distance / 1000, // メートルからキロメートルに変換
                walkingTime: Math.round((distance / 1000) * 12) // 徒歩時間（分）: 時速5kmで計算
            }
        })

        // 距離でソート
        sheltersWithDistance.sort((a, b) => a.distance - b.distance)

        return sheltersWithDistance[0] // 最寄りの避難所を返す
    }

    // 現在地が変更された時に最寄り避難所を再計算
    useEffect(() => {
        if (currentLocation && allShelters.length > 0) {
            const nearest = findNearestShelter(currentLocation, allShelters)
            setNearestShelter(nearest)
        }
    }, [currentLocation, allShelters])

    // 初回ロード時に避難所データを取得
    useEffect(() => {
        fetchShelters()
    }, [])

    // 距離順にソートされた全避難所を取得
    const getSheltersByDistance = () => {
        if (!currentLocation || !allShelters || allShelters.length === 0) {
            return []
        }

        return allShelters.map(shelter => {
            const distance = calculateDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                shelter.latitude,
                shelter.longitude
            )

            return {
                ...shelter, // // shelterオブジェクトの全プロパティをコピー
                distance: distance / 1000, // キロメートル
                walkingTime: Math.round((distance / 1000) * 12) // 徒歩時間（分）
            }
            /* スプレッド構文を使わない場合はこうなる
            return {
            id: shelter.id, // ...shelterでコピーされる場所
            name: shelter.name, // ...shelterでコピーされる場所
            location: shelter.location, // ...shelterでコピーされる場所
            latitude: shelter.latitude, // ...shelterでコピーされる場所
            longitude: shelter.longitude, // ...shelterでコピーされる場所
            capacity: shelter.capacity, // ...shelterでコピーされる場所
            current_people: shelter.current_people, // ...shelterでコピーされる場所
            distance: distance / 1000, // 新しく追加されるプロパティ
            walkingTime: Math.round((distance / 1000) * 12) // 新しく追加されるプロパティ
            } */
        }).sort((a, b) => a.distance - b.distance)
    }

    return {
        nearestShelter,
        allShelters: getSheltersByDistance(),
        loading,
        error,
        refreshShelters: fetchShelters
    }
}