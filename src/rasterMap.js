import { initTileCoords } from "./tileCoords.js";
import { initTileCache } from "./tileCache.js";

export function init(params, context, overlay) {
  // Check if we have valid canvas rendering contexts
  var haveRaster = context instanceof CanvasRenderingContext2D;
  if (!haveRaster) {
    console.log("ERROR in rastermap.init: not a valid 2D rendering context!");
    return false;
  }
  var haveVector = overlay instanceof CanvasRenderingContext2D;

  // Resize canvases to fit the specified number of tiles
  const size = params.tileSize;
  const mapWidth = params.nx * size;
  const mapHeight = params.ny * size;
  console.log("map size: " + mapWidth + "x" + mapHeight);
  context.canvas.width = mapWidth;
  context.canvas.height = mapHeight;
  if (haveVector) {
    overlay.canvas.width = mapWidth;
    overlay.canvas.height = mapHeight;
  }

  // Setup tile coordinates and tile cache
  const coords = initTileCoords( params );
  const tiles = initTileCache( params );

  // Initialize tracking object, to check if map needs to be updated
  const dz = [];
  for (let iy = 0; iy < params.ny; iy++) {
    dz[iy] = [];
  }
  const oneTileComplete = 1. / params.nx / params.ny;
  const mapStatus = {
    complete: 0.0,
    dz,
    reset: function() {
      this.complete = 0.0;
      for (let iy = 0; iy < params.ny; iy++) {
        for (let ix = 0; ix < params.nx; ix++) {
          // dz indicates the difference between the requested zoom level
          // and the zoom level actually written to this tile
          dz[iy][ix] = params.maxZoom;
        }
      }
      return;
    },
  }
  mapStatus.reset(); // Initializes dz

  // Track status of bounding box for QC
  var boxQC = [ [0,0], [0,0] ];
  var pixQC = [ [0,0], [0,0] ];

  // Return methods for drawing a 2D map
  return {
    drawTiles,
    loaded: function() {
      return mapStatus.complete;
    },
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
    if ( !haveVector ) return;

    // Check if bounding box changed since last call
    var boxChanged = updateBox(boxQC, [p1, p2]);
    if (!boxChanged && !mapChanged) return;

    // Special case: box moved but map didn't
    if (!mapChanged) overlay.clearRect(0, 0, mapWidth, mapHeight);

    // Convert box to map pixels
    coords.xyToMapPixels( pixQC[0], boxQC[0] );
    coords.xyToMapPixels( pixQC[1], boxQC[1] );

    // Draw bounding box on overlay
    overlay.strokeStyle = "#FF0000";
    overlay.lineWidth = 5;
    overlay.strokeRect(
        pixQC[0][0],
        pixQC[0][1],
        pixQC[1][0] - pixQC[0][0],
        pixQC[1][1] - pixQC[0][1]
        );
  }

  function updateBox(bOld, bNew) {
    var same = (
        bNew[0][0] === bOld[0][0] &&
        bNew[0][1] === bOld[0][1] &&
        bNew[1][0] === bOld[1][0] &&
        bNew[1][1] === bOld[1][1]
        );
    if (same) return false;

    // Box changed. Do a deep copy
    bOld[0][0] = bNew[0][0];
    bOld[0][1] = bNew[0][1];
    bOld[1][0] = bNew[1][0];
    bOld[1][1] = bNew[1][1];
    return true;
  }

  function drawTiles() {
    // Quick exit if map is already complete.
    if ( mapStatus.complete === 1.0 ) return false; // No change!

    var updated = false;
    const tileObj = {};
    const zxy = [];

    // Loop over tiles in the map
    for (let iy = 0; iy < params.ny; iy++) {
      for (let ix = 0; ix < params.nx; ix++) {
        if (mapStatus.dz[iy][ix] === 0) continue; // This tile already done

        coords.getZXY(zxy, ix, iy);
        var foundTile = tiles.retrieve( tileObj, zxy );
        if (!foundTile) continue; // No image available for this tile
        var dzTmp = zxy[0] - tileObj.img.zoom;
        if (dzTmp == mapStatus.dz[iy][ix]) continue; // Tile already written

        context.drawImage(
            tileObj.img,    // Image to read, and paint to the canvas
            tileObj.sx,     // First x-pixel in tile to read
            tileObj.sy,     // First y-pixel in tile to read
            tileObj.sw,     // Number of pixels to read in x
            tileObj.sw,     // Number of pixels to read in y
            ix * size,      // First x-pixel in canvas to paint
            iy * size,      // First y-pixel in canvas to paint
            size,           // Number of pixels to paint in x
            size            // Number of pixels to paint in y
            );
        updated = true;

        if (dzTmp == 0) mapStatus.complete += oneTileComplete;
        mapStatus.dz[iy][ix] = dzTmp;
      }
    }
    // Clean up -- don't let images object get too big
    tiles.prune(coords.tileDistance, 3.5);

    return updated;
  }

  function reset() {
    mapStatus.reset();
    context.clearRect(0, 0, mapWidth, mapHeight);
    if (haveVector) {
      overlay.clearRect(0, 0, mapWidth, mapHeight);
      boxQC[0][0] = 0;
      boxQC[0][1] = 0;
      boxQC[1][0] = 0;
      boxQC[1][1] = 0;
    }
    return;
  }

}
