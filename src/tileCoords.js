export function initTileCoords( tileAPI ) {

  // Initialize position and zoom of the map. All are integers
  var zoom = Math.floor( Math.log2( Math.max(tileAPI.nx, tileAPI.ny) ) );
  var xTile0 = 0;
  var yTile0 = 0;

  // Transform parameters
  var nTiles = 2 ** zoom;
  const origin = new Float64Array(2);
  const scale = new Float64Array(2);

  function updateTransform() {
    nTiles = 2 ** zoom;
    origin[0] = xTile0 / nTiles;
    origin[1] = yTile0 / nTiles;
    scale[0] = nTiles / tileAPI.nx; // Problematic if < 1 ?
    scale[1] = nTiles / tileAPI.ny;
  }
  // Initialize transform
  updateTransform();

  return {
    // Info about current map state
    getScale: function(i) { return scale[i]; },
    getZXY,

    // Methods to compute positions within current map
    toLocal,
    xyToMapPixels,
    tileDistance,

    // Methods to update map state
    fitBoundingBox,
    move,
  };

  function getZXY(zxy, ix, iy) {
    // Report the ZXY of a given tile within the grid
    zxy[0] = zoom;
    zxy[1] = wrap(xTile0 + ix, nTiles);
    zxy[2] = wrap(yTile0 + iy, nTiles);
    return;
  }

  function xyToMapPixels(local, global) {
    toLocal(local, global);
    local[0] *= tileAPI.nx * tileAPI.tileSize;
    local[1] *= tileAPI.ny * tileAPI.tileSize;
    return;
  }

  function tileDistance(z, x, y) {
    // Given input tile indices, return a distance metric
    // indicating how far the input tile is from the current map

    // Find edges of tile and map, in units of tiles at current map zoom
    var zoomFac = 2 ** (zoom - z);
    var tile = {
      x1: x * zoomFac,
      x2: (x + 1) * zoomFac,
      y1: y * zoomFac,
      y2: (y + 1) * zoomFac,
    }
    var map = {
      x1: xTile0,
      x2: xTile0 + tileAPI.nx + 1, // Note: may extend across antimeridian!
      y1: yTile0,
      y2: yTile0 + tileAPI.ny + 1, // Note: may extend across a pole!
    };

    // Find horizontal distance between current tile and edges of current map
    //  hdist < 0: part of input tile is within map
    //  hdist = 0: tile edge touches edge of map
    //  hdist = n: tile edge is n tiles away from edge of map,
    //             where a "tile" is measured at map zoom level

    // Note: need to be careful with distances crossing an antimeridian or pole
    var xdist = Math.min(
        // Test for non-intersection with tile in raw position
        Math.max(map.x1 - tile.x2, tile.x1 - map.x2),
        // Re-test with tile shifted across antimeridian 
        Math.max(map.x1 - (tile.x2 + nTiles), (tile.x1 + nTiles) - map.x2)
        );
    var ydist = Math.min(
        // Test for non-intersection with tile in raw position
        Math.max(map.y1 - tile.y2, tile.y1 - map.y2),
        // Re-test with tile shifted across pole 
        Math.max(map.y1 - (tile.y2 + nTiles), (tile.y1 + nTiles) - map.y2)
        );
    // Use the largest distance
    var hdist = Math.max(xdist, ydist);

    // Adjust for zoom difference
    return hdist - 1.0 + 1.0 / zoomFac;
  }

  function toLocal(local, global) {
    // Input global and output local are pointers to 2-element arrays [X,Y]

    // Translate to local origin. Question: should we just use vec2 routines?
    local[0] = global[0] - origin[0];
    local[1] = global[1] - origin[1];

    // Check for wrapping across antimeridian 
    // NOTE: if point is to left of origin, it will be wrapped to right?
    // We might prefer to put it as close as possible to the center
    local[0] = wrap(local[0], 1.0);

    // Scale to the size of the local map
    local[0] *= scale[0];
    local[1] *= scale[1];

    return;
  }

  function fitBoundingBox(p1, p2) {
    // Inputs p1, p2 are 2D arrays containing pairs of X/Y coordinates
    // in the range [0,1] X [0,1] with (0,0) at the top left corner.
    // ASSUMES p2 is SouthEast of p1 although we may have p2[0] < p1[0]
    // if the box crosses the antimeridian (longitude = +/- PI)
    // TODO: update comment, verify code for non-Mercator projections

    // Remember old values
    var oldZ = zoom;
    var oldX = xTile0;
    var oldY = yTile0;

    // 1. Calculate the maximum zoom level at which the bounding box will fit
    // within the map. Note: we want to be able to pan without having to change
    // zoom. Hence the bounding box must always fit within gridSize - 1.
    // (allows panning to where p1[0] is near the right edge of a tile.)

    // Compute box width and height, with special handling for antimeridian
    var boxWidth = p2[0] - p1[0];
    if (boxWidth < 0) boxWidth += 1.0; // Crossing antimeridian
    var boxHeight = p2[1] - p1[1];
    if (boxHeight < 0) return false;

    // Width/height of a tile: 1 / 2 ** zoom. Hence we need
    //  (gridSize? - 1) / 2 ** zoom > boxSize in both X and Y.
    // BUT we need the minimum zoom to have at least gridSize, i.e.,
    // min zoom = log2(gridSize).
    var zoomX = Math.log2( Math.max(tileAPI.nx, (tileAPI.nx - 1) / boxWidth) );
    var zoomY = Math.log2( Math.max(tileAPI.ny, (tileAPI.ny - 1) / boxHeight) );
    zoom = Math.floor( Math.min(zoomX, zoomY) );
    zoom = Math.min(zoom, tileAPI.maxZoom);
    nTiles = 2 ** zoom; // Number of tiles at this zoom level

    // 2. Compute the tile indices of the center of the box
    var centerX = (p1[0] + boxWidth / 2.0) * nTiles;
    if (centerX > nTiles) centerX -= nTiles;
    var centerY = 0.5 * (p1[1] + p2[1]) * nTiles;

    // 3. Find the integer tile numbers of the top left corner of the rectangle
    //    whose center will be within 1/2 tile of (centerX, centerY)
    xTile0 = Math.round(centerX - tileAPI.nx / 2.0);
    xTile0 = wrap(xTile0, nTiles); // in case we crossed the antimeridian
    yTile0 = Math.round(centerY - tileAPI.ny / 2.0);
    // Don't let box cross poles
    yTile0 = Math.min(Math.max(0, yTile0), nTiles - tileAPI.ny);

    // Return a flag indicating whether map parameters were updated
    if (zoom !== oldZ || xTile0 !== oldX || yTile0 !== oldY) {
      updateTransform();
      return true;
    }
    return false;
  }

  function move(dz, dx, dy) {
    // WARNING: Rounds dz, dx, dy to the nearest integer!
    var dzi = Math.round(dz);
    var dxi = Math.round(dx);
    var dyi = Math.round(dy);

    // Don't zoom beyond the limits of the API
    dzi = Math.min(Math.max(0 - zoom, dzi), tileAPI.maxZoom - zoom);

    var changed = (dzi || dxi || dyi);

    // Panning first
    xTile0 = wrap(xTile0 + dxi, nTiles);
    yTile0 = wrap(yTile0 + dyi, nTiles);

    // Zoom
    while (dzi > 0) {
      zoom++;
      xTile0 = Math.floor(2 * xTile0 + tileAPI.nx / 2.0);
      yTile0 = Math.floor(2 * yTile0 + tileAPI.ny / 2.0);
      dzi--;
    }
    while (dzi < 0) {
      zoom--;
      xTile0 = wrap( Math.ceil( (xTile0 - tileAPI.nx / 2.0) / 2 ), nTiles );
      yTile0 = wrap( Math.ceil( (yTile0 - tileAPI.ny / 2.0) / 2 ), nTiles );
      dzi++;
    }

    updateTransform();
    return changed;
  }

}

function wrap(x, xmax) {
  while (x < 0) x += xmax;
  while (x >= xmax) x -= xmax;
  return x;
}
