export function initTileCache(size, tileFactory) {
  // Initialize the tiles object
  const tiles = {};

  // Return methods for accessing and updating the tiles
  return {
    retrieve,
    prune,
  };

  function retrieve(tilebox, zxy) {
    tilebox.full = false;
    getTileOrParent(tilebox, zxy[0], zxy[1], zxy[2], 0, 0, size);
    return tilebox.full;
  }

  function getTileOrParent(
      tilebox,     // Returned tile object
      z, x, y,     // Coordinates of the requested tile
      sx, sy, sw   // Cropping parameters--which part of the tile to use
      ) {

    // Retrieve the specified tile from the tiles object
    let id = z + "/" + x + "/" + y;

    // If the tile exists and is ready, return it with cropping info
    if (tiles[id] && tiles[id].rendered) {
      tilebox.tile = tiles[id];
      tilebox.sx = sx;
      tilebox.sy = sy;
      tilebox.sw = sw;
      tilebox.full = true;
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

      getTileOrParent(tilebox, pz, px, py, psx, psy, psw); // recursive call!
    }

    // If the requested tile didn't exist, we need to order it from the factory
    // NOTE: orders are placed AFTER the recursive call for the parent tile,
    // so missing parents will be ordered first
    if (!tiles[id]) { 
      let tnew = tileFactory.create(z, x, y);
      if (tnew) tiles[id] = tnew;
    }

    return;
  }

  function prune(metric, threshold) {
    // Remove tiles far from current view (as measured by metric)

    for ( let id in tiles ) {
      let distance = metric(tiles[id].z, tiles[id].x, tiles[id].y);
      if (distance >= threshold) delete tiles[id];
    }
    return;
  }
}
