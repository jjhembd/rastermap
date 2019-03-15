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

  function drawTiles() {
    // Clear current canvases
    display.clearRect(0, 0, mapWidth, mapHeight);
    overlay.clearRect(0, 0, mapWidth, mapHeight);

    // Loop over tiles in the map
    var zoom = tileCoords.zoom();
    for (let iy = 0; iy < tileCoords.numTiles.y; iy++) {
      var y = wrap( tileCoords.yTile0() + iy, tileCoords.nTiles() );

      for (let ix = 0; ix < tileCoords.numTiles.x; ix++) {
        let x = wrap( tileCoords.xTile0() + ix, tileCoords.nTiles() );
        let tileID = tileAPI.getID(zoom, x, y);

        if (!images[tileID]) { // Image doesn't exist. Create and request it
          console.log("drawTiles: # tiles = " + Object.keys(images).length +
              ".  Adding tile " + tileID);
          images[tileID] = new Image();
          images[tileID].zoom = zoom;
          images[tileID].indx = x;
          images[tileID].indy = y;
          images[tileID].crossOrigin = "anonymous";
          images[tileID].src = tileAPI.getURL(tileID);
        } else if (images[tileID].complete) {
          var xoffset = ix * tileAPI.tileSize;
          var yoffset = iy * tileAPI.tileSize;
          display.drawImage(images[tileID], xoffset, yoffset);
        }

      }
    }
    // Clean up -- don't let images object get too big
    prune(images, tileCoords);
    return;
  }
}

function prune(tiles, coords) {
  // Remove tiles far from current view ('far' and 'view' defined in coords)
  
  for ( let id in tiles ) {
    //console.log("prune: checking tile " + id);
    let distance = coords.tileDistance(
        tiles[id].zoom,
        tiles[id].indx,
        tiles[id].indy
        );
    if (distance >= 3.0) {
      console.log("prune: tile " + id + " distance=" + distance + 
          "  xTile0: " + coords.xTile0() );
      // Cancel any outstanding request
      tiles[id].src = "";
      // Delete all data for this tile
      delete tiles[id];
    }
  }
  return;
}

function wrap(x, xmax) {
  while (x < 0) x += xmax;
  while (x >= xmax) x -= xmax;
  return x;
}

export { initMap2D };
