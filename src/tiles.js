function initTiles(tileAPI) {
  const size = tileAPI.tileSize;

  // Initialize the tiles object
  const tiles = {};

  // Return methods for accessing and updating the tiles
  return {
    retrieve,
    prune,
  };

  //function retrieve(tile, z, x, y) {
  function retrieve(tile, zxy) {
    tile.found = false;
    getTileOrParent(tile, zxy[0], zxy[1], zxy[2], 0, 0, size);
    // Return a flag indicating whether we have an image ready
    return tile.found;
  }

  function getTileOrParent(
      tileObj,     // Returned tile object
      z, x, y,     // Coordinates of the requested tile
      sx, sy, sw   // Cropping parameters--which part of the tile to use
      ) {

    // Retrieve the specified tile from the tiles object
    let tileID = tileAPI.getID(z, x, y);
    let tile = tiles[tileID];

    // If the tile exists and is ready, return it with cropping info
    if (tile && tile.complete && tile.naturalWidth !== 0) {
      tileObj.img = tile;
      tileObj.sx = sx;
      tileObj.sy = sy;
      tileObj.sw = sw;
      tileObj.found = true;
      return;
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

      getTileOrParent(tileObj, pz, px, py, psx, psy, psw); // recursive call!
    }

    if (!tile) {  // Tile didn't exist. Create it and request image from API
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

  function prune(metric, threshold) {
    // Remove tiles far from current view (as measured by metric)

    for ( let id in tiles ) {
      let distance = metric(tiles[id].zoom, tiles[id].indx, tiles[id].indy);
      if (distance >= threshold) {
        tiles[id].src = ""; // Cancel any outstanding request (is it necessary?)
        delete tiles[id];
      }
    }
    return;
  }

}

export { initTiles };
