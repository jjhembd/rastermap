import { initTileCoords } from "./tileCoords.js";
import { initTileCache } from "./tileCache.js";

export function init(display, overlay, tileAPI) {
  // Setup tile coordinates and tile cache
  const coords = initTileCoords( tileAPI );
  const tiles = initTileCache( tileAPI );

  // Set canvas drawing buffer size equal to the CSS displayed size
  const size = tileAPI.tileSize;
  const mapWidth = tileAPI.nx * size;
  const mapHeight = tileAPI.ny * size;
  display.canvas.width = mapWidth;
  display.canvas.height = mapHeight;
  overlay.canvas.width = mapWidth;
  overlay.canvas.height = mapHeight;
  console.log("display size: " + mapWidth + "x" + mapHeight);

  // Initialize tracking object, to check if map needs to be updated
  const dz = [];
  for (let iy = 0; iy < tileAPI.ny; iy++) {
    dz[iy] = [];
  }
  const oneTileComplete = 1. / tileAPI.nx / tileAPI.ny;
  const mapStatus = {
    complete: 0.0,
    dz,
    reset: function() {
      this.complete = 0.0;
      for (let iy = 0; iy < tileAPI.ny; iy++) {
        for (let ix = 0; ix < tileAPI.nx; ix++) {
          // dz indicates the difference between the requested zoom level
          // and the zoom level actually written to this tile
          dz[iy][ix] = tileAPI.maxZoom;
        }
      }
      return;
    },
  }
  mapStatus.reset(); // Initializes dz

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
    fitBoundingBox: function(p1, p2) {
      var changed = coords.fitBoundingBox(p1, p2);
      if (changed) reset();
    },
    getScale: coords.getScale,
    projection: tileAPI.projection,
    lonLatToLocalXY: function(local, geodetic) {
      tileAPI.projection.lonLatToXY(local, geodetic);
      coords.toLocal(local, local);
      return;
    },
  };

  function drawTiles() {
    // Quick exit if map is already complete.
    if ( mapStatus.complete === 1.0 ) return false; // No change!

    var updated = false;
    const tileObj = {};
    const zxy = [];

    // Loop over tiles in the map
    for (let iy = 0; iy < tileAPI.ny; iy++) {
      for (let ix = 0; ix < tileAPI.nx; ix++) {
        if (mapStatus.dz[iy][ix] === 0) continue; // This tile already done

        coords.getZXY(zxy, ix, iy);
        var foundTile = tiles.retrieve( tileObj, zxy );
        if (!foundTile) continue; // No image available for this tile
        var dzTmp = zxy[0] - tileObj.img.zoom;
        if (dzTmp == mapStatus.dz[iy][ix]) continue; // Tile already written

        display.drawImage(
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
    // Reset map status
    mapStatus.reset();
    // Clear canvases
    display.clearRect(0, 0, mapWidth, mapHeight);
    overlay.clearRect(0, 0, mapWidth, mapHeight);
    return;
  }

}
