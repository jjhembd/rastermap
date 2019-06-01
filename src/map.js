export function initMap(params, renderer, coords, tiles) {
  const oneTileComplete = 1. / params.nx / params.ny;

  const grid = {
    complete: 0.0,
    tileboxes: [],
    reset: function() {
      for (let iy = 0; iy < params.ny; iy++) {
        this.tileboxes[iy] = [];
      }
      this.complete = 0.0;
    },
  }
  grid.reset(); // Initialize array of tileboxes

  // Return methods for drawing a 2D map
  return {
    drawTiles,
    reset,
    loaded: () => grid.complete,
  };

  function drawTiles() {
    // Quick exit if map is already complete.
    if (grid.complete === 1.0) return false; // No change!

    var updated = false;
    const zxy = [];

    // Loop over tiles in the map
    for (let iy = 0; iy < params.ny; iy++) {
      var row = grid.tileboxes[iy];
      for (let ix = 0; ix < params.nx; ix++) {
        coords.getZXY(zxy, ix, iy);
        var currentZ = (row[ix]) 
          ? row[ix].tile.z
          : undefined;
        if (currentZ === zxy[0]) continue; // This tile already done

        var newbox = tiles.retrieve( zxy );
        if (!newbox) continue; // No image available for this tile
        if (newbox.tile.z === currentZ) continue; // Tile already written

        row[ix] = newbox;
        renderer.draw(newbox, ix, iy);
        updated = true;

        if (newbox.tile.z === zxy[0]) grid.complete += oneTileComplete;
      }
    }
    return updated;
  }

  function reset() {
    grid.reset();
    renderer.clear();
    return;
  }
}
