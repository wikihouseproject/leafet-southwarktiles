"use strict";

var _from = require("babel-runtime/core-js/array/from");

var _from2 = _interopRequireDefault(_from);

var _typeof2 = require("babel-runtime/helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

(function(root, factory) {
  // UMD for  Node, AMD or browser globals
  if (typeof define === "function" && define.amd) {
    // AMD. Register as an anonymous module.
    define(["leaflet", "proj4leaflet", "babel-polyfill"], factory);
  } else if (
    (typeof exports === "undefined"
      ? "undefined"
      : (0, _typeof3.default)(exports)) === "object"
  ) {
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
})(undefined, function(L) {
  L.SouthwarkTiles = L.SouthwarkTiles || {};
  L.SouthwarkTiles.VERSION = "0.0.11";

  var bounds = {
    top: 219960,
    right: 572960,
    bottom: 138040,
    left: 491040
  };

  L.SouthwarkTiles.CRS = L.extend(
    new L.Proj
      .CRS(
      "EPSG:27700",
      "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs",
      {
        origin: [bounds.left, bounds.top],
        // transformation: L.Transformation(1, 0, -1, 0),
        resolutions: (0, _from2.default)(new Array(12), function(x, i) {
          return 320 / Math.pow(2, i);
        })
      }
    ),
    {
      distance: function distance(a, b) {
        return L.CRS.Earth.distance(a, b);
      }
    }
  );

  // http://maps.southwark.gov.uk/connect/controller/tiling/gettile?name=B_MappingC_210716_2&level=1&row=1&col=1&output=image/png

  L.SouthwarkTiles.TileLayer = L.TileLayer.WMS.extend({
    initialize: function initialize(mapname, crs, options) {
      L.TileLayer.WMS.prototype.initialize.call(
        this,
        "https://southwark-maps.buildx.cc/connect/controller/tiling/gettile",
        {
          crs: L.SouthwarkTiles.CRS,
          maxZoom: 12,
          opacity: 0.8,
          tileSize: 256,

          bounds: L.latLngBounds(
            L.latLng(51.24123, -0.48975),
            L.latLng(51.69631, 0.2477)
          )
        },
        options
      );

      this.wmsParams = {
        output: "image/png",
        name: mapname
      };
    },

    getAttribution: function getAttribution() {
      return (
        "&copy; " +
        new Date().getFullYear() +
        " <a href='http://maps.southwark.gov.uk/connect/index.jsp?tooltip=yes'>Southwark Council</a>"
      );
    },

    getTileUrl: function getTileUrl(tilePoint) {
      var level = tilePoint.z + 1;

      var bounds = {
        top: 219960,
        right: 572960,
        bottom: 138040,
        left: 491040
      };

      var resolutionMpp = this.options.crs.options.resolutions[tilePoint.z],
        tileSizeMetres = this.options.tileSize * resolutionMpp,
        tileBboxX0 = tileSizeMetres * (0.5 + tilePoint.x),
        tileBboxY0 = tileSizeMetres * (0.5 - tilePoint.y);

      // console.log(resolutionMpp, tileSizeMetres, tileBboxX0, tileBboxY0)
      // console.log(tilePoint)

      this.wmsParams.level = level;
      // this.wmsParams.col = tilePoint.x % 6 + 1
      this.wmsParams.col = tilePoint.x + 1; // - (3 << level) + 1;
      this.wmsParams.row = tilePoint.y + 1; // + (3 << (level - 1)) + 1;

      // console.log(
      //   this.options.tileSize,
      //   tileSizeMetres,
      //   tilePoint,
      //   L.Util.getParamString(this.wmsParams)
      // );

      // console.info({x: tilePoint.x, y: tilePoint.y, lev: level, row: this.wmsParams.row, col: this.wmsParams.col})
      return this._url + L.Util.getParamString(this.wmsParams);
    }
  });

  L.SouthwarkTiles.tilelayer = function(apiKey, apiUrl, options) {
    return new L.SouthwarkTiles.TileLayer(apiKey, apiUrl, options);
  };

  return L.SouthwarkTiles;
});
