'use client'

import 'leaflet/dist/leaflet.css'
import { useMemo, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { PartnerWorkshop } from '../constants'

// Same idea as SchoolMapPicker — Leaflet's default marker URLs 404 when not
// bundled, so we rebind them to unpkg.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const SELECTED_ICON = L.divIcon({
  html: `<div style="
    width: 32px; height: 32px;
    background: #FF7A59;
    border: 3px solid #fff;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 4px 12px -2px rgba(255,122,89,0.6);
  "></div>`,
  className: '',
  iconSize:   [32, 32],
  iconAnchor: [16, 30],
})

interface WorkshopMapPickerProps {
  workshops:  PartnerWorkshop[]
  selectedId: string | null
  onSelect:   (id: string) => void
}

export default function WorkshopMapPicker({ workshops, selectedId, onSelect }: WorkshopMapPickerProps) {
  const placeable = useMemo(
    () => workshops.filter((w): w is PartnerWorkshop =>
      typeof w.lat === 'number' && typeof w.lng === 'number'
    ),
    [workshops]
  )

  const center: [number, number] = useMemo(() => {
    const sel = placeable.find((w) => w.id === selectedId)
    if (sel) return [sel.lat, sel.lng]
    if (placeable.length === 0) return [45.5, 6.0] // Alps default — most workshops are there
    const lat = placeable.reduce((a, w) => a + w.lat, 0) / placeable.length
    const lng = placeable.reduce((a, w) => a + w.lng, 0) / placeable.length
    return [lat, lng]
  }, [placeable, selectedId])

  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-brand-stone">
      <MapContainer
        center={center}
        zoom={7}
        style={{ height: '320px', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterOnSelect center={center} />
        {placeable.map((w) => {
          const isSelected = w.id === selectedId
          return (
            <Marker
              key={w.id}
              position={[w.lat, w.lng]}
              icon={isSelected ? SELECTED_ICON : new L.Icon.Default()}
              eventHandlers={{ click: () => onSelect(w.id) }}
            >
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <p style={{ fontWeight: 600, color: '#0f0f1d', margin: 0 }}>{w.label}</p>
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    {[w.city, w.region].filter(Boolean).join(' · ')}
                  </p>
                  {w.address && (
                    <p style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontStyle: 'italic' }}>
                      {w.address}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelect(w.id)}
                    style={{
                      marginTop: 8,
                      padding: '6px 12px',
                      background: isSelected ? '#10b981' : '#FF7A59',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    {isSelected ? '✓ Sélectionné' : 'Choisir cet atelier'}
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

function RecenterOnSelect({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, Math.max(map.getZoom(), 8), { duration: 0.5 })
  }, [map, center])
  return null
}
