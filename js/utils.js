const Utils = {
  // Format nomor hak
  formatNomorHak(nomor) {
    if (!nomor) return '-';
    const nomorStr = String(nomor).replace(/\D/g, '');
    if (nomorStr.length >= 14) {
      return `${nomorStr.substring(0, 8)}.${nomorStr.substring(8, 9)}.${nomorStr.substring(9, 14)}`;
    } else if (nomorStr.length >= 9) {
      return `${nomorStr.substring(0, 8)}.${nomorStr.substring(8, 9)}.${nomorStr.substring(9)}`;
    }
    return nomor;
  },

  // Format luas
  formatLuas(luas, unit = 'm²') {
    if (!luas || isNaN(luas)) return '-';
    return parseFloat(luas).toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }) + ' ' + unit;
  },

  // Update progress loading
  updateLoadingProgress(message) {
    const progressEl = document.getElementById('loading-progress');
    if (progressEl) {
      progressEl.textContent = message;
    }
  },

  // Hide loading overlay
  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.classList.add('hidden');
    }, 600);
  },

  // Show loading overlay
  showLoading(message = 'Memuat...') {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('hidden', 'fade-out');
    this.updateLoadingProgress(message);
  },

  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Get color from properties
  getColor(properties) {
    return properties.warna || properties.color || properties.COLOR || null;
  }
};