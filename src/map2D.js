import { initTileCoords } from "./tileCoords.js";

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

  const images = {};

  // Return methods for drawing a 2D map
  return {
    drawTiles,
    pan: tileCoords.pan,
    zoomIn: tileCoords.zoomIn,
    zoomOut: tileCoords.zoomOut,
    fitBoundingBox: tileCoords.fitBoundingBox,
  };

  function drawTiles(zoom, x0, y0) {
    // Clear current canvases
    display.clearRect(0, 0, mapWidth, mapHeight);
    overlay.clearRect(0, 0, mapWidth, mapHeight);

    // Loop over tiles in the map
    var zoom = tileCoords.zoom();
    for (let iy = 0; iy < tileCoords.numTiles.y; iy++) {
      var y = wrap( tileCoords.yTile0() + iy, tileCoords.nTiles() );

      for (let ix = 0; ix < tileCoords.numTiles.x; ix++) {
        var x = wrap( tileCoords.xTile0() + ix, tileCoords.nTiles() );
        var tileID = tileAPI.getID(zoom, x, y);

        if (!images[tileID]) { // Image doesn't exist. Create and request it
          images[tileID] = new Image();
          images[tileID].zoom = zoom;
          images[tileID].indx = x;
          images[tileID].indy = y;
          images[tileID].crossOrigin = "anonymous";
          images[tileID].src = tileAPI.getURL(tileID);
          console.log("drawTiles: requesting tile " + tileID);
          console.log("Number of tiles in memory: " + Object.keys(images).length);
        } else if (images[tileID].complete) {
          var xoffset = ix * tileAPI.tileSize;
          var yoffset = iy * tileAPI.tileSize;
          display.drawImage(images[tileID], xoffset, yoffset);
        }

      }
    }
  }

}

function wrap(x, xmax) {
  while (x < 0) x += xmax;
  while (x >= xmax) x -= xmax;
  return x;
}

export { initMap2D };
