import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import { LatLngExpression } from 'leaflet'
import { useState, useEffect, useRef } from 'react'

function ClickHandler({ onChange, onPlace }: { onChange: (lat: number, lng: number) => void; onPlace?: (place: any) => void }) {
  useMapEvents({
    async click(e) { 
      const lat = e.latlng.lat
      const lng = e.latlng.lng
      onChange(lat, lng)
      console.log(`📍 Location pinned: ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
      
      // Try reverse geocoding to auto-fill city/state
      if (onPlace) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)
          
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`,
            {
              signal: controller.signal,
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'PartFinder/1.0 (https://partfinder.app)'
              }
            }
          )
          clearTimeout(timeoutId)
          
          if (res.ok) {
            const data = await res.json()
            const addr = data.address || {}
            const city = addr.city || addr.town || addr.village || addr.county || addr.hamlet || addr.suburb
            const state = addr.state || addr.province || addr.region
            
            if (city || state) {
              onPlace({ 
                display_name: data.display_name, 
                city: city || undefined, 
                state: state || undefined 
              })
              console.log('📍 Auto-filled from map click:', { city, state })
            }
          }
        } catch (err) {
          // Silently fail if reverse geocoding doesn't work
          console.log('⚠️ Reverse geocoding failed (not critical):', err instanceof Error ? err.message : 'Unknown')
          // User can still use search box to set location
        }
      }
    }
  })
  
  return null
}

function MapSearchOverlay({ onSelect, mapRef, onPlace }: { onSelect: (lat: number, lng: number) => void; mapRef: React.RefObject<any>; onPlace?: (place: any) => void }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!q.trim()) {
      setResults([])
      return
    }
    const t = setTimeout(async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
        
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&limit=8`, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'PartFinder/1.0 (https://partfinder.app)'
          }
        })
        clearTimeout(timeoutId)
        
        if (res.ok) {
          const json = await res.json()
          setResults(json || [])
          setIsOpen(json && json.length > 0)
        }
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          console.warn('Search failed:', e.message)
        }
        setResults([])
      }
    }, 500)
    return () => clearTimeout(t)
  }, [q])

  const handleSelect = (result: any) => {
    const latNum = parseFloat(result.lat)
    const lonNum = parseFloat(result.lon)
    onSelect(latNum, lonNum)
    
    // Extract city and state from search result address
    if (onPlace && result.address) {
      const addr = result.address
      const city = addr.city || addr.town || addr.village || addr.county || addr.hamlet
      const state = addr.state || addr.province
      onPlace({ display_name: result.display_name, city: city || undefined, state: state || undefined })
      console.log('Place selected from search:', { city, state, display_name: result.display_name })
    } else if (onPlace && result.display_name) {
      // Fallback: parse display_name to extract location info
      const parts = result.display_name.split(',').map((p: string) => p.trim())
      const city = parts[parts.length - 3] || parts[parts.length - 2] || undefined
      const state = parts[parts.length - 2] || parts[parts.length - 1] || undefined
      onPlace({ display_name: result.display_name, city, state })
      console.log('Place selected from display_name fallback:', { city, state, display_name: result.display_name })
    }
    
    setResults([])
    setQ('')
    setIsOpen(false)
    if (mapRef.current?.setView) {
      mapRef.current.setView([latNum, lonNum], 13)
    }
  }

  return (
    <div style={{ position: 'absolute', top: '10px', left: '50px', zIndex: 1001, pointerEvents: 'auto' }}>
      <div className="bg-white border border-slate-300 rounded-lg shadow-lg p-2 w-72">
        <input 
          value={q} 
          onChange={e => setQ(e.target.value)} 
          placeholder="🔍 Search India only..." 
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        {isOpen && results.length > 0 && (
          <div className="bg-white border border-slate-300 rounded mt-1 max-h-48 overflow-y-auto">
            {results.map((r, i) => (
              <button 
                key={i}
                type="button"
                onClick={() => handleSelect(r)} 
                className="w-full text-left px-3 py-2 text-xs text-slate-900 hover:bg-slate-100 border-b border-slate-200 last:border-b-0"
              >
                <div className="font-medium truncate">{r.display_name.split(',')[0]}</div>
                <div className="text-slate-600 truncate">{r.display_name.split(',').slice(1, 3).join(',')}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MapWithSearch({ latitude, longitude, onChange, onPlace, mapRef }: any) {
  const map = useMap()
  useEffect(() => {
    if (mapRef) mapRef.current = map
  }, [map, mapRef])

  return (
    <>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickHandler onChange={onChange} onPlace={onPlace} />
      {latitude && longitude && <Marker position={[latitude, longitude]} />}
      <MapSearchOverlay onSelect={onChange} mapRef={mapRef} onPlace={onPlace} />
    </>
  )
}

export default function MapPicker({
  latitude, longitude, onChange, onPlace, height = 300
}: { latitude: number | null; longitude: number | null; onChange: (lat: number, lng: number) => void; onPlace?: (place: { display_name?: string; city?: string; state?: string }) => void; height?: number }) {
  const [center, setCenter] = useState<LatLngExpression>([20.5937, 78.9629])
  const mapRef = useRef<any>(null)

  useEffect(() => {
    if (latitude && longitude) {
      setCenter([latitude, longitude])
      if (mapRef.current?.setView) {
        mapRef.current.setView([latitude, longitude], 13)
      }
    }
  }, [latitude, longitude])

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-700" style={{ height, width: '100%' }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} maxBounds={[[6.5546079, 68.1113787],[35.6745457,97.395561]]} zoomControl={true}>
        <MapWithSearch latitude={latitude} longitude={longitude} onChange={onChange} onPlace={onPlace} mapRef={mapRef} />
      </MapContainer>
    </div>
  )
}
