export function initMap(params, context, coords, tiles) {
  // Resize canvas to fit the specified number of tiles
  const size = params.tileSize;
  const mapWidth = params.nx * size;
  const mapHeight = params.ny * size;
  context.canvas.width = mapWidth;
  context.canvas.height = mapHeight;

  // Initialize tracking object, to check if map needs to be updated
  const dz = [];
  for (let iy = 0; iy < params.ny; iy++) {
    dz[iy] = [];
  }
  const oneTileComplete = 1. / params.nx / params.ny;
  const mapStatus = {
    complete: 0.0,
    dz,
    reset: function() {
      this.complete = 0.0;
      for (let iy = 0; iy < params.ny; iy++) {
        for (let ix = 0; ix < params.nx; ix++) {
          // dz indicates the difference between the requested zoom level
          // and the zoom level actually written to this tile
          dz[iy][ix] = params.maxZoom;
        }
      }
      return;
    },
  }
  mapStatus.reset(); // Initializes dz

  // Return methods for drawing a 2D map
  return {
    loaded: function() {
      return mapStatus.complete;
    },
    drawTiles,
    reset,
  };

  function drawTiles() {
    // Quick exit if map is already complete.
    if ( mapStatus.complete === 1.0 ) return false; // No change!

    var updated = false;
    const tileObj = {};
    const zxy = [];

    // Loop over tiles in the map
    for (let iy = 0; iy < params.ny; iy++) {
      for (let ix = 0; ix < params.nx; ix++) {
        if (mapStatus.dz[iy][ix] === 0) continue; // This tile already done

        coords.getZXY(zxy, ix, iy);
        var foundTile = tiles.retrieve( tileObj, zxy );
        if (!foundTile) continue; // No image available for this tile
        var dzTmp = zxy[0] - tileObj.img.zoom;
        if (dzTmp == mapStatus.dz[iy][ix]) continue; // Tile already written

        context.drawImage(
            tileObj.img,    // Image to read, and paint to the canvas
            tileObj.sx,     // First x-pixel in tile to read
            tileObj.sy,     // First y-pixel in tile to read
            tileObj.sw,     // Number of pixels to read in x
            tileObj.sw,     // Number of pixels to read in y
            ix * size,      // First x-pixel in canvas to paint
            iy * size,      // First y-pixel in canvas to paint
            size,           // Number of pixels to paint in x
            size            // Number of pixels to paint in y
            );
        updated = true;

        if (dzTmp == 0) mapStatus.complete += oneTileComplete;
        mapStatus.dz[iy][ix] = dzTmp;
      }
    }
    return updated;
  }

  function reset() {
    mapStatus.reset();
    context.clearRect(0, 0, mapWidth, mapHeight);
    return;
  }
}
