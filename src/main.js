import * as tileRack from 'tile-rack';
import * as tilekiln from 'tilekiln';
import { initGrid } from "./grid.js";
import { initSelector } from "./selection.js";

export function init(params, context) {
  // Check if we have a valid canvas rendering context
  var haveRaster = context instanceof CanvasRenderingContext2D;
  if (!haveRaster) {
    console.log("WARNING in rastermap.init: not a 2D rendering context!");
    //return false;
  }

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
  const grid = initGrid(params, context, tiles);

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
