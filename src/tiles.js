function initTiles(tileCoords, tileAPI, display) {

  const mapWidth = tileCoords.numTiles.x * tileAPI.tileSize;
  const mapHeight = tileCoords.numTiles.y * tileAPI.tileSize;

  // Initialize images object to store a cache of map tiles
  const images = {};

  // Initialize tracking object, to check if map needs to be updated
  const dz = [];
  for (let iy = 0; iy < tileCoords.numTiles.y; iy++) {
    dz[iy] = [];
    for (let ix = 0; ix < tileCoords.numTiles.x; ix++) {
      // dz indicates the difference between the requested zoom level
      // and the zoom level actually written to this tile
      dz[iy][ix] = tileAPI.maxZoom;
    }
  }
  const oneTileComplete = 1. / tileCoords.numTiles.x / tileCoords.numTiles.y;
  const mapStatus = {
    zoom: 0,
    xTile0: 0,
    yTile0: 0,
    complete: 0.0,
    dz,
    changed: function() {
      return (this.zoom !== tileCoords.zoom()  ||
          this.xTile0 !== tileCoords.xTile0()  ||
          this.yTile0 !== tileCoords.yTile0()  );
    },
    reset: function() {
      this.zoom = tileCoords.zoom();
      this.xTile0 = tileCoords.xTile0();
      this.yTile0 = tileCoords.yTile0();
      this.complete = 0.0;
      for (let iy = 0; iy < tileCoords.numTiles.y; iy++) {
        for (let ix = 0; ix < tileCoords.numTiles.x; ix++) {
          dz[iy][ix] = tileAPI.maxZoom;
        }
      }
      return;
    },
  }

  // Return methods for drawing a 2D map
  return {
    drawTiles,
    loaded: function () {
      return mapStatus.complete;
    },
  };

  function drawTiles() {
    if ( mapStatus.changed() ) {
      // Position or zoom of map has changed. Reset status
      mapStatus.reset();
      // Clear current canvases
      display.clearRect(0, 0, mapWidth, mapHeight);
    }

    // Quick exit if map is already complete.
    if ( mapStatus.complete === 1.0 ) return false; // No change!

    // Loop over tiles in the map
    for (let iy = 0; iy < tileCoords.numTiles.y; iy++) {
      let y = wrap( tileCoords.yTile0() + iy, tileCoords.nTiles() );

      for (let ix = 0; ix < tileCoords.numTiles.x; ix++) {
        if (mapStatus.dz[iy][ix] === 0) continue; // This tile already done

        let x = wrap( tileCoords.xTile0() + ix, tileCoords.nTiles() );

        mapStatus.dz[iy][ix] = drawTile(display, ix, iy, images, tileAPI,
            tileCoords.zoom(), x, y, 0, 0, tileAPI.tileSize);

        if (mapStatus.dz[iy][ix] == 0) mapStatus.complete += oneTileComplete;
      }
    }
    // Clean up -- don't let images object get too big
    prune(images, tileCoords);
    // TODO: if we are waiting a long time for a tile to load,
    // the map will continuously update.
    // The stuck tile will be continually rewritten with the parent tile.
    return true; // Map has updated or is not yet complete
  }
}

function drawTile(
    ctx,         // 2D canvas context, to which the tile will be drawn
    ix, iy,      // Indices of which tile in the canvas to update
    tiles,       // Array of image objects
    tileAPI,     // API info of the tile service
    z, x, y,     // Coordinates of the tile in the API to be read
    sx, sy, sw   // Cropping parameters--which part of the tile to use
    // Return value indicates the number of zoom levels between the requested
    // zoom and the zoom actually written. Return = 0 means tile is complete.
    // TODO: return without drawing if the closest zoom level available is
    // the same as what is already written
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
    return 0; // Success! We wrote the requested resolution
  }

  // Looks like the tile wasn't ready. Try using the parent tile
  // Track the number of generations we go back before finding a live tile
  var generations = 1;
  if (z > 0 && sw > 1) { // Don't look too far back
    // Get coordinates and cropping parameters of the parent
    let pz = z - 1;
    let px = Math.floor(x / 2);
    let py = Math.floor(y / 2);
    let psx = sx / 2 + (x / 2 - px) * size;
    let psy = sy / 2 + (y / 2 - py) * size;
    let psw = sw / 2;

    // Note: recursive function call!
    generations += drawTile(ctx, ix, iy, tiles, tileAPI,
        pz, px, py, psx, psy, psw);
  }

  if (!tile) {  // Tile didn't even exist. Create it and request image
    //console.log("drawTile: # tiles = " + Object.keys(tiles).length +
    //    ".  Adding tile " + tileID);
    tile = new Image();
    tile.zoom = z;
    tile.indx = x;
    tile.indy = y;
    tile.crossOrigin = "anonymous";
    tile.src = tileAPI.getURL(tileID);
    tiles[tileID] = tile;
  }

  return generations;
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
      //console.log("prune: tile " + id + " distance=" + distance);
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

export { initTiles };
