const ControlsManager = {
  isLayerControlExpanded: false,
  isBasemapControlExpanded: false,
  currentBasemap: 'osm',
  basemapLayers: {},
  locationMarker: null,
  locationCircle: null,

  init(map) {
    this.map = map;
    this.createBasemaps();
    this.createLayerControl();
    this.createBasemapControl();
    this.createGeolocationControl();
    this.createLegend();
    this.createInfoBox();
    this.createScaleControl();
    this.initLocationModal();
  },

  createBasemaps() {
    this.basemapLayers.osm = L.tileLayer(CONFIG.basemaps.osm.url, {
      maxZoom: CONFIG.map.maxZoom,
      maxNativeZoom: CONFIG.basemaps.osm.maxZoom,
      attribution: CONFIG.basemaps.osm.attribution,
      zIndex: 1
    }).addTo(this.map);

    this.basemapLayers.google = L.tileLayer(CONFIG.basemaps.google.url, {
      maxZoom: CONFIG.basemaps.google.maxZoom,
      attribution: CONFIG.basemaps.google.attribution,
      zIndex: 1
    });

    this.basemapLayers.satellite = L.tileLayer(CONFIG.basemaps.satellite.url, {
      maxZoom: CONFIG.basemaps.satellite.maxZoom,
      attribution: CONFIG.basemaps.satellite.attribution,
      zIndex: 1
    });
  },

  createLayerControl() {
    const LayerControl = L.Control.extend({
      options: { position: 'topleft' },
      onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-control custom-layer-control');
        container.innerHTML = `
          <div class="layer-control-header" onclick="ControlsManager.toggleLayerControl()">
            <span>🗂️ Layer</span>
            <span class="toggle-icon" id="layer-toggle-icon">▼</span>
          </div>
          <div class="layer-control-body" id="layer-control-body">
            
            <div class="layer-item active" id="layer-bhumi">
              <div class="layer-item-header" onclick="ControlsManager.toggleLayerItem('bhumi')">
                <input type="checkbox" class="layer-checkbox" id="check-bhumi" checked onclick="event.stopPropagation(); ControlsManager.toggleLayerItem('bhumi')">
                <span class="layer-name">📍 Persil Tanah</span>
              </div>
              <div class="layer-opacity">
                <div class="opacity-slider-container">
                  <label>Opacity:</label>
                  <input type="range" id="opacity-bhumi" min="0" max="100" value="80" oninput="ControlsManager.updateOpacity('bhumi', this.value)">
                  <span class="opacity-value" id="value-bhumi">80%</span>
                </div>
              </div>
            </div>

            <div class="layer-item" id="layer-rtrw">
              <div class="layer-item-header" onclick="ControlsManager.toggleLayerItem('rtrw')">
                <input type="checkbox" class="layer-checkbox" id="check-rtrw" onclick="event.stopPropagation(); ControlsManager.toggleLayerItem('rtrw')">
                <span class="layer-name">🏛️ RTRW</span>
              </div>
              <div class="layer-opacity">
                <div class="opacity-slider-container">
                  <label>Opacity:</label>
                  <input type="range" id="opacity-rtrw" min="0" max="100" value="60" oninput="ControlsManager.updateOpacity('rtrw', this.value)">
                  <span class="opacity-value" id="value-rtrw">60%</span>
                </div>
              </div>
            </div>

            <div class="layer-item" id="layer-rdtr">
              <div class="layer-item-header" onclick="ControlsManager.toggleLayerItem('rdtr')">
                <input type="checkbox" class="layer-checkbox" id="check-rdtr" onclick="event.stopPropagation(); ControlsManager.toggleLayerItem('rdtr')">
                <span class="layer-name">🏙️ RDTR dan Hutan</span>
              </div>
              <div class="layer-opacity">
                <div class="opacity-slider-container">
                  <label>Opacity:</label>
                  <input type="range" id="opacity-rdtr" min="0" max="100" value="60" oninput="ControlsManager.updateOpacity('rdtr', this.value)">
                  <span class="opacity-value" id="value-rdtr">60%</span>
                </div>
              </div>
            </div>

            <div class="layer-item" id="layer-hutan">
              <div class="layer-item-header" onclick="ControlsManager.toggleLayerItem('hutan')">
                <input type="checkbox" class="layer-checkbox" id="check-hutan" onclick="event.stopPropagation(); ControlsManager.toggleLayerItem('hutan')">
                <span class="layer-name">🌲 Kawasan Hutan KLHK</span>
              </div>
              <div class="layer-opacity">
                <div class="opacity-slider-container">
                  <label>Opacity:</label>
                  <input type="range" id="opacity-hutan" min="0" max="100" value="60" oninput="ControlsManager.updateOpacity('hutan', this.value)">
                  <span class="opacity-value" id="value-hutan">60%</span>
                </div>
              </div>
            </div>

            <div class="layer-item" id="layer-sawah">
              <div class="layer-item-header" onclick="ControlsManager.toggleLayerItem('sawah')">
                <input type="checkbox" class="layer-checkbox" id="check-sawah" onclick="event.stopPropagation(); ControlsManager.toggleLayerItem('sawah')">
                <span class="layer-name">🌾 Lahan Sawah Dilindungi</span>
              </div>
              <div class="layer-opacity">
                <div class="opacity-slider-container">
                  <label>Opacity:</label>
                  <input type="range" id="opacity-sawah" min="0" max="100" value="60" oninput="ControlsManager.updateOpacity('sawah', this.value)">
                  <span class="opacity-value" id="value-sawah">60%</span>
                </div>
              </div>
            </div>

            <div class="layer-item" id="layer-kelerengan">
              <div class="layer-item-header" onclick="ControlsManager.toggleLayerItem('kelerengan')">
                <input type="checkbox" class="layer-checkbox" id="check-kelerengan" onclick="event.stopPropagation(); ControlsManager.toggleLayerItem('kelerengan')">
                <span class="layer-name">⛰️ Kelerengan</span>
              </div>
              <div class="layer-opacity">
                <div class="opacity-slider-container">
                  <label>Opacity:</label>
                  <input type="range" id="opacity-kelerengan" min="0" max="100" value="60" oninput="ControlsManager.updateOpacity('kelerengan', this.value)">
                  <span class="opacity-value" id="value-kelerengan">60%</span>
                </div>
              </div>
            </div>

          </div>
        `;
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);
        return container;
      }
    });

    new LayerControl().addTo(this.map);
  },

  createBasemapControl() {
    const BasemapControl = L.Control.extend({
      options: { position: 'topleft' },
      onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-control basemap-control');
        container.innerHTML = `
          <div class="basemap-control-header" onclick="ControlsManager.toggleBasemapControl()">
            <span>🗺️ Peta Dasar</span>
            <span class="toggle-icon" id="basemap-toggle-icon">▼</span>
          </div>
          <div class="basemap-control-body" id="basemap-control-body">
            
            <div class="basemap-item active" id="basemap-osm" onclick="ControlsManager.switchBasemap('osm')">
              <input type="radio" name="basemap" id="radio-osm" checked>
              <label for="radio-osm">🗺️ OpenStreetMap</label>
            </div>

            <div class="basemap-item" id="basemap-google" onclick="ControlsManager.switchBasemap('google')">
              <input type="radio" name="basemap" id="radio-google">
              <label for="radio-google">🛰️ Google Satellite</label>
            </div>

            <div class="basemap-item" id="basemap-satellite" onclick="ControlsManager.switchBasemap('satellite')">
              <input type="radio" name="basemap" id="radio-satellite">
              <label for="radio-satellite">🛰️ Esri Satellite</label>
            </div>

          </div>
        `;
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);
        return container;
      }
    });

    new BasemapControl().addTo(this.map);
  },

  createGeolocationControl() {
    const LocateControl = L.Control.extend({
      options: { position: 'topleft' },
      onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-locate');
        const link = L.DomUtil.create('a', '', container);
        link.href = '#';
        link.title = 'Lokasi Saya';
        link.innerHTML = '📍';
        link.id = 'locate-btn';
        L.DomEvent.on(link, 'click', function(e) {
          L.DomEvent.preventDefault(e);
          L.DomEvent.stopPropagation(e);
          ControlsManager.getLocation();
        });
        return container;
      }
    });

    new LocateControl().addTo(this.map);
  },

  createLegend() {
    const legend = L.control({ position: "bottomright" });
    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "legend-wms");
      div.innerHTML = `
        <h4>📋 Legenda</h4>
        <img src="${CONFIG.legend.bhumi.url}" alt="Legenda" onerror="this.style.display='none'">
      `;
      return div;
    };
    legend.addTo(this.map);
  },

  createInfoBox() {
    const infoBox = L.control({ position: "bottomleft" });
    infoBox.onAdd = function () {
      const div = L.DomUtil.create("div", "info-box");
      div.id = 'info-box-content';
      div.innerHTML = `
        <strong>📊 Info Peta</strong>
        <div class="info-item">📍 <span id="coords">-</span></div>
        <div class="info-item">🔍 Zoom: <span id="zoom-level">${CONFIG.map.zoom}</span></div>
        <div class="info-item" style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #ddd;">💡 Klik peta untuk info detail</div>
      `;
      return div;
    };
    infoBox.addTo(this.map);

    this.map.on('mousemove', (e) => {
      const coordsEl = document.getElementById('coords');
      if (coordsEl) {
        coordsEl.textContent = `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`;
      }
    });

    this.map.on('zoomend', () => {
      const zoomEl = document.getElementById('zoom-level');
      if (zoomEl) {
        zoomEl.textContent = this.map.getZoom();
      }
    });
  },

  createScaleControl() {
    L.control.scale({
      metric: true,
      imperial: false,
      position: 'bottomleft',
      maxWidth: CONFIG.ui.isMobile ? 100 : 150
    }).addTo(this.map);
  },

  toggleLayerControl() {
    this.isLayerControlExpanded = !this.isLayerControlExpanded;
    const body = document.getElementById('layer-control-body');
    const icon = document.getElementById('layer-toggle-icon');
    
    if (this.isLayerControlExpanded) {
      body.classList.add('expanded');
      icon.classList.add('expanded');
    } else {
      body.classList.remove('expanded');
      icon.classList.remove('expanded');
    }
  },

  toggleBasemapControl() {
    this.isBasemapControlExpanded = !this.isBasemapControlExpanded;
    const body = document.getElementById('basemap-control-body');
    const icon = document.getElementById('basemap-toggle-icon');
    
    if (this.isBasemapControlExpanded) {
      body.classList.add('expanded');
      icon.classList.add('expanded');
    } else {
      body.classList.remove('expanded');
      icon.classList.remove('expanded');
    }
  },

  toggleLayerItem(layerName) {
    console.log('🔍 toggleLayerItem called:', layerName);
    
    const checkbox = document.getElementById('check-' + layerName);
    const layerItem = document.getElementById('layer-' + layerName);
    
    // ← TAMBAHKAN VALIDASI
    if (!checkbox) {
      console.error('❌ Checkbox not found: check-' + layerName);
      return;
    }
    
    if (!layerItem) {
      console.error('❌ Layer item not found: layer-' + layerName);
      return;
    }
    
    // Toggle checkbox if not clicked directly
    if (event && event.target.type !== 'checkbox') {
      checkbox.checked = !checkbox.checked;
    }
    
    const isActive = checkbox.checked;
    
    // Update UI
    if (isActive) {
      layerItem.classList.add('active');
    } else {
      layerItem.classList.remove('active');
    }
    
    console.log('✅ Layer toggled:', layerName, isActive ? 'ON' : 'OFF');
    
    // Update layer
    if (typeof LayerManager !== 'undefined' && LayerManager.toggle) {
      LayerManager.toggle(layerName);
    } else {
      console.error('❌ LayerManager not available');
    }
  },

  updateOpacity(layerName, value) {
    const valueEl = document.getElementById('value-' + layerName);
    if (valueEl) {
      valueEl.textContent = value + '%';
    }
    
    if (typeof LayerManager !== 'undefined' && LayerManager.setOpacity) {
      LayerManager.setOpacity(layerName, value);
    }
  },

  switchBasemap(basemapName) {
    console.log('🔍 switchBasemap called:', basemapName);
    
    // Update UI
    ['osm', 'google', 'satellite'].forEach(name => {
      const item = document.getElementById('basemap-' + name);
      const radio = document.getElementById('radio-' + name);
      
      if (item && radio) {
        if (name === basemapName) {
          item.classList.add('active');
          radio.checked = true;
        } else {
          item.classList.remove('active');
          radio.checked = false;
        }
      }
    });

    // Remove current basemap
    if (this.basemapLayers[this.currentBasemap]) {
      this.map.removeLayer(this.basemapLayers[this.currentBasemap]);
    }

    // Add new basemap
    if (this.basemapLayers[basemapName]) {
      this.basemapLayers[basemapName].addTo(this.map);
      this.basemapLayers[basemapName].setZIndex(1);
    }

    this.currentBasemap = basemapName;

    // Ensure other layers maintain proper z-index
    if (LayerManager && LayerManager.layers && LayerManager.layers.bhumi) {
      if (this.map.hasLayer(LayerManager.layers.bhumi)) {
        LayerManager.layers.bhumi.setZIndex(CONFIG.wms.bhumi.zIndex);
      }
    }
  },

  getLocation() {
    const btn = document.getElementById('locate-btn');
    
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung oleh browser Anda');
      return;
    }

    if (btn) btn.classList.add('loading');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        if (this.locationMarker) this.map.removeLayer(this.locationMarker);
        if (this.locationCircle) this.map.removeLayer(this.locationCircle);

        const locationIcon = L.divIcon({
          className: 'location-marker',
          html: '<div class="location-pulse"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        this.locationMarker = L.marker([lat, lng], { 
          icon: locationIcon, 
          zIndex: 1000 
        }).addTo(this.map);

        this.locationCircle = L.circle([lat, lng], {
          radius: accuracy,
          color: '#4285f4',
          fillColor: '#4285f4',
          fillOpacity: 0.15,
          weight: 2,
          zIndex: 999
        }).addTo(this.map);

        this.map.setView([lat, lng], 16);

        this.locationMarker.bindPopup(`
          <div style="text-align: center;">
            <strong>📍 Lokasi Anda</strong><br>
            <small>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}<br>Akurasi: ±${Math.round(accuracy)}m</small>
          </div>
        `).openPopup();

        if (btn) {
          btn.classList.remove('loading');
          btn.classList.add('active');
          setTimeout(() => btn.classList.remove('active'), 3000);
        }
      },
      (error) => {
        if (btn) btn.classList.remove('loading');
        let errorMsg = 'Error mendapatkan lokasi';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Izin akses lokasi ditolak';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Informasi lokasi tidak tersedia';
            break;
          case error.TIMEOUT:
            errorMsg = 'Waktu permintaan lokasi habis';
            break;
        }
        
        alert(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  },

  initLocationModal() {
    const modal = document.getElementById('location-modal');
    const btnDismiss = document.getElementById('btn-dismiss-location');
    const btnRequest = document.getElementById('btn-request-location');

    if (btnDismiss) {
      btnDismiss.addEventListener('click', () => {
        if (modal) modal.classList.add('hidden');
        localStorage.setItem('locationPermissionAsked', 'true');
      });
    }

    if (btnRequest) {
      btnRequest.addEventListener('click', () => {
        if (modal) modal.classList.add('hidden');
        localStorage.setItem('locationPermissionAsked', 'true');
        this.getLocation();
      });
    }

    if (CONFIG.ui.isMobile && !localStorage.getItem('locationPermissionAsked')) {
      setTimeout(() => {
        if (modal) modal.classList.remove('hidden');
      }, 1000);
    }
  }
};

window.ControlsManager = ControlsManager;