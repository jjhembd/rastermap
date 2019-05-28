import { initTileCoords } from "./coords.js";
import { initTileCache } from "./cache.js";
import { initRenderer } from "./renderer.js";
import * as tilekiln from 'tilekiln';
import { initMap } from "./map.js";
import { initBoxQC } from "./boxqc.js";

export function init(userParams, context, overlay) {
  // Check if we have a valid canvas rendering context
  var haveRaster = context instanceof CanvasRenderingContext2D;
  if (!haveRaster) {
    console.log("WARNING in rastermap.init: not a 2D rendering context!");
    //return false;
  }

  // Check userParams, set defaults for missing parameters
  const params = {
    style: userParams.style, // REQUIRED!!
    token: userParams.token,
    tileSize: userParams.tileSize || 512,
    width: userParams.width || context.canvas.width,
    height: userParams.height || context.canvas.height,
    maxZoom: userParams.maxZoom || 22,
  };

  // Compute number of tiles in each direction.
  params.nx = Math.floor(params.width / params.tileSize);
  params.ny = Math.floor(params.height / params.tileSize);
  if (params.nx * params.tileSize !== params.width ||
      params.ny * params.tileSize !== params.height ) {
    console.log("width, height, tileSize = " +
        params.width + ", " + params.height + ", " + params.tileSize);
    return console.log("ERROR: width, height are not multiples of tileSize!!");
  }
  console.log("map size: " + params.width + "x" + params.height);

  // Setup tile coordinates and associated methods
  const coords = initTileCoords(params);

  // Initialize tile factory and renderer
  const factory = tilekiln.init({
    size: params.tileSize,
    style: params.style,
    token: params.token,
  });
  const renderer = initRenderer(context, params);

  // Initialize a cache of loaded tiles
  const tiles = initTileCache(params.tileSize, factory);

  // Initialize grid of rendered tiles
  const map = initMap(params, renderer, coords, tiles);

  // Initialize bounding box QC overlay
  var boxQC;
  var haveVector = overlay instanceof CanvasRenderingContext2D;
  if (haveVector) boxQC = initBoxQC(overlay, coords, params.width, params.height);

  // Return methods for drawing a 2D map
  return {
    drawTiles,
    loaded: map.loaded,
    move: function(dz, dx, dy) {
      var changed = coords.move(dz, dx, dy);
      if (changed) reset();
    },
    fitBoundingBox,
    toLocal: coords.toLocal,
    getScale: coords.getScale,
    xyToMapPixels: coords.xyToMapPixels,
  };

  function fitBoundingBox(p1, p2) {
    var mapChanged = coords.fitBoundingBox(p1, p2);
    if (mapChanged) reset();
    if (haveVector) boxQC.draw(p1, p2, mapChanged);
    return;
  }

  function drawTiles() {
    var updated = map.drawTiles();
    // Clean up -- don't let images object get too big
    tiles.prune(coords.tileDistance, 3.5);
    return updated;
  }

  function reset() {
    map.reset();
    if (haveVector) boxQC.reset();
    return;
  }
}
