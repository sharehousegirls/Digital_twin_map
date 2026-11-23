import { useEffect, useRef, useState } from 'react'
import { Viewer, Cartesian3, Color, Cesium3DTileset, Ion, createOsmBuildingsAsync, Math as CesiumMath, ScreenSpaceEventHandler, ScreenSpaceEventType, Cartographic, HeightReference, Entity, PolygonHierarchy, CallbackProperty, GeoJsonDataSource, UrlTemplateImageryProvider, OpenStreetMapImageryProvider, Terrain } from 'cesium'

const sampleBuildings = [
  { id:'B-001', name:'시범 건물 A', type:'업무시설', floors:18, year:2012, lat:35.8716, lon:128.6014, height:64 },
  { id:'B-002', name:'시범 건물 B', type:'상업시설', floors:8, year:2004, lat:35.8699, lon:128.6042, height:31 },
  { id:'B-003', name:'시범 건물 C', type:'문화시설', floors:5, year:2019, lat:35.8731, lon:128.5987, height:24 },
  { id:'B-004', name:'시범 건물 D', type:'주거시설', floors:22, year:1998, lat:35.8678, lon:128.5998, height:72 },
  { id:'B-005', name:'시범 건물 E', type:'업무시설', floors:12, year:2021, lat:35.8743, lon:128.6051, height:43 },
  { id:'B-006', name:'시범 건물 F', type:'상업시설', floors:4, year:1987, lat:35.8708, lon:128.5965, height:17 },
  { id:'B-007', name:'시범 건물 G', type:'주거시설', floors:15, year:2010, lat:35.8669, lon:128.6062, height:51 },
  { id:'B-008', name:'시범 건물 H', type:'문화시설', floors:3, year:2023, lat:35.8720, lon:128.6070, height:14 }
]

export default function App() {
  const mapRef = useRef(null)
  const viewerRef = useRef(null)
  const entityById = useRef({})
  const [selected, setSelected] = useState(null)
  const [layers, setLayers] = useState({ buildings:true, sample:true })
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('지도 초기화 중')
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (!mapRef.current || viewerRef.current) return
    const viewer = new Viewer(mapRef.current, {
      animation:false, timeline:false, geocoder:false, homeButton:false,
      sceneModePicker:false, navigationHelpButton:false, baseLayerPicker:false,
      fullscreenButton:false, infoBox:false, selectionIndicator:false,
      scene3DOnly:true, shouldAnimate:false
    })
    viewerRef.current = viewer
    viewer.scene.globe.depthTestAgainstTerrain = false
    viewer.scene.skyAtmosphere.show = true
    viewer.scene.globe.show = true
    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(128.601, 35.871, 3800),
      orientation:{ heading:0, pitch:CesiumMath.toRadians(-48), roll:0 }
    })
    // OSM imagery is used as a no-key starter basemap.
    viewer.imageryLayers.removeAll()
    viewer.imageryLayers.addImageryProvider(new OpenStreetMapImageryProvider({ url:'https://tile.openstreetmap.org/' }))
    const addSamples = () => {
      sampleBuildings.forEach((b) => {
        const entity = viewer.entities.add({
          id:b.id,
          name:b.name,
          position:Cartesian3.fromDegrees(b.lon,b.lat,b.height/2),
          box:{ dimensions:new Cartesian3(34,28,b.height), material:Color.fromCssColorString('#54b8d9').withAlpha(0.62), outline:true, outlineColor:Color.fromCssColorString('#d8f4ff') }
        })
        entity.properties = { ...b }
        entityById.current[b.id] = entity
      })
    }
    addSamples()
    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
    handler.setInputAction((movement) => {
      const picked = viewer.scene.pick(movement.position)
      if (picked?.id?.properties) {
        const props = picked.id.properties
        setSelected({
          id:props.id?.getValue(), name:props.name?.getValue(), type:props.type?.getValue(),
          floors:props.floors?.getValue(), year:props.year?.getValue(),
          lat:props.lat?.getValue(), lon:props.lon?.getValue(), height:props.height?.getValue()
        })
      } else setSelected(null)
    }, ScreenSpaceEventType.LEFT_CLICK)
    setStatus('지도 준비 완료')
    setMapReady(true)
    return () => { handler.destroy(); viewer.destroy(); viewerRef.current = null }
  }, [])

  useEffect(() => {
    if (!viewerRef.current) return
    Object.values(entityById.current).forEach(e => { e.show = layers.sample && layers.buildings })
  }, [layers])

  const filtered = sampleBuildings.filter(b => !search || [b.name,b.type,b.id].some(v => v.toLowerCase().includes(search.toLowerCase())))
  const flyToBuilding = (b) => {
    const viewer = viewerRef.current
    if (!viewer) return
    viewer.camera.flyTo({ destination:Cartesian3.fromDegrees(b.lon,b.lat,1100), duration:1.1 })
    setSelected(b)
  }
  const resetView = () => viewerRef.current?.camera.flyTo({ destination:Cartesian3.fromDegrees(128.601,35.871,3800), orientation:{ heading:0,pitch:CesiumMath.toRadians(-48),roll:0 },duration:1.2 })

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand-mark">DT</div>
      <div className="brand-text"><strong>DAEGU DIGITAL TWIN</strong><span>URBAN GIS EXPLORER</span></div>
      <div className="top-status"><span className="live-dot"/>{status}</div>
      <button className="icon-btn" onClick={resetView} aria-label="초기 위치">⌂</button>
    </header>
    <main className="workspace">
      <aside className="sidebar">
        <div className="side-heading"><div><span className="eyebrow">CITY MODEL</span><h1>대구 도시 탐색</h1></div><span className="pill">DEMO</span></div>
        <div className="search-wrap"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="건물 이름 · 유형 · ID 검색"/></div>
        <section className="panel-section">
          <h2>지도 레이어 <span>LAYERS</span></h2>
          <label className="layer-row"><span className="layer-icon blue">▦</span><span className="layer-label">시범 건물 데이터<small>Demo building objects</small></span><input type="checkbox" checked={layers.sample} onChange={e=>setLayers(v=>({...v,sample:e.target.checked}))}/></label>
          <label className="layer-row"><span className="layer-icon teal">▧</span><span className="layer-label">건물 레이어<small>Building layer</small></span><input type="checkbox" checked={layers.buildings} onChange={e=>setLayers(v=>({...v,buildings:e.target.checked}))}/></label>
        </section>
        <section className="panel-section">
          <h2>시범 객체 <span>{filtered.length.toString().padStart(2,'0')} OBJECTS</span></h2>
          <div className="building-list">{filtered.map(b=><button key={b.id} className={'building-item '+(selected?.id===b.id?'active':'')} onClick={()=>flyToBuilding(b)}><span className="building-dot"/><span><strong>{b.name}</strong><small>{b.type} · {b.floors}층</small></span><span className="chevron">›</span></button>)}</div>
        </section>
        <div className="sidebar-foot"><span className="foot-dot"/>데모 데이터 · 실제 건물 데이터 아님</div>
      </aside>
      <section className="map-area">
        <div ref={mapRef} className="cesium-map"/>
        <div className="map-label"><span className="eyebrow">LOCATION</span><strong>대구광역시 · 중구 일대</strong><small>Daegu, South Korea</small></div>
        <div className="map-tools"><button onClick={()=>viewerRef.current?.camera.zoomIn(350)} title="확대">＋</button><button onClick={()=>viewerRef.current?.camera.zoomOut(350)} title="축소">－</button><button onClick={resetView} title="초기화">⌖</button></div>
        <div className="map-legend"><span><i className="legend-building"/>시범 건물</span><span><i className="legend-selected"/>선택 객체</span></div>
        {selected && <div className="detail-card"><button className="close-detail" onClick={()=>setSelected(null)}>×</button><span className="eyebrow">SELECTED OBJECT</span><h3>{selected.name}</h3><p className="detail-id">{selected.id}</p><div className="detail-grid"><div><small>용도</small><strong>{selected.type}</strong></div><div><small>층수</small><strong>{selected.floors}층</strong></div><div><small>준공년도</small><strong>{selected.year}</strong></div><div><small>시범 높이</small><strong>{selected.height}m</strong></div></div><button className="detail-action" onClick={()=>flyToBuilding(selected)}>지도에서 위치 보기 ↗</button></div>}
        <div className="map-credit">© OpenStreetMap contributors · 3D sample objects</div>
        {!mapReady && <div className="loading-overlay"><div className="loader"/><span>3D 지도 준비 중...</span></div>}
      </section>
    </main>
    <footer className="footer"><span>DAEGU DIGITAL TWIN <b>•</b> DEVELOPMENT BUILD 0.1</span><span>DATA STATUS: <strong>DEMO / NOT OFFICIAL</strong></span></footer>
  </div>
}