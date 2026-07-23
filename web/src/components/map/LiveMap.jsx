import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { TZ } from '../../design/tokens.js'

const CHARJEW = [63.5786, 39.0989]   // Türkmenabat (Lebap) — [lng, lat]

// Host baked into the published style.json (tiles + fonts point here).
const REMOTE = 'https://hayyrly.com.tm'

// Where the panel talks to the map server.
//  • dev → current origin, so the Vite proxy (/map, /osrm, /fonts, /map-styles)
//    forwards the requests and we avoid CORS.
//  • prod → VITE_MAP_BASE if set, else the real host. Set it empty in
//    .env.production if you deploy the panel on hayyrly.com.tm (same origin).
const MAP_BASE = import.meta.env.DEV
  ? window.location.origin
  : (import.meta.env.VITE_MAP_BASE ?? REMOTE)

const STYLE_URL = `${MAP_BASE}/map-styles/style.json`
const OSRM_BASE = `${MAP_BASE}/osrm/route/v1/driving`

// style.json references absolute https://hayyrly.com.tm URLs for tiles/fonts.
// Redirect them at MAP_BASE so they flow through the proxy in dev and honour
// VITE_MAP_BASE in prod. A no-op when MAP_BASE already equals REMOTE.
const transformRequest = url =>
  url.startsWith(REMOTE) ? { url: MAP_BASE + url.slice(REMOTE.length) } : { url }

// ── Catalog ───────────────────────────────────────────────────────────────────

// Martin lists every available source/table at /catalog.
export async function fetchLayers() {
  const res = await fetch(`${MAP_BASE}/map/catalog`)
  if (!res.ok) throw new Error(`catalog ${res.status}`)
  const data = await res.json()
  return Object.keys(data.tiles || {}).sort()
}

// ── OSRM ─────────────────────────────────────────────────────────────────────

export async function fetchRoute(coords) {
  const wp  = coords.map(c => `${c[0]},${c[1]}`).join(';')
  const res = await fetch(`${OSRM_BASE}/${wp}?overview=full&geometries=geojson`)
  if (!res.ok) throw new Error(`OSRM ${res.status}`)
  return (await res.json()).routes[0].geometry
}

// ── Markers ───────────────────────────────────────────────────────────────────

function statusColor(s) {
  return s === 'offline' ? TZ.faint : s === 'on_way' ? TZ.navy
       : s === 'arrived' ? TZ.amber : s === 'accepted' ? TZ.violet : TZ.green
}

function makeEl(size, bg, emoji, focus = false) {
  const el = document.createElement('div')
  el.style.cssText = `
    width:${size}px;height:${size}px;border-radius:50%;
    background:${bg};border:3px solid #fff;
    display:flex;align-items:center;justify-content:center;
    font-size:${Math.round(size * 0.44)}px;cursor:pointer;
    box-shadow:${focus
      ? '0 0 0 6px rgba(14,42,77,.2),0 2px 8px rgba(0,0,0,.3)'
      : '0 2px 8px rgba(0,0,0,.25)'};
  `
  el.textContent = emoji
  return el
}

const STATUS_LABEL = {
  on_way: 'Ýolda', arrived: 'Geldi', accepted: 'Kabul', created: 'Garaşýar',
  free: 'Boş', busy: 'Meşgul', online: 'Boş', offline: 'Oflaýn', completed: 'Tamamlandy',
}

// drivers: [{ id, name, plate, car, lat, lng, status, focus }] — lat/lng come from
// the live Socket.IO position feed (see MapPage), not from the admin REST listing.
// orders: [{ id, client, from, to, price, status, lat, lng }] — lat/lng from taxi_orders.start_location.
function addMarkers(map, drivers = [], orders = []) {
  const markers = []

  drivers.forEach(d => {
    if (d.lat == null || d.lng == null) return
    const marker = new maplibregl.Marker({ element: makeEl(36, statusColor(d.status), '🚕', d.focus) })
      .setLngLat([d.lng, d.lat])
      .setPopup(new maplibregl.Popup({ offset: 20 }).setHTML(`
        <div style="font-family:Manrope,sans-serif;min-width:180px">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">${d.name}</div>
          <div style="font-size:12px;color:#6A7689">${d.car ?? ''} · ${d.plate ?? ''}</div>
          <div style="font-size:12px;margin-top:4px;font-weight:600">${STATUS_LABEL[d.status] || d.status}</div>
        </div>
      `))
      .addTo(map)
    markers.push(marker)
  })

  orders.forEach(o => {
    if (o.lat == null || o.lng == null) return
    const marker = new maplibregl.Marker({ element: makeEl(28, TZ.orange, '📍') })
      .setLngLat([o.lng, o.lat])
      .setPopup(new maplibregl.Popup({ offset: 16 }).setHTML(`
        <div style="font-family:Manrope,sans-serif">
          <div style="font-weight:700;font-size:13px">#${o.id}</div>
          <div style="font-size:12px;color:#6A7689">${o.client ?? ''}</div>
          <div style="font-size:12px;margin-top:4px">${o.from ?? ''} → ${o.to ?? ''}</div>
          <div style="font-weight:700;font-size:13px;margin-top:4px">${Number(o.price ?? 0).toFixed(2)} TMT</div>
        </div>
      `))
      .addTo(map)
    markers.push(marker)
  })

  return markers
}

// Start/end pin for the order that's currently focused in the side panel.
function addOrderEndpointMarkers(map, order) {
  const markers = []
  if (!order) return markers

  if (order.startLat != null && order.startLng != null) {
    markers.push(
      new maplibregl.Marker({ element: makeEl(30, TZ.green, '🟢') })
        .setLngLat([order.startLng, order.startLat])
        .setPopup(new maplibregl.Popup({ offset: 18 }).setHTML(
          `<div style="font-family:Manrope,sans-serif;font-size:12px"><b>Başlangyç</b><br/>${order.from ?? ''}</div>`
        ))
        .addTo(map)
    )
  }
  if (order.endLat != null && order.endLng != null) {
    markers.push(
      new maplibregl.Marker({ element: makeEl(30, TZ.orangeDk, '🏁') })
        .setLngLat([order.endLng, order.endLat])
        .setPopup(new maplibregl.Popup({ offset: 18 }).setHTML(
          `<div style="font-family:Manrope,sans-serif;font-size:12px"><b>Barmaly ýer</b><br/>${order.to ?? ''}</div>`
        ))
        .addTo(map)
    )
  }
  return markers
}

// ── Route layer ───────────────────────────────────────────────────────────────

export function drawRoute(map, id, geometry, color = TZ.navy) {
  const sid = `route-${id}`, lid = `route-line-${id}`
  if (map.getLayer(lid))  map.removeLayer(lid)
  if (map.getSource(sid)) map.removeSource(sid)
  map.addSource(sid, { type: 'geojson', data: { type: 'Feature', geometry } })
  map.addLayer({
    id: lid, type: 'line', source: sid,
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': color, 'line-width': 4, 'line-opacity': 0.85 },
  })
}

export function clearRoute(map, id) {
  const sid = `route-${id}`, lid = `route-line-${id}`
  if (map.getLayer(lid))  map.removeLayer(lid)
  if (map.getSource(sid)) map.removeSource(sid)
}

// ── Actual GPS breadcrumb track (the driven path, as recorded by the driver's
// phone) — distinct from `drawRoute`'s planned OSRM line, so it gets its own
// source/layer ids and a visually different (solid green) style.

function drawTrack(map, id, points, color = TZ.green) {
  const sid = `track-${id}`, lid = `track-line-${id}`
  clearTrack(map, id)
  if (!points || points.length < 2) return
  map.addSource(sid, {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'LineString', coordinates: points.map(p => [p.lng, p.lat]) } },
  })
  map.addLayer({
    id: lid, type: 'line', source: sid,
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': color, 'line-width': 4, 'line-opacity': 0.9 },
  })
}

function clearTrack(map, id) {
  const sid = `track-${id}`, lid = `track-line-${id}`
  if (map.getLayer(lid))  map.removeLayer(lid)
  if (map.getSource(sid)) map.removeSource(sid)
}

// The tile server (Martin) serves buildings as `buildings_view`, but the
// published style.json points at `gis_osm_buildings_a_free_1`, which 404s.
// Repoint the source + its layers to the name the server actually serves.
function patchStyle(style) {
  const b = style.sources?.shp_buildings
  if (b) b.tiles = [`${MAP_BASE}/map/buildings_view/{z}/{x}/{y}`]
  for (const layer of style.layers || []) {
    if (layer.source === 'shp_buildings') layer['source-layer'] = 'buildings_view'
  }
  return style
}

// ── Debug layer ─────────────────────────────────────────────────────────────
// Renders the raw geometry of any chosen Martin table in a highlight colour, so
// you can inspect which sources actually contain data. Fill/line/circle layers
// cover whatever geometry type the table holds.

const DBG_SRC = 'debug-table'
const DBG_LAYERS = ['debug-fill', 'debug-line', 'debug-point']

function applyDebugLayer(map, name) {
  for (const id of DBG_LAYERS) if (map.getLayer(id)) map.removeLayer(id)
  if (map.getSource(DBG_SRC)) map.removeSource(DBG_SRC)
  if (!name) return

  map.addSource(DBG_SRC, {
    type: 'vector',
    tiles: [`${MAP_BASE}/map/${name}/{z}/{x}/{y}`],
    minzoom: 0, maxzoom: 22,
  })
  map.addLayer({
    id: 'debug-fill', type: 'fill', source: DBG_SRC, 'source-layer': name,
    paint: { 'fill-color': '#e8431f', 'fill-opacity': 0.25, 'fill-outline-color': '#e8431f' },
  })
  map.addLayer({
    id: 'debug-line', type: 'line', source: DBG_SRC, 'source-layer': name,
    paint: { 'line-color': '#e8431f', 'line-width': 2 },
  })
  map.addLayer({
    id: 'debug-point', type: 'circle', source: DBG_SRC, 'source-layer': name,
    paint: { 'circle-radius': 4, 'circle-color': '#e8431f', 'circle-stroke-color': '#fff', 'circle-stroke-width': 1 },
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LiveMap({ style, onReady, debugLayer = '', drivers = [], orders = [], selectedOrder = null, track = [] }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const debugRef = useRef(debugLayer)
  debugRef.current = debugLayer
  const markersRef = useRef([])
  const endpointMarkersRef = useRef([])
  const [error, setError] = useState(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return
    let cancelled = false

    fetch(STYLE_URL)
      .then(r => { if (!r.ok) throw new Error(`style ${r.status}`); return r.json() })
      .then(spec => {
        if (cancelled || !containerRef.current) return
        const map = new maplibregl.Map({
          container: containerRef.current,
          style: patchStyle(spec),
          center: CHARJEW,
          zoom: 13,
          transformRequest,
        })
        mapRef.current = map
        map.addControl(new maplibregl.NavigationControl(), 'top-right')
        map.on('error', e => { if (e?.error) console.warn('map:', e.error.message) })
        map.on('load', () => {
          applyDebugLayer(map, debugRef.current)
          setMapLoaded(true)
          onReady?.(map)
        })
      })
      .catch(err => { if (!cancelled) setError(err.message || 'Karta ýüklenmedi') })

    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null }
  }, [])

  // Re-render driver/order markers whenever live data changes.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = addMarkers(map, drivers, orders)
  }, [mapLoaded, drivers, orders])

  // Draw start/end pins + the road route for whichever order is focused in the panel.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    endpointMarkersRef.current.forEach(m => m.remove())
    endpointMarkersRef.current = []
    clearRoute(map, 'selected')
    clearTrack(map, 'selected')

    if (!selectedOrder) return
    endpointMarkersRef.current = addOrderEndpointMarkers(map, selectedOrder)

    drawTrack(map, 'selected', track)

    const { startLat, startLng, endLat, endLng } = selectedOrder
    const bounds = new maplibregl.LngLatBounds()
    let hasBounds = false
    let cancelled = false

    if (startLat != null && startLng != null && endLat != null && endLng != null) {
      fetchRoute([[startLng, startLat], [endLng, endLat]])
        .then(geometry => { if (!cancelled) drawRoute(map, 'selected', geometry, TZ.navy) })
        .catch(() => {})

      bounds.extend([startLng, startLat])
      bounds.extend([endLng, endLat])
      hasBounds = true
    }

    track.forEach(p => { bounds.extend([p.lng, p.lat]); hasBounds = true })

    if (hasBounds) map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 500 })

    return () => { cancelled = true }
    // Keyed on the order's identity + endpoint coords, not the object reference, since
    // MapPage recomputes `selectedOrder` on every live-position tick.
  }, [mapLoaded, selectedOrder?.id, selectedOrder?.startLat, selectedOrder?.startLng, selectedOrder?.endLat, selectedOrder?.endLng, track])

  // Re-apply when the selected table changes.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (map.isStyleLoaded()) applyDebugLayer(map, debugLayer)
    else map.once('load', () => applyDebugLayer(map, debugLayer))
  }, [debugLayer])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {error && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 6, padding: 24, textAlign: 'center',
          background: '#f0ebe3',
        }}>
          <div style={{ fontFamily: TZ.sans, fontSize: 14, fontWeight: 700, color: TZ.ink }}>
            Karta ýüklenmedi
          </div>
          <div style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.muted, maxWidth: 320 }}>
            Karta serweri bilen baglanyşyk ýok. ({error})
          </div>
        </div>
      )}
    </div>
  )
}
