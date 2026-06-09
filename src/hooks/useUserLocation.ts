import { useState, useEffect } from 'react'

const CACHE_KEY = 'bm_location_label'

type LocationState = {
  loading: boolean
  label: string
  denied: boolean
}

export function useUserLocation() {
  const [state, setState] = useState<LocationState>({
    loading: false,
    label: localStorage.getItem(CACHE_KEY) ?? '',
    denied: false,
  })

  const detect = () => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, label: s.label || 'Location unavailable' }))
      return
    }
    setState(s => ({ ...s, loading: true, denied: false }))
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          const addr = data.address ?? {}
          const parts = [
            addr.suburb ?? addr.neighbourhood ?? addr.village ?? addr.town ?? addr.hamlet,
            addr.city ?? addr.county ?? addr.state_district,
          ].filter(Boolean)
          const label = parts.join(', ') || (data.display_name as string | undefined)?.split(',')[0] || 'Your location'
          localStorage.setItem(CACHE_KEY, label)
          setState({ loading: false, label, denied: false })
        } catch {
          setState({ loading: false, label: localStorage.getItem(CACHE_KEY) || 'Your location', denied: false })
        }
      },
      () => {
        setState({ loading: false, label: localStorage.getItem(CACHE_KEY) || '', denied: true })
      },
      { timeout: 10000, maximumAge: 5 * 60 * 1000 }
    )
  }

  // Auto-detect on first mount if no cached value
  useEffect(() => {
    if (!localStorage.getItem(CACHE_KEY)) detect()
  }, []) // eslint-disable-line

  return { ...state, detect }
}
