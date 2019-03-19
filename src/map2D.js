import { initTileCoords } from "./tileCoords.js";
import { initTiles } from "./tiles.js";

function initMap2D(display, overlay, tileAPI, projection) {
  // Setup tile coordinates  TODO: tileAPI should include projection?
  const tileCoords = initTileCoords( tileAPI, projection );

  // Set canvas drawing buffer size equal to the CSS displayed size
  const mapWidth = tileCoords.numTiles.x * tileAPI.tileSize;
  const mapHeight = tileCoords.numTiles.y * tileAPI.tileSize;
  display.canvas.width = mapWidth;
  display.canvas.height = mapHeight;
  overlay.canvas.width = mapWidth;
  overlay.canvas.height = mapHeight;
  console.log("display size: " + mapWidth + "x" + mapHeight);

  const tiles = initTiles(tileCoords, tileAPI, display);

  // Return methods for drawing a 2D map
  return {
    pan,
    zoomIn,
    zoomOut,
    fitBoundingBox,
    drawTiles: tiles.drawTiles,
    loaded: function() {
      return tiles.mapStatus.complete;
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
    tiles.mapStatus.reset();
    // Clear canvases
    display.clearRect(0, 0, mapWidth, mapHeight);
    overlay.clearRect(0, 0, mapWidth, mapHeight);
    return;
  }

}

export { initMap2D };
