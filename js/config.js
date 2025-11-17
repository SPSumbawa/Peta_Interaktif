const CONFIG = {
  // Map settings
  map: {
    center: [-8.4802, 117.4082],
    zoom: 13,
    maxZoom: 20,
    zoomControl: true
  },

  // WMS Layers
  wms: {
    bhumi: {
      url: 'https://bhumi.atrbpn.go.id/mprx/service?',
      layers: 'bhumi_persil',
      format: 'image/png',
      transparent: true,
      version: '1.3.0',
      opacity: 0.8,
      zIndex: 10
    }
  },

  // GeoJSON Layers
  geojson: {
    rtrw: {
      file: 'data/rtrw.geojson',
      defaultColor: '#95a5a6',
      opacity: 0.6,
      zIndex: 11,
      type: 'rtrw'
    },
    rdtr: {
      file: 'data/rdtr.geojson',
      defaultColor: '#bdc3c7',
      opacity: 0.6,
      zIndex: 12,
      type: 'rdtr'
    },
    sawah: {
      file: 'data/lsd.geojson',
      color: '#8BC34A',
      opacity: 0.6,
      zIndex: 14,
      type: 'sawah'
    },
    kelerengan: {
      file: 'data/kelerengan.geojson',
      defaultColor: '#795548',
      opacity: 0.6,
      zIndex: 15,
      type: 'kelerengan'
    }
  },

  // Basemaps
  basemaps: {
    osm: {
      name: 'OpenStreetMap',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19
    },
    google: {
      name: 'Google Satellite',
      url: 'https://www.google.com/maps/vt/lyrs=s&x={x}&y={y}&z={z}',
      attribution: '&copy; Google',
      maxZoom: 22
    },
    satellite: {
      name: 'Esri Satellite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri',
      maxZoom: 22
    }
  },

  // External layers
  external: {
    hutan: {
      url: 'https://geoportal.menlhk.go.id/server/rest/services/jsdgejawfvrdtasdt/KWS_HUTAN/MapServer/tile/{z}/{y}/{x}',
      opacity: 0.6,
      zIndex: 13
    }
  },

  // Legend
  legend: {
    bhumi: {
      url: 'https://bhumi.atrbpn.go.id/expapi/bhumigs/umum/wms?SERVICE=WMS&REQUEST=GetLegendGraphic&VERSION=1.3.0&FORMAT=image/png&WIDTH=12&HEIGHT=12&LAYER=umum:Persil&STYLE=&LEGEND_OPTIONS=fontName:Inter;fontSize:5;dpi:200;bgColor:0xFFFFFF;fontColor:0x353432'
    }
  },

  // UI Settings
  ui: {
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    splashMinDuration: 5000 // minimum 5 detik
  }
};