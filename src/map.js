export function initMap(params, renderer, coords, tiles) {
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
    drawTiles,
    reset,
    loaded: () => mapStatus.complete,
  };

  function drawTiles() {
    // Quick exit if map is already complete.
    if ( mapStatus.complete === 1.0 ) return false; // No change!

    var updated = false;
    const zxy = [];

    // Loop over tiles in the map
    for (let iy = 0; iy < params.ny; iy++) {
      for (let ix = 0; ix < params.nx; ix++) {
        if (mapStatus.dz[iy][ix] === 0) continue; // This tile already done

        coords.getZXY(zxy, ix, iy);
        var tilebox = tiles.retrieve( zxy );
        if (!tilebox) continue; // No image available for this tile
        var dzTmp = zxy[0] - tilebox.tile.z;
        if (dzTmp == mapStatus.dz[iy][ix]) continue; // Tile already written

        renderer.draw(tilebox, ix, iy);
        updated = true;

        if (dzTmp == 0) mapStatus.complete += oneTileComplete;
        mapStatus.dz[iy][ix] = dzTmp;
      }
    }
    return updated;
  }

  function reset() {
    mapStatus.reset();
    renderer.clear();
    return;
  }
}
