const DrawerManager = {
  drawer: null,
  overlay: null,
  header: null,
  title: null,
  body: null,
  isOpen: false,
  isMinimized: false,
  currentFeatures: [],
  currentIndex: 0,

  init() {
    this.drawer = document.getElementById('bottom-drawer');
    this.overlay = document.getElementById('drawer-overlay');
    this.header = document.getElementById('drawer-header');
    this.title = document.getElementById('drawer-title');
    this.body = document.getElementById('drawer-body');

    // Touch/swipe support
    this.initSwipe();
  },

  initSwipe() {
    let startY = 0;
    let currentY = 0;

    this.drawer.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    }, { passive: true });

    this.drawer.addEventListener('touchmove', (e) => {
      currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      if (diff > 0 && this.isOpen && !this.isMinimized) {
        // Swipe down to minimize
        if (diff > 50) {
          this.minimize();
        }
      } else if (diff < 0 && this.isMinimized) {
        // Swipe up to maximize
        if (diff < -50) {
          this.maximize();
        }
      }
    }, { passive: true });
  },

  open(content, type = '') {
    if (!this.drawer) this.init();

    this.body.innerHTML = content;
    this.drawer.classList.add('open');
    this.drawer.classList.remove('minimized');
    this.overlay.classList.add('show');
    this.isOpen = true;
    this.isMinimized = false;

    // Update header style based on type
    this.header.className = 'drawer-header';
    if (type) {
      this.header.classList.add(type);
    }

    console.log('✅ Drawer opened');
  },

  close() {
    if (!this.drawer) return;

    this.drawer.classList.remove('open', 'minimized');
    this.overlay.classList.remove('show');
    this.isOpen = false;
    this.isMinimized = false;
    this.currentFeatures = [];
    this.currentIndex = 0;

    // Remove highlight from map
    if (PopupManager && PopupManager.highlightLayer && map.hasLayer(PopupManager.highlightLayer)) {
      map.removeLayer(PopupManager.highlightLayer);
      PopupManager.highlightLayer = null;
    }

    console.log('✅ Drawer closed');
  },

  toggle() {
    if (this.isMinimized) {
      this.maximize();
    } else {
      this.minimize();
    }
  },

  minimize() {
    this.drawer.classList.add('minimized');
    this.isMinimized = true;
  },

  maximize() {
    this.drawer.classList.remove('minimized');
    this.isMinimized = false;
  },

  showLoading() {
    const content = `
      <div class="drawer-loading">
        <div class="drawer-spinner"></div>
        <p>Memuat data...</p>
      </div>
    `;
    this.open(content);
    this.title.innerHTML = '📍 Memuat Data...';
  },

  showError(message) {
    const content = `
      <div class="drawer-error">
        ${message || '⚠️ Tidak ada data di lokasi ini.'}
      </div>
    `;
    this.open(content);
    this.title.innerHTML = '⚠️ Info';
  },

  // Create persil content for drawer
  createPersilContent(features) {
    if (!features || features.length === 0) {
      return '<div class="drawer-error">⚠️ Data persil tidak ditemukan.</div>';
    }

    this.currentFeatures = features;
    const feature = features[this.currentIndex];
    const props = feature.properties;
    const total = features.length;

    // Highlight feature
    if (PopupManager && PopupManager.highlight) {
      PopupManager.highlight(feature);
    }

    let content = '<div class="drawer-section">';

    // Navigation
    if (total > 1) {
      content += `
        <div class="drawer-navigation">
          <button class="nav-btn" onclick="DrawerManager.navigate('prev')" ${this.currentIndex === 0 ? 'disabled' : ''}>◄</button>
          <span class="nav-info">${this.currentIndex + 1} dari ${total}</span>
          <button class="nav-btn" onclick="DrawerManager.navigate('next')" ${this.currentIndex === total - 1 ? 'disabled' : ''}>►</button>
        </div>
      `;
    }

    const nib = props.nib || props.NIB || '-';
    const tipeHak = props.tipe_hak || props.TIPE_HAK || '-';
    const nomorHak = Utils.formatNomorHak(props.nomor || props.NOMOR);
    const luas = Utils.formatLuas(props.luas || props.LUAS);
    const tahun = props.tahun || props.TAHUN || '-';

    content += `
      <div class="data-row">
        <span class="data-label">🆔 NIB</span>
        <span class="data-value">${nib}</span>
      </div>
      <div class="data-row">
        <span class="data-label">📋 Tipe Hak</span>
        <span class="data-value">${tipeHak}</span>
      </div>
      <div class="data-row">
        <span class="data-label">📄 No. Hak</span>
        <span class="data-value">${nomorHak}</span>
      </div>
      <div class="data-row">
        <span class="data-label">📏 Luas</span>
        <span class="data-value">${luas}</span>
      </div>
      <div class="data-row">
        <span class="data-label">📅 Tahun</span>
        <span class="data-value">${tahun}</span>
      </div>
    </div>`;

    return content;
  },

  // Create generic content for other layers
  createLayerContent(feature, latlng, layerType) {
    if (!feature || !feature.properties) {
      return '<div class="drawer-error">⚠️ Data tidak tersedia.</div>';
    }

    const props = feature.properties;
    const icons = {
      rtrw: '🏛️',
      rdtr: '🏙️',
      sawah: '🌾',
      kelerengan: '⛰️',
      hutan: '🌲'
    };

    const labels = {
      rtrw: 'RTRW',
      rdtr: 'RDTR dan Hutan',
      sawah: 'Lahan Sawah Dilindungi',
      kelerengan: 'Kelerengan',
      hutan: 'Kawasan Hutan'
    };

    let content = `<div class="drawer-section">`;
    content += `<div class="section-title ${layerType}">${icons[layerType]} Informasi ${labels[layerType]}</div>`;

    let hasData = false;
    for (let key in props) {
      if (props[key] !== null && props[key] !== '' && key.toLowerCase() !== 'warna') {
        hasData = true;
        const label = key.replace(/_/g, ' ').toUpperCase();
        let value = props[key];

        if ((key.toLowerCase().includes('luas') || key.toLowerCase().includes('area')) && !isNaN(value)) {
          value = Utils.formatLuas(value, layerType === 'rdtr' ? 'm²' : 'Ha');
        }

        if (key.toLowerCase().includes('kelerengan') || key.toLowerCase().includes('slope')) {
          if (!isNaN(value)) value = value + ' %';
        }

        content += `
          <div class="data-row">
            <span class="data-label">${label}</span>
            <span class="data-value">${value}</span>
          </div>
        `;
      }
    }

    if (!hasData) {
      content += '<div class="drawer-warning">⚠️ Data detail tidak tersedia.</div>';
    }

    content += `
      <div class="data-row" style="border-top: 2px solid #f0f0f0; margin-top: 10px; padding-top: 10px;">
        <span class="data-label">📍 Koordinat</span>
        <span class="data-value">${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}</span>
      </div>
    </div>`;

    // Highlight feature
    if (PopupManager && PopupManager.highlight) {
      PopupManager.highlight(feature);
    }

    return content;
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

    const content = this.createPersilContent(this.currentFeatures);
    this.body.innerHTML = content;
  },

  // Show data based on type
  show(type, data, latlng) {
    let content = '';
    let titleText = '📍 Informasi Lokasi';
    let headerType = '';

    switch (type) {
      case 'persil':
        content = this.createPersilContent(data);
        titleText = '📍 Data Bidang Tanah';
        headerType = 'persil';
        break;
      case 'rtrw':
        content = this.createLayerContent(data, latlng, 'rtrw');
        titleText = '🏛️ RTRW';
        headerType = 'rtrw';
        break;
      case 'rdtr':
        content = this.createLayerContent(data, latlng, 'rdtr');
        titleText = '🏙️ RDTR dan Hutan';
        headerType = 'rdtr';
        break;
      case 'sawah':
        content = this.createLayerContent(data, latlng, 'sawah');
        titleText = '🌾 Lahan Sawah Dilindungi';
        headerType = 'sawah';
        break;
      case 'kelerengan':
        content = this.createLayerContent(data, latlng, 'kelerengan');
        titleText = '⛰️ Kelerengan';
        headerType = 'kelerengan';
        break;
      case 'hutan':
        content = this.createHutanContent(data, latlng);
        titleText = '🌲 Kawasan Hutan';
        headerType = 'hutan';
        break;
      case 'loading':
        this.showLoading();
        return;
      case 'error':
        this.showError(data);
        return;
    }

    this.title.innerHTML = titleText;
    this.open(content, headerType);
  },

  // Create hutan content (attributes only)
  createHutanContent(attributes, latlng) {
    if (!attributes) {
      return '<div class="drawer-error">⚠️ Data Kawasan Hutan tidak tersedia.</div>';
    }

    let content = '<div class="drawer-section">';
    content += '<div class="section-title hutan">🌲 Informasi Kawasan Hutan</div>';

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
          <div class="data-row">
            <span class="data-label">${label}</span>
            <span class="data-value">${value}</span>
          </div>
        `;
      }
    }

    if (!hasData) {
      content += '<div class="drawer-warning">⚠️ Data detail tidak tersedia.</div>';
    }

    content += `
      <div class="data-row" style="border-top: 2px solid #f0f0f0; margin-top: 10px; padding-top: 10px;">
        <span class="data-label">📍 Koordinat</span>
        <span class="data-value">${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}</span>
      </div>
    </div>`;

    return content;
  }
};

// Make globally accessible
window.DrawerManager = DrawerManager;

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => DrawerManager.init());
} else {
  DrawerManager.init();
}