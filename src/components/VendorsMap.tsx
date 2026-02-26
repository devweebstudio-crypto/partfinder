import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { LatLngExpression } from 'leaflet'
import L from 'leaflet'

// Custom marker icon
const vendorIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

export default function VendorsMap({ 
  vendors, 
  center = [20.5937, 78.9629] as LatLngExpression,
  onVendorClick 
}: { 
  vendors: any[]; 
  center?: LatLngExpression;
  onVendorClick?: (vendor: any) => void 
}) {
  const vendorsWithLocation = vendors.filter(v => v.latitude && v.longitude)

  return (
    <div className="rounded-xl overflow-hidden border border-slate-700 h-64 sm:h-80 md:h-[400px] w-full">
      <MapContainer 
        center={center} 
        zoom={5} 
        style={{ height: '100%', width: '100%' }} 
        maxBounds={[[6.5546079, 68.1113787],[35.6745457,97.395561]]}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {vendorsWithLocation.map((vendor) => (
          <Marker 
            key={vendor.id}
            position={[vendor.latitude, vendor.longitude]}
            icon={vendorIcon}
          >
            <Popup>
              <div className="w-48 text-slate-900">
                <p className="font-semibold">{vendor.business_name || vendor.full_name}</p>
                <p className="text-xs text-slate-600">{vendor.category}</p>
                <p className="text-xs text-slate-600">{vendor.city}, {vendor.state}</p>
                <button 
                  onClick={() => onVendorClick?.(vendor)}
                  className="mt-2 w-full bg-blue-500 text-white text-xs py-1 rounded hover:bg-blue-600"
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
