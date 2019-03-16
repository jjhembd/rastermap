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
        drawTile(display, ix, iy, zoom, x, y, images, tileAPI);
      }
    }
    // Clean up -- don't let images object get too big
    prune(images, tileCoords);
    return;
  }
}

function drawTile(ctx, ix, iy, z, x, y, tiles, tileAPI) {
  let tileID = tileAPI.getID(z, x, y);
  let tile = tiles[tileID];

  if (tile && tile.complete && tile.naturalWidth !== 0) {
    ctx.drawImage(
        tile,
        //sx,      // Start using tile from this pixel in x
        //sy,      // Start using tile from this pixel in y
        //sWidth,  // Use this many pixels from the tile
        //sHeight, // Use this many pixels from the tile
        ix * tileAPI.tileSize,
        iy * tileAPI.tileSize,
        //tileAPI.tileSize,
        //tileAPI.tileSize
        );
    return;
  }

  // Get pz, px, py of parent
  var pz = z - 1;
  var px = Math.floor(x / 2);
  var py = Math.floor(y / 2);
  let parentID = tileAPI.getID(pz, px, py);
  let parentTile = tiles[parentID];
  if (parentTile && parentTile.complete && parentTile.naturalWidth !== 0) {
    ctx.drawImage(
        parentTile,
        (x / 2 - px) * tileAPI.tileSize,
        (y / 2 - py) * tileAPI.tileSize,
        tileAPI.tileSize / 2,
        tileAPI.tileSize / 2,
        ix * tileAPI.tileSize,
        iy * tileAPI.tileSize,
        tileAPI.tileSize,
        tileAPI.tileSize,
        );
  }

  // drawTile(ctx, zoom, ix, iy, pz, px, py, tiles, tileAPI);

  if (!tile) {  // Tile doesn't exist. Create it and request image
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
