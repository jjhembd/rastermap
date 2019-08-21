import { initTileCoords } from "./coords.js";
import { initRenderer } from "./renderer.js";

export function initGrid(params, context, tiles) {
  // Initialize coordinates and renderer
  const coords = initTileCoords(params);
  const renderer = initRenderer(context, params);

  // Initialize status tracking for tile loading
  const oneTileComplete = 1. / params.nx / params.ny;
  var complete = 0.0;

  // Initialize array of tileboxes and function to reset it
  const boxes = []; //Array(params.ny).fill([]);
  function reset() {
    //boxes.fill([]); // Doesn't work... not sure why not
    for (let iy = 0; iy < params.ny; iy++) {
      boxes[iy] = [];
    }
    complete = 0.0;
  }
  reset();
  function clear() { // TODO: Do we ever need reset without clear?
    reset();
    renderer.clear();
  }

  // Return methods for updating and rendering a grid of tiles
  return {
    loaded: () => complete,
    boxes,
    reset,
    clear,
    drawTiles,

    move: (dz, dx, dy) => { if (coords.move(dz, dx, dy)) clear(); },
    fitBoundingBox: (p1, p2) => { if (coords.fitBoundingBox(p1, p2)) clear(); },
    setCenterZoom: (c, z) => { if (coords.setCenterZoom(c, z)) clear(); },

    toLocal: coords.toLocal,
    xyToMapPixels: coords.xyToMapPixels,
    getScale: coords.getScale,

    tileDistance: coords.tileDistance,
  };

  function drawTiles() {
    // Quick exit if map is already complete.
    if (complete === 1.0) return false; // No change!

    var updated = false;
    const zxy = [];

    // Loop over tiles in the map
    for (let iy = 0; iy < params.ny; iy++) {
      var row = boxes[iy];
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

        if (newbox.tile.z === zxy[0]) complete += oneTileComplete;
      }
    }
    return updated;
  }
}
