import { initTileCoords } from "./tileCoords.js";
import { initTiles } from "./tiles.js";

function initMap2D(display, overlay, tileAPI, projection) {
  // Setup tile coordinates  TODO: tileAPI should include projection?
  const tileCoords = initTileCoords( tileAPI, projection );
  const size = tileAPI.tileSize;

  // Set canvas drawing buffer size equal to the CSS displayed size
  const mapWidth = tileCoords.gridSize.x * size;
  const mapHeight = tileCoords.gridSize.y * size;
  display.canvas.width = mapWidth;
  display.canvas.height = mapHeight;
  overlay.canvas.width = mapWidth;
  overlay.canvas.height = mapHeight;
  console.log("display size: " + mapWidth + "x" + mapHeight);

  const tiles = initTiles(tileAPI);

  // Initialize tracking object, to check if map needs to be updated
  const dz = [];
  for (let iy = 0; iy < tileCoords.gridSize.y; iy++) {
    dz[iy] = [];
    for (let ix = 0; ix < tileCoords.gridSize.x; ix++) {
      // dz indicates the difference between the requested zoom level
      // and the zoom level actually written to this tile
      dz[iy][ix] = tileAPI.maxZoom;
    }
  }
  const oneTileComplete = 1. / tileCoords.gridSize.x / tileCoords.gridSize.y;
  const mapStatus = {
    complete: 0.0,
    dz,
    reset: function() {
      this.complete = 0.0;
      for (let iy = 0; iy < tileCoords.gridSize.y; iy++) {
        for (let ix = 0; ix < tileCoords.gridSize.x; ix++) {
          dz[iy][ix] = tileAPI.maxZoom;
        }
      }
      return;
    },
  }

  function drawTiles() {
    // Quick exit if map is already complete.
    if ( mapStatus.complete === 1.0 ) return false; // No change!

    // Loop over tiles in the map
    const tileObj = {};
    const zxy = [];
    for (let iy = 0; iy < tileCoords.gridSize.y; iy++) {
      for (let ix = 0; ix < tileCoords.gridSize.x; ix++) {
        if (mapStatus.dz[iy][ix] === 0) continue; // This tile already done

        tileCoords.getZXY(zxy, ix, iy);
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

        if (dzTmp == 0) mapStatus.complete += oneTileComplete;
        mapStatus.dz[iy][ix] = dzTmp;
      }
    }
    // Clean up -- don't let images object get too big
    tiles.prune(tileCoords.tileDistance, 3.5);
    return true; // Map has updated or is not yet complete
  }

  // Return methods for drawing a 2D map
  return {
    pan,
    zoomIn,
    zoomOut,
    fitBoundingBox,
    drawTiles,
    loaded: function() {
      return mapStatus.complete;
    },
  };

  function pan(dx, dy) {
    var changed = tileCoords.pan(dx, dy);
    if (changed) reset();
  }

  function zoomIn() {
    var changed = tileCoords.zoomIn();
    if (changed) reset();
  }

  function zoomOut() {
    var changed = tileCoords.zoomOut();
    if (changed) reset();
  }

  function fitBoundingBox(p1, p2) {
    var changed = tileCoords.fitBoundingBox(p1, p2);
    if (changed) reset();
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

export { initMap2D };
