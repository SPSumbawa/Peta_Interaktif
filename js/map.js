// Global map variable
let map;

// Query BHUMI WMS
async function queryBhumiPersil(latlng) {
  const point = map.latLngToContainerPoint(latlng);
  const size = map.getSize();
  const bounds = map.getBounds();
  const sw = map.options.crs.project(bounds.getSouthWest());
  const ne = map.options.crs.project(bounds.getNorthEast());
  const bbox = [sw.x, sw.y, ne.x, ne.y].join(',');

  const params = {
    SERVICE: 'WMS',
    VERSION: '1.3.0',
    REQUEST: 'GetFeatureInfo',
    LAYERS: 'bhumi_persil',
    QUERY_LAYERS: 'bhumi_persil',
    INFO_FORMAT: 'application/json',
    FEATURE_COUNT: 50,
    I: Math.floor(point.x),
    J: Math.floor(point.y),
    CRS: 'EPSG:3857',
    WIDTH: size.x,
    HEIGHT: size.y,
    BBOX: bbox
  };

  const queryString = Object.keys(params)
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');

  const url = CONFIG.wms.bhumi.url + queryString;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error querying BHUMI:', error);
    return null;
  }
}

// Query Kawasan Hutan
async function queryKawasanHutan(latlng) {
  const earthRadius = 6378137;
  const lat = Math.max(Math.min(latlng.lat, 89.99999), -89.99999);
  const x = earthRadius * latlng.lng * Math.PI / 180;
  const y = earthRadius * Math.log(Math.tan((90 + lat) * Math.PI / 360));

  const identifyUrl = 'https://geoportal.menlhk.go.id/server/rest/services/jsdgejawfvrdtasdt/KWS_HUTAN/MapServer/identify';

  const params = {
    f: 'json',
    geometry: `{"x":${x},"y":${y},"spatialReference":{"wkid":102100}}`,
    geometryType: 'esriGeometryPoint',
    sr: '102100',
    layers: 'all',
    tolerance: 5,
    mapExtent: map.getBounds().toBBoxString(),
    imageDisplay: `${map.getSize().x},${map.getSize().y},96`,
    returnGeometry: true
  };

  const queryString = Object.keys(params)
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');

  try {
    const response = await fetch(`${identifyUrl}?${queryString}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error querying Hutan:', error);
    return null;
  }
}

// Handle map click
function handleMapClick(e) {
  const activeLayers = [];
  
  if (LayerManager.active.bhumi) activeLayers.push('bhumi');
  if (LayerManager.active.hutan) activeLayers.push('hutan');

  if (activeLayers.length === 0) return;

  const queries = [];

  if (LayerManager.active.bhumi) {
    queries.push(
      queryBhumiPersil(e.latlng).then(data => ({ type: 'PERSIL', data }))
    );
  }

  if (LayerManager.active.hutan) {
    queries.push(
      queryKawasanHutan(e.latlng).then(data => ({ type: 'HUTAN', data }))
    );
  }

  if (queries.length === 0) return;

  // ✅ GANTI: Gunakan Drawer instead of Popup
  DrawerManager.showLoading();

  // Execute queries
  Promise.all(queries).then(results => {
    let hasData = false;

    results.forEach(result => {
      // PERSIL
      if (result.type === 'PERSIL' && result.data && result.data.features && result.data.features.length > 0) {
        hasData = true;
        DrawerManager.show('persil', result.data.features, e.latlng);
        return;
      }

      // HUTAN
      if (result.type === 'HUTAN' && result.data && result.data.results && result.data.results.length > 0) {
        hasData = true;
        const attributes = result.data.results[0].attributes;
        DrawerManager.show('hutan', attributes, e.latlng);
      }
    });

    if (!hasData) {
      DrawerManager.showError('⚠️ Tidak ada data di lokasi ini.');
    }
  }).catch(error => {
    console.error('Error in queries:', error);
    DrawerManager.showError('❌ Terjadi kesalahan saat memuat data.');
  });
}


// Initialize map
async function initMap() {
  // Create map
  map = L.map('map', {
    maxZoom: CONFIG.map.maxZoom,
    zoomControl: CONFIG.map.zoomControl,
    tap: true,
    tapTolerance: 15
  }).setView(CONFIG.map.center, CONFIG.map.zoom);

  // Initialize controls
  ControlsManager.init(map);

  // Initialize layers
  await LayerManager.init(map);

  // Add map click handler
  map.on('click', handleMapClick);

  // ✅ PERBAIKAN: Hanya cleanup highlight, JANGAN panggil close()
  map.on('popupclose', function(e) {
    console.log('📍 Popup closed by user');
    
    // Only remove highlight layer, don't call PopupManager.close()
    if (PopupManager.highlightLayer && map.hasLayer(PopupManager.highlightLayer)) {
      map.removeLayer(PopupManager.highlightLayer);
      PopupManager.highlightLayer = null;
    }
    
    // Reset state WITHOUT closing popup again
    PopupManager.currentFeatures = [];
    PopupManager.currentIndex = 0;
    PopupManager.currentPopup = null;
    PopupManager.isProcessing = false;
  });

  console.log('🗺️ Peta berhasil dimuat!');
  console.log('✅ Semua layer telah diload');
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMap);
} else {
  initMap();
}

// Mobile viewport adjustment
(function() {
  if (CONFIG.ui.isMobile) {
    const viewport = document.querySelector("meta[name=viewport]");
    if (viewport) {
      viewport.content = "width=device-width, initial-scale=0.75, maximum-scale=0.75, user-scalable=no";
    }
  }
})();