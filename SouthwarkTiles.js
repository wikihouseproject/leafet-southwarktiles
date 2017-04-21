(function(root, factory) {
  // UMD for  Node, AMD or browser globals
  if (typeof define === "function" && define.amd) {
    // AMD. Register as an anonymous module.
    define(["leaflet", "proj4leaflet", "babel-polyfill"], factory);
  } else if (typeof exports === "object") {
    // Node & CommonJS-like environments.
    var L = require("leaflet"); // eslint-disable-line vars-on-top
    require("proj4leaflet");
    require("babel-polyfill");

    module.exports = factory(L);
  } else {
    // Browser globals
    if (typeof window.L === "undefined") {
      throw new Error("Leaflet missing");
    }
    root.returnExports = factory(root.L);
  }
})(this, function(L) {
  L.SouthwarkTiles = L.SouthwarkTiles || {};
  L.SouthwarkTiles.VERSION = "0.0.4";
  L.SouthwarkTiles.CRS = L.extend(
    new L.Proj
      .CRS(
      "EPSG:27700",
      "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs",
      {
        resolutions: Array.from(new Array(12), (x, i) => 320 / Math.pow(2, i))
      }
    ),
    {
      distance: function(a, b) {
        return L.CRS.Earth.distance(a, b);
      }
    }
  );

  // http://maps.southwark.gov.uk/connect/controller/tiling/gettile?name=B_MappingC_210716_2&level=1&row=1&col=1&output=image/png

  L.SouthwarkTiles.TileLayer = L.TileLayer.WMS.extend({
    initialize: function(mapname, crs, options) {
      L.TileLayer.WMS.prototype.initialize.call(
        this,
        "https://corsproxy.bitsushi.com/maps.southwark.gov.uk/connect/controller/tiling/gettile",
        {
          crs: L.SouthwarkTiles.CRS,
          maxZoom: 12,
          opacity: 0.8,
          tileSize: 256,
          bounds: L.latLngBounds(
            L.latLng(51.38885, -0.64932),
            L.latLng(52.06954, 0.48703)
          )
        },
        options
      );

      // http://maps.southwark.gov.uk/connect/controller/tiling/gettile?name=B_MappingC_210716_2&level=6&row=15&col=15&output=image/png
      this.wmsParams = {
        output: "image/png",
        name: mapname
      };
    },

    getAttribution: function() {
      return (
        "&copy; " +
        new Date().getFullYear() +
        " <a href='http://maps.southwark.gov.uk/connect/index.jsp?tooltip=yes'>Southwark Council</a>"
      );
    },

    getTileUrl: function(tilePoint) {
      const level = tilePoint.z + 1;
      const numTiles = 1 << tilePoint.z;
      const tileSize = 81920 / numTiles;

      var bounds = {
        top: 219960,
        right: 572960,
        bottom: 138040,
        left: 491040,
        center: [51.458189528222356, -0.08094055858692445]
      };

      var resolutionMpp = this.options.crs.options.resolutions[tilePoint.z],
        tileSizeMetres = this.options.tileSize * resolutionMpp,
        tileBboxX0 = tileSizeMetres * (0.5 + tilePoint.x),
        tileBboxY0 = tileSizeMetres * (-0.5 - tilePoint.y);

      // console.log(resolutionMpp, tileSizeMetres, tileBboxX0, tileBboxY0)
      // console.log(tilePoint)

      this.wmsParams.level = level;
      // this.wmsParams.col = tilePoint.x % 6 + 1
      this.wmsParams.col = tilePoint.x - (3 << level) + 1;
      this.wmsParams.row = tilePoint.y + (3 << (level - 1)) + 1;

      // console.info({x: tilePoint.x, y: tilePoint.y, lev: level, row: this.wmsParams.row, col: this.wmsParams.col})
      return this._url + L.Util.getParamString(this.wmsParams);
    }
  });

  L.SouthwarkTiles.tilelayer = function(apiKey, apiUrl, options) {
    return new L.SouthwarkTiles.TileLayer(apiKey, apiUrl, options);
  };

  return L.SouthwarkTiles;
});
