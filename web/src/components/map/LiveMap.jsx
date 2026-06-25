import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { DRIVERS, ORDERS } from '../../data/mock.js'
import { TZ } from '../../design/tokens.js'

const ASHGABAT    = [58.3261, 37.9601]   // [lng, lat]
const TILES_PBF   = 'https://hayyrly.com.tm/map/{z}/{x}/{y}.pbf'
const TILES_OSM   = 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSRM_BASE   = 'https://hayyrly.com.tm/osrm/route/v1/driving'

// ── OSRM ────────────────────────────────────────────────────────────────────

export async function fetchRoute(coords) {
  // coords: [[lng, lat], [lng, lat], ...]
  const waypoints = coords.map(c => `${c[0]},${c[1]}`).join(';')
  const res = await fetch(`${OSRM_BASE}/${waypoints}?overview=full&geometries=geojson`)
  if (!res.ok) throw new Error(`OSRM ${res.status}`)
  const data = await res.json()
  return data.routes[0].geometry   // GeoJSON LineString
}

// ── Styles ───────────────────────────────────────────────────────────────────

function vectorStyle() {
  return {
    version: 8,
    sources: {
      hayyrly: { type: 'vector', tiles: [TILES_PBF], maxzoom: 14 },
    },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': '#e8e8e8' } },
      { id: 'water',      type: 'fill', source: 'hayyrly', 'source-layer': 'water',          paint: { 'fill-color': '#9ecae1' } },
      { id: 'landuse',    type: 'fill', source: 'hayyrly', 'source-layer': 'landuse',         paint: { 'fill-color': '#d4e8b0', 'fill-opacity': 0.6 } },
      { id: 'roads',      type: 'line', source: 'hayyrly', 'source-layer': 'transportation',  paint: { 'line-color': '#fff', 'line-width': 1.5 } },
      { id: 'buildings',  type: 'fill', source: 'hayyrly', 'source-layer': 'building',        paint: { 'fill-color': '#d9d9d9', 'fill-outline-color': '#bbb' } },
    ],
  }
}

function rasterStyle() {
  return {
    version: 8,
    sources: {
      osm: { type: 'raster', tiles: [TILES_OSM], tileSize: 256, attribution: '© OpenStreetMap contributors' },
    },
    layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
  }
}

async function resolveStyle() {
  try {
    const probe = TILES_PBF.replace('{z}', '0').replace('{x}', '0').replace('{y}', '0')
    const res = await fetch(probe, { method: 'HEAD', signal: AbortSignal.timeout(3000) })
    if (res.ok) return vectorStyle()
  } catch { /* fall through */ }
  return rasterStyle()
}

// ── Markers ──────────────────────────────────────────────────────────────────

function statusColor(status) {
  return status === 'offline'  ? TZ.faint
       : status === 'on_way'   ? TZ.navy
       : status === 'arrived'  ? TZ.amber
       : status === 'accepted' ? TZ.violet
       : TZ.green
}

function makeEl(size, bg, emoji, focus = false) {
  const el = document.createElement('div')
  el.style.cssText = `
    width:${size}px;height:${size}px;border-radius:50%;
    background:${bg};border:3px solid #fff;
    display:flex;align-items:center;justify-content:center;
    font-size:${size * 0.44}px;cursor:pointer;
    box-shadow:${focus
      ? '0 0 0 6px rgba(14,42,77,.2),0 2px 8px rgba(0,0,0,.3)'
      : '0 2px 8px rgba(0,0,0,.25)'};
  `
  el.textContent = emoji
  return el
}

const STATUS_LABEL = {
  on_way: 'Ýolda', arrived: 'Geldi', accepted: 'Kabul',
  online: 'Boş', offline: 'Oflaýn', completed: 'Tamamlandy',
}

function addMarkers(map) {
  DRIVERS.forEach(d => {
    if (!d.lat) return
    new maplibregl.Marker({ element: makeEl(36, statusColor(d.status), '🚕', d.focus) })
      .setLngLat([d.lng, d.lat])
      .setPopup(new maplibregl.Popup({ offset: 20 }).setHTML(`
        <div style="font-family:Manrope,sans-serif;min-width:180px">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">${d.name}</div>
          <div style="font-size:12px;color:#6A7689">${d.car} · ${d.plate}</div>
          <div style="font-size:12px;margin-top:4px;font-weight:600">${STATUS_LABEL[d.status] || d.status}</div>
          <div style="font-size:12px;margin-top:2px">Balans: <b>${d.balance.toFixed(2)} TMT</b></div>
        </div>
      `))
      .addTo(map)
  })

  ORDERS.filter(o => ['pending', 'accepted'].includes(o.status)).forEach(o => {
    const lat = 37.9601 + (Math.random() - 0.5) * 0.04
    const lng = 58.3261 + (Math.random() - 0.5) * 0.06
    new maplibregl.Marker({ element: makeEl(28, TZ.orange, '📍') })
      .setLngLat([lng, lat])
      .setPopup(new maplibregl.Popup({ offset: 16 }).setHTML(`
        <div style="font-family:Manrope,sans-serif">
          <div style="font-weight:700;font-size:13px">${o.id}</div>
          <div style="font-size:12px;color:#6A7689">${o.client}</div>
          <div style="font-size:12px;margin-top:4px">${o.from} → ${o.to}</div>
          <div style="font-weight:700;font-size:13px;margin-top:4px">${o.price.toFixed(2)} TMT</div>
        </div>
      `))
      .addTo(map)
  })
}

// ── Route layer ──────────────────────────────────────────────────────────────

export function drawRoute(map, id, geometry, color = TZ.navy) {
  const sourceId = `route-${id}`
  const layerId  = `route-line-${id}`

  if (map.getLayer(layerId))  map.removeLayer(layerId)
  if (map.getSource(sourceId)) map.removeSource(sourceId)

  map.addSource(sourceId, { type: 'geojson', data: { type: 'Feature', geometry } })
  map.addLayer({
    id: layerId,
    type: 'line',
    source: sourceId,
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': color, 'line-width': 4, 'line-opacity': 0.85 },
  })
}

export function clearRoute(map, id) {
  const sourceId = `route-${id}`
  const layerId  = `route-line-${id}`
  if (map.getLayer(layerId))   map.removeLayer(layerId)
  if (map.getSource(sourceId)) map.removeSource(sourceId)
}

// ── Component ────────────────────────────────────────────────────────────────

export default function LiveMap({ style, onReady }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    let map
    resolveStyle().then(mapStyle => {
      if (!containerRef.current) return
      map = new maplibregl.Map({
        container: containerRef.current,
        style: mapStyle,
        center: ASHGABAT,
        zoom: 13,
      })
      mapRef.current = map
      map.addControl(new maplibregl.NavigationControl(), 'top-right')
      map.on('load', () => {
        addMarkers(map)
        onReady?.(map)
      })
    })

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
      else if (map) map.remove()
    }
  }, [])

  return <div ref={containerRef} style={{ width: '100%', height: '100%', ...style }} />
}
