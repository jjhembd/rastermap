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
    drawTiles: tiles.drawTiles,
    pan: tileCoords.pan,
    zoomIn: tileCoords.zoomIn,
    zoomOut: tileCoords.zoomOut,
    fitBoundingBox: tileCoords.fitBoundingBox,
    loaded: tiles.loaded,
  };

}

export { initMap2D };
