import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { LatLngExpression } from 'leaflet'
import L from 'leaflet'
import { appName } from '../lib/appConfig'
import { useState } from 'react'

const vendorIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

interface VendorMarker {
  vendor: any
  onMouseEnter: () => void
  onMouseLeave: () => void
}

function VendorMarkerComponent({ vendor, onMouseEnter, onMouseLeave }: VendorMarker) {
  return (
    <Marker 
      position={[vendor.latitude, vendor.longitude]}
      icon={vendorIcon}
      eventHandlers={{ mouseover: onMouseEnter, mouseout: onMouseLeave }}
    />
  )
}

export default function LandingVendorsMap({ 
  vendors,
  center = [20.5937, 78.9629] as LatLngExpression,
}: { 
  vendors: any[]; 
  center?: LatLngExpression;
}) {
  const [hoveredVendor, setHoveredVendor] = useState<string | null>(null)
  const vendorsWithLocation = vendors.filter(v => v.latitude && v.longitude)

  return (
    <div className="space-y-4">
      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-slate-700 h-64 sm:h-80 md:h-[400px] w-full">
        <MapContainer 
          center={center} 
          zoom={5} 
          style={{ height: '100%', width: '100%' }} 
          maxBounds={[[6.5546079, 68.1113787],[35.6745457,97.395561]]}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {vendorsWithLocation.map((vendor) => (
            <VendorMarkerComponent
              key={vendor.id}
              vendor={vendor}
              onMouseEnter={() => setHoveredVendor(vendor.id)}
              onMouseLeave={() => setHoveredVendor(null)}
            />
          ))}
        </MapContainer>
      </div>

      {/* Vendor Details on Hover */}
      {hoveredVendor && (
        <div className="bg-slate-900 border border-brand-500/50 rounded-xl p-4">
          {vendorsWithLocation.find((v: any) => v.id === hoveredVendor) && (
            <>
              <p className="font-semibold text-lg">
                {vendorsWithLocation.find((v: any) => v.id === hoveredVendor)?.business_name || 
                 vendorsWithLocation.find((v: any) => v.id === hoveredVendor)?.full_name}
              </p>
              <p className="text-brand-400 text-sm mt-1">
                {vendorsWithLocation.find((v: any) => v.id === hoveredVendor)?.category}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                📍 {vendorsWithLocation.find((v: any) => v.id === hoveredVendor)?.city}, {vendorsWithLocation.find((v: any) => v.id === hoveredVendor)?.state}
              </p>
              {vendorsWithLocation.find((v: any) => v.id === hoveredVendor)?.phone && (
                <p className="text-slate-400 text-sm mt-1">
                  📞 {vendorsWithLocation.find((v: any) => v.id === hoveredVendor)?.phone}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Vendor Count */}
      <p className="text-slate-400 text-sm text-center">
        {vendorsWithLocation.length} vendor{vendorsWithLocation.length !== 1 ? 's' : ''} registered on {appName}
      </p>
    </div>
  )
}
