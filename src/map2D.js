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
      let y = wrap( tileCoords.yTile0() + iy, tileCoords.nTiles() );

      for (let ix = 0; ix < tileCoords.numTiles.x; ix++) {
        let x = wrap( tileCoords.xTile0() + ix, tileCoords.nTiles() );

        drawTile(display, ix, iy, images, tileAPI,
            zoom, x, y, 0, 0, tileAPI.tileSize);
      }
    }
    // Clean up -- don't let images object get too big
    prune(images, tileCoords);
    return;
  }
}

function drawTile(
    ctx,         // 2D canvas context, to which the tile will be drawn
    ix, iy,      // Indices of which tile in the canvas to update
    tiles,       // Array of image objects
    tileAPI,     // API info of the tile service
    z, x, y,     // Coordinates of the tile in the API to be read
    sx, sy, sw   // Cropping parameters--which part of the tile to use
    ) {

  // Retrieve the specified tile from the tiles object
  let tileID = tileAPI.getID(z, x, y);
  let tile = tiles[tileID];
  let size = tileAPI.tileSize;

  // If the tile exists and is ready, write it to the canvas
  if (tile && tile.complete && tile.naturalWidth !== 0) {
    //console.log("drawTile: ix, iy, z, x, y, sx, sy, sw = " + ix + ", " + iy + 
    //    ", " + z + ", " + x + ", " + y + ", " + sx + ", " + sy + ", " + sw);
    ctx.drawImage(
        tile,      // Image to read, and paint to the canvas
        sx,        // First x-pixel in tile to read
        sy,        // First y-pixel in tile to read
        sw,        // Number of pixels to read in x
        sw,        // Number of pixels to read in y
        ix * size, // First x-pixel in canvas to paint
        iy * size, // First y-pixel in canvas to paint
        size,      // Number of pixels to paint in x
        size,      // Number of pixels to paint in y
        );
    //if (sw < tileAPI.tileSize) throw ("drew a parent");
    return; // Success! We are done with this tile
  }

  // Looks like the tile wasn't ready. Try using the parent tile
  if (z > 0 && sw > 1) { // Don't look too far back
    // Get coordinates and cropping parameters of the parent
    let pz = z - 1;
    let px = Math.floor(x / 2);
    let py = Math.floor(y / 2);
    let psx = sx / 2 + (x / 2 - px) * size;
    let psy = sy / 2 + (y / 2 - py) * size;
    let psw = sw / 2;

    // Note: recursive function call!
    drawTile(ctx, ix, iy, tiles, tileAPI,
        pz, px, py, psx, psy, psw);
  }

  if (!tile) {  // Tile didn't even exist. Create it and request image
    console.log("drawTile: # tiles = " + Object.keys(tiles).length +
        ".  Adding tile " + tileID);
    tile = new Image();
    tile.zoom = z;
    tile.indx = x;
    tile.indy = y;
    tile.crossOrigin = "anonymous";
    tile.src = tileAPI.getURL(tileID);
    tiles[tileID] = tile;
  }
  return;
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
