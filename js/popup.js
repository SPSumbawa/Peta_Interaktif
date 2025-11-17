const PopupManager = {
  currentPopup: null,
  currentFeatures: [],
  currentIndex: 0,
  highlightLayer: null,
  isProcessing: false, // ← TAMBAH FLAG INI untuk prevent infinite loop

  // Close current popup
  close() {
    // ← PREVENT RE-ENTRY
    if (this.isClosing) {
      console.warn('⚠️ Already closing popup, skipping...');
      return;
    }

    this.isClosing = true;
    console.log('🔒 Closing popup...');

    try {
      // Close popup if exists
      if (this.currentPopup) {
        // ← REMOVE EVENT LISTENER SEBELUM CLOSE
        map.off('popupclose'); // Temporary remove listener
        
        if (map.hasLayer(this.currentPopup)) {
          map.closePopup(this.currentPopup);
        }
        this.currentPopup = null;
        
        // ← RE-ATTACH EVENT LISTENER
        setTimeout(() => {
          map.on('popupclose', function(e) {
            if (PopupManager.highlightLayer && map.hasLayer(PopupManager.highlightLayer)) {
              map.removeLayer(PopupManager.highlightLayer);
              PopupManager.highlightLayer = null;
            }
            PopupManager.currentFeatures = [];
            PopupManager.currentIndex = 0;
            PopupManager.currentPopup = null;
            PopupManager.isProcessing = false;
          });
        }, 100);
      }

      // Remove highlight
      if (this.highlightLayer && map.hasLayer(this.highlightLayer)) {
        map.removeLayer(this.highlightLayer);
        this.highlightLayer = null;
      }

      // Reset state
      this.currentFeatures = [];
      this.currentIndex = 0;
      this.isProcessing = false;

    } catch (error) {
      console.error('❌ Error closing popup:', error);
    } finally {
      this.isClosing = false;
      console.log('✅ Popup closed');
    }
  },


  // Highlight feature (TANPA trigger event)
  highlight(feature) {
    // Remove existing highlight
    if (this.highlightLayer && map.hasLayer(this.highlightLayer)) {
      map.removeLayer(this.highlightLayer);
      this.highlightLayer = null;
    }
    
    if (!feature || !feature.geometry) {
      console.warn('No geometry to highlight');
      return;
    }

    try {
      this.highlightLayer = L.geoJSON(feature, {
        style: {
          fillColor: 'transparent',
          color: '#ff0000',
          weight: 4,
          opacity: 1,
          dashArray: '10, 5'
        },
        // ← PENTING: JANGAN tambahkan event listener di sini
        interactive: false // ← Nonaktifkan interaksi
      }).addTo(map);
      
      if (this.highlightLayer.setZIndex) {
        this.highlightLayer.setZIndex(999);
      }

      const bounds = this.highlightLayer.getBounds();
      if (bounds && bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: CONFIG.ui.isMobile ? [30, 30] : [50, 50],
          maxZoom: 18
        });
      }
    } catch (error) {
      console.error('Error highlighting feature:', error);
    }
  },

  // Create persil content
  createPersilContent(features) {
    if (!features || features.length === 0) {
      return this.createErrorContent('⚠️ Data persil tidak ditemukan.');
    }
    
    // Set current features (TANPA memanggil highlight di sini)
    this.currentFeatures = features;
    const feature = features[this.currentIndex];
    
    if (!feature || !feature.properties) {
      return this.createErrorContent('⚠️ Data tidak valid.');
    }

    const props = feature.properties;
    const total = features.length;

    let content = `
      <div class="popup-header persil">
        <span>📍 Informasi Persil</span>
        <span class="close-btn" onclick="PopupManager.close()">✕</span>
      </div>
      <div class="popup-body">
        <div class="popup-section">
          <div class="popup-section-title persil">📍 Data Bidang Tanah</div>
    `;

    // Navigation
    if (total > 1) {
      content += `
        <div class="feature-navigation">
          <button class="nav-btn" onclick="PopupManager.navigate('prev')" ${this.currentIndex === 0 ? 'disabled' : ''}>◄</button>
          <span class="nav-info">${this.currentIndex + 1} dari ${total}</span>
          <button class="nav-btn" onclick="PopupManager.navigate('next')" ${this.currentIndex === total - 1 ? 'disabled' : ''}>►</button>
        </div>
      `;
    }

    // Properties
    const nib = props.nib || props.NIB || '-';
    const tipeHak = props.tipe_hak || props.TIPE_HAK || '-';
    const nomorHak = Utils.formatNomorHak(props.nomor || props.NOMOR);
    const luas = Utils.formatLuas(props.luas || props.LUAS);
    const tahun = props.tahun || props.TAHUN || '-';

    content += `
      <div class="popup-row">
        <span class="popup-label">🆔 NIB:</span>
        <span class="popup-value">${nib}</span>
      </div>
      <div class="popup-row">
        <span class="popup-label">📋 Tipe Hak:</span>
        <span class="popup-value">${tipeHak}</span>
      </div>
      <div class="popup-row">
        <span class="popup-label">📄 No. Hak:</span>
        <span class="popup-value">${nomorHak}</span>
      </div>
      <div class="popup-row">
        <span class="popup-label">📏 Luas:</span>
        <span class="popup-value">${luas}</span>
      </div>
      <div class="popup-row">
        <span class="popup-label">📅 Tahun:</span>
        <span class="popup-value">${tahun}</span>
      </div>
    </div></div>
    `;

    return content;
  },

  // Create RTRW content
  createRTRWContent(feature, latlng) {
    if (!feature || !feature.properties) {
      return this.createErrorContent('⚠️ Data RTRW tidak tersedia.');
    }

    const props = feature.properties;
    
    let content = `
      <div class="popup-header">
        <span>🏛️ RTRW</span>
        <span class="close-btn" onclick="PopupManager.close()">✕</span>
      </div>
      <div class="popup-body">
        <div class="popup-section">
          <div class="popup-section-title">🏛️ Informasi RTRW</div>
    `;

    let hasData = false;
    for (let key in props) {
      if (props[key] !== null && props[key] !== '' && key.toLowerCase() !== 'warna') {
        hasData = true;
        const label = key.replace(/_/g, ' ').toUpperCase();
        let value = props[key];
        
        if ((key.toLowerCase().includes('luas') || key.toLowerCase().includes('area')) && !isNaN(value)) {
          value = Utils.formatLuas(value, 'Ha');
        }
        
        content += `
          <div class="popup-row">
            <span class="popup-label">${label}:</span>
            <span class="popup-value">${value}</span>
          </div>
        `;
      }
    }

    if (!hasData) {
      content += `<div class="popup-warning">⚠️ Data detail tidak tersedia.</div>`;
    }

    content += `
        </div>
        <div class="popup-row" style="border-top: 2px solid #ddd; margin-top: 10px; padding-top: 8px;">
          <span class="popup-label">📍 Koordinat:</span>
          <span class="popup-value">${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}</span>
        </div>
      </div>
    `;

    return content;
  },

  // Create RDTR content
  createRDTRContent(feature, latlng) {
    if (!feature || !feature.properties) {
      return this.createErrorContent('⚠️ Data RDTR tidak tersedia.');
    }

    const props = feature.properties;
    
    let content = `
      <div class="popup-header rdtr">
        <span>🏙️ RDTR</span>
        <span class="close-btn" onclick="PopupManager.close()">✕</span>
      </div>
      <div class="popup-body">
        <div class="popup-section">
          <div class="popup-section-title rdtr">🏙️ Informasi RDTR dan Hutan</div>
    `;

    let hasData = false;
    for (let key in props) {
      if (props[key] !== null && props[key] !== '' && key.toLowerCase() !== 'warna') {
        hasData = true;
        const label = key.replace(/_/g, ' ').toUpperCase();
        let value = props[key];
        
        if ((key.toLowerCase().includes('luas') || key.toLowerCase().includes('area')) && !isNaN(value)) {
          value = Utils.formatLuas(value);
        }
        
        content += `
          <div class="popup-row">
            <span class="popup-label">${label}:</span>
            <span class="popup-value">${value}</span>
          </div>
        `;
      }
    }

    if (!hasData) {
      content += `<div class="popup-warning">⚠️ Data detail tidak tersedia.</div>`;
    }

    content += `
        </div>
        <div class="popup-row" style="border-top: 2px solid #ddd; margin-top: 10px; padding-top: 8px;">
          <span class="popup-label">📍 Koordinat:</span>
          <span class="popup-value">${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}</span>
        </div>
      </div>
    `;

    return content;
  },

  // Create Sawah content
  createSawahContent(feature, latlng) {
    if (!feature || !feature.properties) {
      return this.createErrorContent('⚠️ Data Lahan Sawah tidak tersedia.');
    }

    const props = feature.properties;
    
    let content = `
      <div class="popup-header sawah">
        <span>🌾 Lahan Sawah Dilindungi</span>
        <span class="close-btn" onclick="PopupManager.close()">✕</span>
      </div>
      <div class="popup-body">
        <div class="popup-section">
          <div class="popup-section-title sawah">🌾 Informasi Lahan Sawah</div>
    `;

    let hasData = false;
    for (let key in props) {
      if (props[key] !== null && props[key] !== '') {
        hasData = true;
        const label = key.replace(/_/g, ' ').toUpperCase();
        let value = props[key];
        
        if ((key.toLowerCase().includes('luas') || key.toLowerCase().includes('area')) && !isNaN(value)) {
          value = Utils.formatLuas(value, 'Ha');
        }
        
        content += `
          <div class="popup-row">
            <span class="popup-label">${label}:</span>
            <span class="popup-value">${value}</span>
          </div>
        `;
      }
    }

    if (!hasData) {
      content += `<div class="popup-warning">⚠️ Data detail tidak tersedia.</div>`;
    }

    content += `
        </div>
        <div class="popup-row" style="border-top: 2px solid #ddd; margin-top: 10px; padding-top: 8px;">
          <span class="popup-label">📍 Koordinat:</span>
          <span class="popup-value">${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}</span>
        </div>
      </div>
    `;

    return content;
  },

  // Create Kelerengan content
  createKelerenganContent(feature, latlng) {
    if (!feature || !feature.properties) {
      return this.createErrorContent('⚠️ Data Kelerengan tidak tersedia.');
    }

    const props = feature.properties;
    
    let content = `
      <div class="popup-header kelerengan">
        <span>⛰️ Kelerengan</span>
        <span class="close-btn" onclick="PopupManager.close()">✕</span>
      </div>
      <div class="popup-body">
        <div class="popup-section">
          <div class="popup-section-title kelerengan">⛰️ Informasi Kelerengan</div>
    `;

    let hasData = false;
    for (let key in props) {
      if (props[key] !== null && props[key] !== '') {
        hasData = true;
        const label = key.replace(/_/g, ' ').toUpperCase();
        let value = props[key];
        
        if (key.toLowerCase().includes('kelerengan') || key.toLowerCase().includes('slope')) {
          if (!isNaN(value)) value = value + ' %';
        }
        
        if ((key.toLowerCase().includes('luas') || key.toLowerCase().includes('area')) && !isNaN(value)) {
          value = Utils.formatLuas(value, 'Ha');
        }
        
        content += `
          <div class="popup-row">
            <span class="popup-label">${label}:</span>
            <span class="popup-value">${value}</span>
          </div>
        `;
      }
    }

    if (!hasData) {
      content += `<div class="popup-warning">⚠️ Data detail tidak tersedia.</div>`;
    }

    content += `
        </div>
        <div class="popup-row" style="border-top: 2px solid #ddd; margin-top: 10px; padding-top: 8px;">
          <span class="popup-label">📍 Koordinat:</span>
          <span class="popup-value">${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}</span>
        </div>
      </div>
    `;

    return content;
  },

  // Create Hutan content
  createHutanContent(attributes, latlng) {
    if (!attributes) {
      return this.createErrorContent('⚠️ Data Kawasan Hutan tidak tersedia.');
    }

    let content = `
      <div class="popup-header hutan">
        <span>🌲 Kawasan Hutan</span>
        <span class="close-btn" onclick="PopupManager.close()">✕</span>
      </div>
      <div class="popup-body">
        <div class="popup-section">
          <div class="popup-section-title hutan">🌲 Informasi Kawasan Hutan</div>
    `;

    let hasData = false;
    for (let key in attributes) {
      if (attributes.hasOwnProperty(key) && attributes[key] !== null && attributes[key] !== '') {
        hasData = true;
        let label = key.replace(/_/g, ' ').toUpperCase();
        let value = attributes[key];
        
        if (key.toLowerCase().includes('luas') && !isNaN(value)) {
          value = Utils.formatLuas(value, 'Ha');
        }
        
        content += `
          <div class="popup-row">
            <span class="popup-label">${label}:</span>
            <span class="popup-value">${value}</span>
          </div>
        `;
      }
    }

    if (!hasData) {
      content += `<div class="popup-warning">⚠️ Data detail tidak tersedia.</div>`;
    }

    content += `
        </div>
        <div class="popup-row" style="border-top: 2px solid #ddd; margin-top: 10px; padding-top: 8px;">
          <span class="popup-label">📍 Koordinat:</span>
          <span class="popup-value">${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}</span>
        </div>
      </div>
    `;

    return content;
  },

  // Create loading content
  createLoadingContent() {
    return `
      <div class="popup-header">
        <span>📍 Memuat Data...</span>
        <span class="close-btn" onclick="PopupManager.close()">✕</span>
      </div>
      <div class="popup-body">
        <div class="popup-loading">
          <div class="spinner"></div>
          <p>Mohon tunggu...</p>
        </div>
      </div>
    `;
  },

  // Create error content
  createErrorContent(message) {
    return `
      <div class="popup-header">
        <span>⚠️ Info</span>
        <span class="close-btn" onclick="PopupManager.close()">✕</span>
      </div>
      <div class="popup-body">
        <div class="popup-error">${message || '⚠️ Tidak ada data di lokasi ini.'}</div>
      </div>
    `;
  },

  // Navigate persil features
  navigate(direction) {
    if (this.currentFeatures.length === 0) return;

    if (direction === 'prev' && this.currentIndex > 0) {
      this.currentIndex--;
    } else if (direction === 'next' && this.currentIndex < this.currentFeatures.length - 1) {
      this.currentIndex++;
    } else {
      return;
    }
    
    // Update popup content
    const content = this.createPersilContent(this.currentFeatures);
    if (this.currentPopup) {
      this.currentPopup.setContent(content);
      
      // Highlight SETELAH update content
      if (this.currentFeatures[this.currentIndex]) {
        this.highlight(this.currentFeatures[this.currentIndex]);
      }
    }
  },

  // Show popup
  show(type, data, latlng) {
    // ← PREVENT INFINITE LOOP
    if (this.isProcessing) {
      console.warn('Popup already processing, skipping...');
      return;
    }

    this.isProcessing = true;
    this.close();
    
    let content = '';
    
    // Create content based on type
    switch(type) {
      case 'persil':
        content = this.createPersilContent(data);
        // Highlight SETELAH content dibuat
        if (data && data.length > 0) {
          this.highlight(data[0]);
        }
        break;
      case 'rtrw':
        content = this.createRTRWContent(data, latlng);
        this.highlight(data);
        break;
      case 'rdtr':
        content = this.createRDTRContent(data, latlng);
        this.highlight(data);
        break;
      case 'hutan':
        content = this.createHutanContent(data, latlng);
        break;
      case 'sawah':
        content = this.createSawahContent(data, latlng);
        this.highlight(data);
        break;
      case 'kelerengan':
        content = this.createKelerenganContent(data, latlng);
        this.highlight(data);
        break;
      case 'loading':
        content = this.createLoadingContent();
        break;
      case 'error':
        content = this.createErrorContent(data);
        break;
      default:
        content = this.createErrorContent('⚠️ Tipe data tidak dikenali');
    }
    
    this.currentPopup = L.popup({
      className: 'custom-popup',
      maxWidth: CONFIG.ui.isMobile ? window.innerWidth - 20 : 450,
      minWidth: CONFIG.ui.isMobile ? 260 : 300,
      closeButton: false,
      autoPan: true,
      autoPanPadding: [10, 10]
    })
    .setLatLng(latlng)
    .setContent(content)
    .openOn(map);

    // Reset flag setelah selesai
    setTimeout(() => {
      this.isProcessing = false;
    }, 100);
  },

  // Show loading popup
  showLoading(latlng) {
    this.show('loading', null, latlng);
  }
};

// Make globally accessible
window.PopupManager = PopupManager;