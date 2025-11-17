const UploadManager = {
  currentCoordSystem: 'wgs84',
  uploadedLayers: [],
  layerCounter: 0,
  maxFileSize: 10 * 1024 * 1024,
  initialized: false,
  fileInput: null,
  isProcessing: false, // ✅ TAMBAHKAN FLAG PROCESSING

  escapeHTML: function(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  },

  checkMapReady: function() {
    if (typeof map === 'undefined' || !map) {
      throw new Error('Map belum siap. Pastikan Leaflet map sudah diinisialisasi.');
    }
  },

  init: function() {
    if (this.initialized) {
      console.warn('⚠️ UploadManager already initialized');
      return;
    }

    this.setupDragDrop();
    this.defineProjections();
    this.initialized = true;
    console.log('✅ UploadManager initialized');
  },

  defineProjections: function() {
    if (typeof proj4 === 'undefined') {
      console.error('❌ proj4 library not loaded');
      return;
    }

    proj4.defs("EPSG:23837", "+proj=tmerc +lat_0=0 +lon_0=115.5 +k=0.9999 +x_0=200000 +y_0=1500000 +ellps=WGS84 +units=m +no_defs");
    proj4.defs("EPSG:23838", "+proj=tmerc +lat_0=0 +lon_0=118.5 +k=0.9999 +x_0=200000 +y_0=1500000 +ellps=WGS84 +units=m +no_defs");
    console.log('✅ Coordinate systems defined');
  },

  setupDragDrop: function() {
    const uploadZone = document.getElementById('upload-zone');
    
    if (!uploadZone) {
      console.warn('⚠️ Upload zone element not found');
      return;
    }

    // ✅ HAPUS SEMUA INPUT FILE YANG ADA DI HTML
    const existingInputs = uploadZone.querySelectorAll('input[type="file"]');
    existingInputs.forEach(input => {
      console.warn('⚠️ Removing existing file input from HTML');
      input.remove();
    });

    // ✅ BUAT FILE INPUT BARU (HIDDEN, DI LUAR UPLOAD ZONE)
    if (!this.fileInput) {
      this.fileInput = document.createElement('input');
      this.fileInput.type = 'file';
      this.fileInput.accept = '.zip,.dxf,.geojson,.json';
      this.fileInput.style.display = 'none';
      this.fileInput.id = 'hidden-file-input';
      
      // ✅ EVENT HANDLER YANG AMAN
      this.fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && !this.isProcessing) {
          console.log('📁 File selected:', file.name);
          this.handleFile(file);
        }
        // ✅ RESET VALUE SETELAH DELAY (PREVENT DOUBLE TRIGGER)
        setTimeout(() => {
          this.fileInput.value = '';
        }, 100);
      });
      
      // ✅ APPEND KE BODY, BUKAN KE UPLOAD ZONE
      document.body.appendChild(this.fileInput);
    }

    // ✅ DRAG & DROP EVENTS
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.classList.remove('dragover');
      
      if (this.isProcessing) {
        console.warn('⚠️ Already processing a file');
        return;
      }
      
      const file = e.dataTransfer.files[0];
      if (file) {
        console.log('📁 File dropped:', file.name);
        this.handleFile(file);
      }
    });

    // ✅ CLICK EVENT (TRIGGER FILE INPUT)
    uploadZone.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (this.isProcessing) {
        console.warn('⚠️ Already processing a file');
        return;
      }
      
      console.log('🖱️ Upload zone clicked, opening file dialog');
      this.fileInput.click();
    });

    console.log('✅ Drag & Drop setup complete');
  },

  togglePanel: function() {
    const panel = document.getElementById('upload-panel');
    const toggle = document.getElementById('upload-toggle');
    
    if (panel) panel.classList.toggle('collapsed');
    if (toggle) toggle.classList.toggle('collapsed');
  },

  selectCoordSystem: function(system) {
    const validSystems = ['wgs84', 'tm3-501', 'tm3-502'];
    
    if (!validSystems.includes(system)) {
      console.error('❌ Invalid coordinate system:', system);
      return;
    }

    this.currentCoordSystem = system;
    
    document.querySelectorAll('.coord-option').forEach((el) => {
      el.classList.remove('active');
    });
    
    const selectedEl = document.getElementById('coord-' + system);
    if (selectedEl) {
      selectedEl.classList.add('active');
    }
    
    console.log('📍 Coordinate system:', system);
  },

  handleFile: async function(file) {
    if (!file) return;

    // ✅ PREVENT MULTIPLE SIMULTANEOUS UPLOADS
    if (this.isProcessing) {
      console.warn('⚠️ Already processing a file, please wait');
      this.showStatus('warning', '⏳ Sedang memproses file sebelumnya...');
      return;
    }

    this.isProcessing = true; // ✅ SET FLAG

    if (file.size > this.maxFileSize) {
      this.showStatus('error', `❌ File terlalu besar! Max: ${(this.maxFileSize / 1024 / 1024).toFixed(0)} MB`);
      this.isProcessing = false;
      return;
    }

    if (file.size === 0) {
      this.showStatus('error', '❌ File kosong!');
      this.isProcessing = false;
      return;
    }

    const fileName = file.name.toLowerCase();
    const fileExt = fileName.split('.').pop();

    const validExtensions = ['zip', 'dxf', 'geojson', 'json'];
    if (!validExtensions.includes(fileExt)) {
      this.showStatus('error', '❌ Format tidak didukung! Gunakan: .zip (SHP), .dxf, atau .geojson');
      this.isProcessing = false;
      return;
    }

    this.showStatus('info', '⏳ Memproses file...');

    try {
      let geoJSON = null;

      if (fileExt === 'zip') {
        geoJSON = await this.parseShapefile(file);
      } else if (fileExt === 'dxf') {
        geoJSON = await this.parseDXF(file);
      } else if (fileExt === 'geojson' || fileExt === 'json') {
        geoJSON = await this.parseGeoJSON(file);
      }

      if (geoJSON && geoJSON.features && geoJSON.features.length > 0) {
        this.addLayerToMap(geoJSON, file.name);
        this.showStatus('success', `✅ "${file.name}" berhasil diupload!`);
      } else {
        this.showStatus('error', '❌ File tidak mengandung data geometri yang valid');
      }

    } catch (error) {
      console.error('Upload error:', error);
      this.showStatus('error', `❌ ${error.message}`);
    } finally {
      // ✅ RESET FLAG SETELAH SELESAI
      this.isProcessing = false;
    }
  },

  parseShapefile: async function(file) {
    if (typeof shp === 'undefined') {
      throw new Error('Shapefile library (shpjs) tidak ditemukan');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          const geojson = await shp(arrayBuffer);
          
          if (Array.isArray(geojson)) {
            const allFeatures = geojson.flatMap(layer => 
              layer.features || []
            );
            
            const combined = {
              type: 'FeatureCollection',
              features: allFeatures
            };
            
            const transformed = this.transformGeoJSON(combined);
            resolve(transformed);
          } else {
            const transformed = this.transformGeoJSON(geojson);
            resolve(transformed);
          }
        } catch (error) {
          reject(new Error('Gagal membaca Shapefile: ' + error.message));
        }
      };

      reader.onerror = () => {
        reject(new Error('Gagal membaca file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  },

  parseDXF: async function(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const dxfString = e.target.result;
          const geojson = this.simpleDXFParser(dxfString);
          const transformed = this.transformGeoJSON(geojson);
          resolve(transformed);
        } catch (error) {
          reject(new Error('Gagal membaca DXF: ' + error.message));
        }
      };

      reader.onerror = () => {
        reject(new Error('Gagal membaca file'));
      };
      
      reader.readAsText(file);
    });
  },

  simpleDXFParser: function(dxfText) {
    const features = [];
    const lines = dxfText.split('\n').map(l => l.trim());

    let currentEntity = null;
    let vertices = [];
    let layer = 'Default';
    let isClosed = false;

    for (let i = 0; i < lines.length - 1; i++) {
      const code = lines[i];
      const value = lines[i + 1];

      if (code === '0') {
        if (currentEntity === 'LWPOLYLINE' && vertices.length >= 2) {
          const coordinates = vertices.slice();

          if (isClosed && coordinates.length > 2) {
            const first = coordinates[0];
            const last = coordinates[coordinates.length - 1];
            
            if (first[0] !== last[0] || first[1] !== last[1]) {
              coordinates.push([first[0], first[1]]);
            }

            features.push({
              type: 'Feature',
              properties: { layer: layer },
              geometry: {
                type: 'Polygon',
                coordinates: [coordinates]
              }
            });
          } else {
            features.push({
              type: 'Feature',
              properties: { layer: layer },
              geometry: {
                type: 'LineString',
                coordinates: coordinates
              }
            });
          }
        }

        currentEntity = value;
        vertices = [];
        isClosed = false;
      }

      if (code === '8') {
        layer = value || 'Default';
      }

      if (code === '70' && currentEntity === 'LWPOLYLINE') {
        const flags = parseInt(value);
        isClosed = (flags & 1) === 1;
      }

      if (code === '10' && currentEntity === 'LWPOLYLINE') {
        const x = parseFloat(value);
        const yIndex = i + 3;
        
        if (yIndex < lines.length) {
          const y = parseFloat(lines[yIndex]);
          
          if (!isNaN(x) && !isNaN(y)) {
            vertices.push([x, y]);
          }
        }
      }

      if (currentEntity === 'LINE') {
        if (code === '10') {
          const x1 = parseFloat(value);
          const y1Index = i + 2;
          const x2Index = i + 4;
          const y2Index = i + 6;
          
          if (y2Index < lines.length) {
            const y1 = parseFloat(lines[y1Index]);
            const x2 = parseFloat(lines[x2Index]);
            const y2 = parseFloat(lines[y2Index]);
            
            if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2)) {
              features.push({
                type: 'Feature',
                properties: { layer: layer },
                geometry: {
                  type: 'LineString',
                  coordinates: [[x1, y1], [x2, y2]]
                }
              });
            }
          }
        }
      }
    }

    console.log(`📄 Parsed ${features.length} features from DXF`);

    if (features.length === 0) {
      throw new Error('Tidak ada geometri valid ditemukan. Pastikan DXF mengandung LWPOLYLINE atau LINE.');
    }

    return {
      type: 'FeatureCollection',
      features: features
    };
  },

  parseGeoJSON: async function(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const geojson = JSON.parse(e.target.result);
          
          if (!geojson.type) {
            throw new Error('Format GeoJSON tidak valid: missing type');
          }
          
          if (geojson.type === 'FeatureCollection' && !Array.isArray(geojson.features)) {
            throw new Error('Format GeoJSON tidak valid: features harus array');
          }
          
          const transformed = this.transformGeoJSON(geojson);
          resolve(transformed);
        } catch (error) {
          reject(new Error('Format GeoJSON tidak valid: ' + error.message));
        }
      };

      reader.onerror = () => {
        reject(new Error('Gagal membaca file'));
      };
      
      reader.readAsText(file);
    });
  },

  transformGeoJSON: function(geojson) {
    if (this.currentCoordSystem === 'wgs84') {
      return geojson;
    }

    if (typeof proj4 === 'undefined') {
      console.warn('⚠️ proj4 not loaded, skipping transformation');
      return geojson;
    }

    let sourceEPSG;
    if (this.currentCoordSystem === 'tm3-501') {
      sourceEPSG = 'EPSG:23837';
    } else if (this.currentCoordSystem === 'tm3-502') {
      sourceEPSG = 'EPSG:23838';
    } else {
      return geojson;
    }

    const targetEPSG = 'EPSG:4326';
    
    let transformed;
    try {
      transformed = typeof structuredClone !== 'undefined' 
        ? structuredClone(geojson)
        : JSON.parse(JSON.stringify(geojson));
    } catch (e) {
      console.warn('Clone failed, using original object');
      transformed = JSON.parse(JSON.stringify(geojson));
    }

    const transformCoords = (coords) => {
      if (typeof coords[0] === 'number') {
        try {
          return proj4(sourceEPSG, targetEPSG, coords);
        } catch (e) {
          console.warn('Transform failed for coords:', coords);
          return coords;
        }
      } else {
        return coords.map(c => transformCoords(c));
      }
    };

    const features = transformed.type === 'FeatureCollection' 
      ? transformed.features 
      : [transformed];

    features.forEach((feature) => {
      if (feature && feature.geometry && feature.geometry.coordinates) {
        feature.geometry.coordinates = transformCoords(feature.geometry.coordinates);
      }
    });

    console.log(`✅ Transformed from ${sourceEPSG} to ${targetEPSG}`);
    return transformed;
  },

  addLayerToMap: function(geojson, fileName) {
    this.checkMapReady();

    this.layerCounter++;
    const layerId = 'uploaded-' + this.layerCounter;

    const featureCount = geojson.type === 'FeatureCollection' 
      ? geojson.features.length 
      : 1;

    const leafletLayer = L.geoJSON(geojson, {
      style: {
        color: '#FF6B6B',
        weight: 3,
        opacity: 0.8,
        fillColor: '#FF6B6B',
        fillOpacity: 0.3
      },
      pointToLayer: (feature, latlng) => {
        return L.circleMarker(latlng, {
          radius: 6,
          fillColor: '#FF6B6B',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        });
      },
      onEachFeature: (feature, layer) => {
        let popupContent = `<div style="max-width: 200px;"><strong>📍 ${this.escapeHTML(fileName)}</strong><br>`;
        
        if (feature.properties && Object.keys(feature.properties).length > 0) {
          for (let key in feature.properties) {
            if (feature.properties.hasOwnProperty(key)) {
              const escapedKey = this.escapeHTML(key);
              const escapedValue = this.escapeHTML(feature.properties[key]);
              popupContent += `<strong>${escapedKey}:</strong> ${escapedValue}<br>`;
            }
          }
        } else {
          popupContent += '<em>Tidak ada atribut</em><br>';
        }
        
        popupContent += '</div>';
        layer.bindPopup(popupContent);
      }
    }).addTo(map);

    this.uploadedLayers.push({
      id: layerId,
      name: fileName,
      layer: leafletLayer,
      featureCount: featureCount,
      visible: true,
      geojson: geojson
    });

    try {
      const bounds = leafletLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { 
          padding: [50, 50],
          maxZoom: 16
        });
      }
    } catch (e) {
      console.warn('Could not fit bounds:', e);
    }

    this.updateLayersList();
  },

  updateLayersList: function() {
    const container = document.getElementById('uploaded-layers');
    const list = document.getElementById('uploaded-layers-list');

    if (!container || !list) {
      console.warn('⚠️ Layer list elements not found');
      return;
    }

    if (this.uploadedLayers.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    list.innerHTML = '';

    this.uploadedLayers.forEach((layerInfo, index) => {
      const item = document.createElement('div');
      item.className = 'uploaded-layer-item';
      if (layerInfo.visible) item.classList.add('active');
      
      const escapedName = this.escapeHTML(layerInfo.name);
      
      item.innerHTML = `
        <div class="layer-icon">📄</div>
        <div class="layer-info">
          <div class="layer-name" title="${escapedName}">${escapedName}</div>
          <div class="layer-meta">${layerInfo.featureCount} fitur</div>
        </div>
        <div class="layer-actions">
          <button class="layer-action-btn toggle ${layerInfo.visible ? 'active' : ''}" 
                  onclick="UploadManager.toggleLayer(${index})" 
                  title="Show/Hide">
            ${layerInfo.visible ? '👁️' : '👁️‍🗨️'}
          </button>
          <button class="layer-action-btn delete" 
                  onclick="UploadManager.deleteLayer(${index})" 
                  title="Hapus">
            🗑️
          </button>
        </div>
      `;

      list.appendChild(item);
    });
  },

  toggleLayer: function(index) {
    const layerInfo = this.uploadedLayers[index];
    
    if (!layerInfo) {
      console.error('Layer not found at index:', index);
      return;
    }
    
    try {
      if (layerInfo.visible) {
        map.removeLayer(layerInfo.layer);
        layerInfo.visible = false;
      } else {
        map.addLayer(layerInfo.layer);
        layerInfo.visible = true;
      }

      this.updateLayersList();
    } catch (e) {
      console.error('Error toggling layer:', e);
      this.showStatus('error', '❌ Gagal toggle layer');
    }
  },

  deleteLayer: function(index) {
    const layerInfo = this.uploadedLayers[index];
    
    if (!layerInfo) {
      console.error('Layer not found at index:', index);
      return;
    }

    if (!confirm(`Hapus layer "${layerInfo.name}"?`)) return;

    try {
      if (layerInfo.visible && layerInfo.layer) {
        map.removeLayer(layerInfo.layer);
      }
      
      if (layerInfo.layer) {
        layerInfo.layer.remove();
        layerInfo.layer.clearLayers();
        layerInfo.layer = null;
      }
      
      layerInfo.geojson = null;

      this.uploadedLayers.splice(index, 1);
      this.updateLayersList();
      
      this.showStatus('success', '✅ Layer dihapus');
    } catch (e) {
      console.error('Error deleting layer:', e);
      this.showStatus('error', '❌ Gagal menghapus layer');
    }
  },

  clearAllLayers: function() {
    if (this.uploadedLayers.length === 0) return;
    
    if (!confirm(`Hapus semua ${this.uploadedLayers.length} layer?`)) return;

    this.uploadedLayers.forEach(layerInfo => {
      if (layerInfo.layer) {
        map.removeLayer(layerInfo.layer);
        layerInfo.layer.remove();
        layerInfo.layer.clearLayers();
      }
    });

    this.uploadedLayers = [];
    this.updateLayersList();
    this.showStatus('success', '✅ Semua layer dihapus');
  },

  showStatus: function(type, message) {
    const statusEl = document.getElementById('upload-status');
    
    if (!statusEl) {
      console.warn('⚠️ Status element not found');
      console.log(`[${type.toUpperCase()}]`, message);
      return;
    }

    statusEl.className = 'upload-status ' + type;
    statusEl.textContent = message;
    statusEl.style.display = 'block';

    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 5000);
  }
};

window.UploadManager = UploadManager;

// ✅ INITIALIZE ONLY ONCE
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    try {
      UploadManager.init();
    } catch (e) {
      console.error('❌ UploadManager initialization failed:', e);
    }
  });
} else {
  try {
    UploadManager.init();
  } catch (e) {
    console.error('❌ UploadManager initialization failed:', e);
  }
}