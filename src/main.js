import * as tileRack from 'tile-rack';
import * as tilekiln from 'tilekiln';
import { initGrid } from "./grid.js";
import { initSelector } from "./selection.js";

export function init(userParams, context) {
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

  // Initialize tile factory
  const factory = tilekiln.init({
    size: params.tileSize,
    style: params.style,
    token: params.token,
  });

  // Initialize a cache of loaded tiles
  const tiles = tileRack.init(params.tileSize, factory);
  var numCachedTiles = 0;

  // Initialize grid of rendered tiles
  const grid = initGrid(params, context, tiles); //coords, tiles);

  // Initialize feature selection methods
  const selector = initSelector(params.tileSize, grid.boxes);

  return {
    // Method to update the rendering of the map
    drawTiles,

    // Methods to set the position and zoom of the map
    move: grid.move,
    fitBoundingBox: grid.fitBoundingBox,
    setCenterZoom: grid.setCenterZoom,

    // Methods to convert coordinates, or report conversion parameters
    toLocal: grid.toLocal,
    xyToMapPixels: grid.xyToMapPixels,
    getScale: grid.getScale,

    // Methods to interrogate or change the styling of the map
    style: () => factory.style,
    redraw:    (group) => (tiles.unrender(group),  grid.reset()),
    hideGroup: (group) => (tiles.hideGroup(group), grid.reset()),
    showGroup: (group) => (tiles.showGroup(group), grid.reset()),

    // Methods to interrogate the data in the map
    boxes: grid.boxes,
    getTilePos: selector.getTilePos,
    select: selector.select,

    // Methods to report ongoing tasks and memory usage
    loaded: grid.loaded,
    activeDrawCalls: factory.activeDrawCalls,
    numCachedTiles: () => numCachedTiles,
  };

  function drawTiles() {
    var updated = grid.drawTiles();
    // Clean up -- don't let images object get too big
    numCachedTiles = tiles.prune(grid.tileDistance, 1.5);
    return updated;
  }
}
