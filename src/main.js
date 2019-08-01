import { initTileCoords } from "./coords.js";
import { initTileCache } from "./cache.js";
import * as tilekiln from 'tilekiln';
import { initGrid } from "./grid.js";
import { initBoxQC } from "./boxqc.js";
import { initSelector } from "./selection.js";

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
    center: userParams.center || [0.5, 0.5], // X, Y in map coordinates
    zoom: Math.floor(userParams.zoom) || 1,
  };

  // Check some values and edit as needed
  params.center[0] = Math.min(Math.max(0.0, params.center[0]), 1.0);
  params.center[1] = Math.min(Math.max(0.0, params.center[1]), 1.0);
  params.zoom = Math.min(Math.max(0, params.zoom), params.maxZoom);

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

  // Initialize tile factory
  const factory = tilekiln.init({
    size: params.tileSize,
    style: params.style,
    token: params.token,
  });

  // Initialize a cache of loaded tiles
  const tiles = initTileCache(params.tileSize, factory);
  var numCachedTiles = 0;

  // Initialize grid of rendered tiles
  const grid = initGrid(params, context, coords, tiles);

  // Initialize bounding box QC overlay
  var boxQC;
  var haveVector = overlay instanceof CanvasRenderingContext2D;
  if (haveVector) boxQC = initBoxQC(overlay, coords, params.width, params.height);

  // Initialize feature selection methods
  const selector = initSelector(params.tileSize, grid.boxes);

  // Return methods for drawing a 2D map
  return {
    drawTiles,
    loaded: grid.loaded,
    move: function(dz, dx, dy) {
      var changed = coords.move(dz, dx, dy);
      if (changed) reset();
    },
    fitBoundingBox,
    toLocal: coords.toLocal,
    getScale: coords.getScale,
    xyToMapPixels: coords.xyToMapPixels,
    boxes: grid.boxes,
    style: () => factory.style,
    redraw,
    hideGroup,
    showGroup,
    getTilePos: selector.getTilePos,
    select: selector.select,
    activeDrawCalls: factory.activeDrawCalls,
    numCachedTiles: () => numCachedTiles,
  };

  function redraw(group) {
    tiles.unrender(group);
    grid.reset();
  }

  function hideGroup(group) {
    tiles.hideGroup(group);
    grid.reset();
  }

  function showGroup(group) {
    tiles.showGroup(group);
    grid.reset();
  }

  function fitBoundingBox(p1, p2) {
    var mapChanged = coords.fitBoundingBox(p1, p2);
    if (mapChanged) reset();
    if (haveVector) boxQC.draw(p1, p2, mapChanged);
    return;
  }

  function drawTiles() {
    var updated = grid.drawTiles();
    // Clean up -- don't let images object get too big
    numCachedTiles = tiles.prune(coords.tileDistance, 1.5);
    return updated;
  }

  function reset() {
    grid.reset();
    grid.clear();
    if (haveVector) boxQC.reset();
    return;
  }
}
