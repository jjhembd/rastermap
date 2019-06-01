export function initTileCache(size, tileFactory) {
  // Initialize the tiles object
  const tiles = {};

  // Return methods for accessing and updating the tiles
  return {
    retrieve: (zxy) => getTileOrParent(zxy[0], zxy[1], zxy[2], 0, 0, size),
    prune,
  };

  function getTileOrParent(
      z, x, y,     // Coordinates of the requested tile
      sx, sy, sw   // Cropping parameters--which part of the tile to use
      ) {

    // Retrieve the specified tile from the tiles object, add cropping info
    let id = z + "/" + x + "/" + y;
    let tile = tiles[id];
    let tilebox = { tile, sx, sy, sw };

    // If the tile exists and is ready, return it (along with the wrapped info)
    if (tile && tile.rendered) return tilebox;

    // Looks like the tile wasn't ready. Try using the parent tile
    if (z > 0 && sw > 1) { // Don't look too far back
      // Get coordinates and cropping parameters of the parent
      let pz = z - 1;
      let px = Math.floor(x / 2);
      let py = Math.floor(y / 2);
      let psx = sx / 2 + (x / 2 - px) * size;
      let psy = sy / 2 + (y / 2 - py) * size;
      let psw = sw / 2;

      tilebox = getTileOrParent(pz, px, py, psx, psy, psw); // recursive call!
    }

    // If the requested tile didn't exist, we need to order it from the factory
    // NOTE: orders are placed AFTER the recursive call for the parent tile,
    // so missing parents will be ordered first
    if (!tiles[id]) { 
      let newTile = tileFactory.create(z, x, y);
      if (newTile) tiles[id] = newTile;
    }

    return (tilebox && tilebox.tile && tilebox.tile.rendered)
      ? tilebox
      : undefined;
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
