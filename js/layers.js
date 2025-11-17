const LayerManager = {
  // Layer objects
  layers: {
    bhumi: null,
    rtrw: null,
    rdtr: null,
    hutan: null,
    sawah: null,
    kelerengan: null
  },

  // Layer groups for GeoJSON
  layerGroups: {
    rtrw: null,
    rdtr: null,
    sawah: null,
    kelerengan: null
  },

  // Active state
  active: {
    bhumi: true,
    rtrw: false,
    rdtr: false,
    hutan: false,
    sawah: false,
    kelerengan: false
  },

  // Initialize all layers
  async init(map) {
    this.map = map;
    
    // Initialize layer groups
    this.layerGroups.rtrw = L.layerGroup();
    this.layerGroups.rdtr = L.layerGroup();
    this.layerGroups.sawah = L.layerGroup();
    this.layerGroups.kelerengan = L.layerGroup();

    // Create WMS layers
    this.createWMSLayers();
    
    // Load GeoJSON layers
    await this.loadAllGeoJSON();
    
    // Add default active layers
    this.updateLayerVisibility();
  },

  // Create WMS layers
  createWMSLayers() {
    // BHUMI WMS Layer
    this.layers.bhumi = L.tileLayer.wms(CONFIG.wms.bhumi.url, {
      layers: CONFIG.wms.bhumi.layers,
      format: CONFIG.wms.bhumi.format,
      transparent: CONFIG.wms.bhumi.transparent,
      version: CONFIG.wms.bhumi.version,
      crs: L.CRS.EPSG3857,
      maxZoom: CONFIG.map.maxZoom,
      opacity: CONFIG.wms.bhumi.opacity,
      zIndex: CONFIG.wms.bhumi.zIndex
    });

    // Hutan Tile Layer
    this.layers.hutan = L.tileLayer(CONFIG.external.hutan.url, {
      maxZoom: CONFIG.map.maxZoom,
      opacity: CONFIG.external.hutan.opacity,
      zIndex: CONFIG.external.hutan.zIndex
    });
  },

  // Load all GeoJSON
  async loadAllGeoJSON() {
    const startTime = Date.now();

    try {
      // Load RTRW
      Utils.updateLoadingProgress('Memuat data RTRW...');
      await this.loadGeoJSON('rtrw', CONFIG.geojson.rtrw);

      // Load RDTR
      Utils.updateLoadingProgress('Memuat data RDTR...');
      await this.loadGeoJSON('rdtr', CONFIG.geojson.rdtr);

      // Load Sawah
      Utils.updateLoadingProgress('Memuat data Lahan Sawah...');
      await this.loadGeoJSON('sawah', CONFIG.geojson.sawah);

      // Load Kelerengan
      Utils.updateLoadingProgress('Memuat data Kelerengan...');
      await this.loadGeoJSON('kelerengan', CONFIG.geojson.kelerengan);

      // Ensure minimum display time
      Utils.updateLoadingProgress('Menyelesaikan...');
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, CONFIG.ui.splashMinDuration - elapsedTime);

      setTimeout(() => {
        Utils.updateLoadingProgress('Selesai! Selamat datang 🎉');
        setTimeout(() => {
          Utils.hideLoading();
        }, 500);
      }, remainingTime);

    } catch (error) {
      console.error('Error loading layers:', error);
      Utils.updateLoadingProgress('Error: ' + error.message);
      setTimeout(() => {
        Utils.hideLoading();
      }, 2000);
    }
  },

  // Load individual GeoJSON
  async loadGeoJSON(name, config) {
    try {
      const response = await fetch(config.file);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ ${name.toUpperCase()} loaded:`, data.features.length, 'features');

      const geoJSONLayer = L.geoJSON(data, {
        style: (feature) => this.getStyle(name, feature, config),
        onEachFeature: (feature, layer) => this.onEachFeature(name, feature, layer)
      });

      geoJSONLayer.addTo(this.layerGroups[name]);
      this.layers[name] = geoJSONLayer;

      return true;
    } catch (error) {
      console.error(`Error loading ${name}:`, error);
      return false;
    }
  },

  // Get style for feature
  getStyle(layerName, feature, config) {
    const color = Utils.getColor(feature.properties) || config.defaultColor || config.color;
    
    return {
      fillColor: color,
      weight: 1,
      opacity: 1,
      color: layerName === 'sawah' ? '#689F38' : 'white',
      fillOpacity: config.opacity
    };
  },

  // On each feature handler
  onEachFeature(layerName, feature, layer) {
  layer.on('click', (e) => {
    L.DomEvent.stopPropagation(e);
      switch(layerName) {
      case 'rtrw':
        DrawerManager.show('rtrw', feature, e.latlng);
        break;
      case 'rdtr':
        DrawerManager.show('rdtr', feature, e.latlng);
        break;
      case 'sawah':
        DrawerManager.show('sawah', feature, e.latlng);
        break;
      case 'kelerengan':
        DrawerManager.show('kelerengan', feature, e.latlng);
        break;
      }
    });
  },

  // Get hover color
  getHoverColor(layerName) {
    const colors = {
      rtrw: '#667eea',
      rdtr: '#f093fb',
      sawah: '#33691E',
      kelerengan: '#3E2723'
    };
    return colors[layerName] || '#667eea';
  },

  // Toggle layer
  toggle(layerName) {
    this.active[layerName] = !this.active[layerName];
    this.updateLayerVisibility();
    this.updateCursor();
  },

  // Update layer visibility
  updateLayerVisibility() {
    // BHUMI
    if (this.active.bhumi) {
      if (!this.map.hasLayer(this.layers.bhumi)) {
        this.layers.bhumi.addTo(this.map);
        this.layers.bhumi.setZIndex(CONFIG.wms.bhumi.zIndex);
      }
    } else {
      if (this.map.hasLayer(this.layers.bhumi)) {
        this.map.removeLayer(this.layers.bhumi);
      }
    }

    // RTRW
    if (this.active.rtrw) {
      if (!this.map.hasLayer(this.layerGroups.rtrw)) {
        this.layerGroups.rtrw.addTo(this.map);
        this.layerGroups.rtrw.setZIndex(CONFIG.geojson.rtrw.zIndex);
      }
    } else {
      if (this.map.hasLayer(this.layerGroups.rtrw)) {
        this.map.removeLayer(this.layerGroups.rtrw);
      }
    }

    // RDTR
    if (this.active.rdtr) {
      if (!this.map.hasLayer(this.layerGroups.rdtr)) {
        this.layerGroups.rdtr.addTo(this.map);
        this.layerGroups.rdtr.setZIndex(CONFIG.geojson.rdtr.zIndex);
      }
    } else {
      if (this.map.hasLayer(this.layerGroups.rdtr)) {
        this.map.removeLayer(this.layerGroups.rdtr);
      }
    }

    // Hutan
    if (this.active.hutan) {
      if (!this.map.hasLayer(this.layers.hutan)) {
        this.layers.hutan.addTo(this.map);
        this.layers.hutan.setZIndex(CONFIG.external.hutan.zIndex);
      }
    } else {
      if (this.map.hasLayer(this.layers.hutan)) {
        this.map.removeLayer(this.layers.hutan);
      }
    }

    // Sawah
    if (this.active.sawah) {
      if (!this.map.hasLayer(this.layerGroups.sawah)) {
        this.layerGroups.sawah.addTo(this.map);
        this.layerGroups.sawah.setZIndex(CONFIG.geojson.sawah.zIndex);
      }
    } else {
      if (this.map.hasLayer(this.layerGroups.sawah)) {
        this.map.removeLayer(this.layerGroups.sawah);
      }
    }

    // Kelerengan
    if (this.active.kelerengan) {
      if (!this.map.hasLayer(this.layerGroups.kelerengan)) {
        this.layerGroups.kelerengan.addTo(this.map);
        this.layerGroups.kelerengan.setZIndex(CONFIG.geojson.kelerengan.zIndex);
      }
    } else {
      if (this.map.hasLayer(this.layerGroups.kelerengan)) {
        this.map.removeLayer(this.layerGroups.kelerengan);
      }
    }
  },

  // Set opacity
  setOpacity(layerName, opacity) {
    const opacityValue = opacity / 100;

    if (layerName === 'bhumi' || layerName === 'hutan') {
      if (this.layers[layerName]) {
        this.layers[layerName].setOpacity(opacityValue);
      }
    } else {
      if (this.layerGroups[layerName]) {
        this.layerGroups[layerName].eachLayer((layer) => {
          if (layer.setStyle) {
            layer.setStyle({ fillOpacity: opacityValue });
          }
        });
      }
    }
  },

  // Update cursor
  updateCursor() {
    const hasActiveLayer = Object.values(this.active).some(val => val === true);
    const mapElement = document.getElementById('map');
    
    if (hasActiveLayer) {
      mapElement.classList.add('clickable');
    } else {
      mapElement.classList.remove('clickable');
    }
  }
};