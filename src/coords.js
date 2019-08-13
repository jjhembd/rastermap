export function initTileCoords( params ) {
  // Define a min zoom (if not supplied), such that there are always enough
  // tiles to cover the grid without repeating
  params.minZoom = (params.minZoom === undefined)
    ? Math.floor( Math.min(Math.log2(params.nx), Math.log2(params.ny)) )
    : params.minZoom;

  // Declare transform parameters
  var zoom, nTiles, xTile0, yTile0;
  const origin = new Float64Array(2);
  const scale = new Float64Array(2);

  // Set initial values
  setCenterZoom(params.center, params.zoom);

  return {
    // Info about current map state
    getScale: (i) => scale[i],
    getZXY,

    // Methods to compute positions within current map
    toLocal,
    xyToMapPixels,
    tileDistance,

    // Methods to update map state
    setCenterZoom,
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

  function xyToMapPixels(local, global) {
    toLocal(local, global);
    local[0] *= params.width;
    local[1] *= params.height;
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
      x2: xTile0 + params.nx + 1, // Note: may extend across antimeridian!
      y1: yTile0,
      y2: yTile0 + params.ny + 1, // Note: may extend across a pole!
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

  function setCenterZoom(center, newZoom) {
    // 0. Remember old values
    var oldZ = zoom;
    var oldX = xTile0;
    var oldY = yTile0;

    // 1. Make sure the supplied zoom is within range and an integer
    zoom = Math.min(Math.max(params.minZoom, newZoom), params.maxZoom);
    zoom = Math.floor(zoom); // TODO: should this be Math.round() ?
    nTiles = 2 ** zoom; // Number of tiles at this zoom level

    // 2. Find the integer tile numbers of the top left corner of the rectangle
    //    whose center will be within 1/2 tile of (centerX, centerY)
    xTile0 = Math.round(center[0] * nTiles - params.nx / 2.0);
    xTile0 = wrap(xTile0, nTiles); // in case we crossed the antimeridian

    yTile0 = Math.round(center[1] * nTiles - params.ny / 2.0);
    yTile0 = Math.min(Math.max(0, yTile0), nTiles - params.ny); // Don't cross pole

    // 3. Return a flag indicating whether map parameters were updated
    if (zoom === oldZ && xTile0 === oldX && yTile0 === oldY) return false;
    updateTransform();
    return true;
  }

  function fitBoundingBox(p1, p2) {
    // Inputs p1, p2 are 2D arrays containing pairs of X/Y coordinates
    // in the range [0,1] X [0,1] with (0,0) at the top left corner.
    // ASSUMES p2 is SouthEast of p1 although we may have p2[0] < p1[0]
    // if the box crosses the antimeridian (longitude = +/- PI)
    // TODO: update comment, verify code for non-Mercator projections

    // Compute box width and height, with special handling for antimeridian
    var boxWidth = p2[0] - p1[0];
    if (boxWidth < 0) boxWidth += 1.0; // Crossing antimeridian
    var boxHeight = p2[1] - p1[1];
    if (boxHeight < 0) return false;

    // Calculate the maximum zoom level at which the bounding box will fit
    // within the map. Note: we want to be able to pan without having to change
    // zoom. Hence the bounding box must always fit within gridSize - 1.
    // (allows panning to where p1[0] is near the right edge of a tile.)

    // Width/height of a tile: 1 / 2 ** zoom. Hence we need
    //  (gridSize? - 1) / 2 ** zoom > boxSize in both X and Y.
    var zoomX = Math.log2( (params.nx - 1) / boxWidth );
    var zoomY = Math.log2( (params.ny - 1) / boxHeight );

    // Compute the coordinates of the center of the box
    var centerX = (p1[0] + boxWidth / 2.0);
    if (centerX > 1) centerX -= 1;
    var centerY = 0.5 * (p1[1] + p2[1]);

    return setCenterZoom( [centerX, centerY], Math.min(zoomX, zoomY) );
  }

  function updateTransform() {
    nTiles = 2 ** zoom;
    origin[0] = xTile0 / nTiles;
    origin[1] = yTile0 / nTiles;
    scale[0] = nTiles / params.nx; // Problematic if < 1 ?
    scale[1] = nTiles / params.ny;
  }

  function move(dz, dx, dy) {
    var dzi = Math.round(dz);
    var dxi = Math.round(dx);
    var dyi = Math.round(dy);

    // Don't zoom beyond the limits of the API
    dzi = Math.min(Math.max(0 - zoom, dzi), params.maxZoom - zoom);

    var changed = (dzi || dxi || dyi);

    // Panning first
    xTile0 = wrap(xTile0 + dxi, nTiles);
    yTile0 = wrap(yTile0 + dyi, nTiles);

    while (dzi > 0) {  // Zoom in
      zoom++;
      xTile0 = Math.floor(2 * xTile0 + params.nx / 2.0);
      yTile0 = Math.floor(2 * yTile0 + params.ny / 2.0);
      dzi--;
    }
    while (dzi < 0) {  // Zoom out
      zoom--;
      xTile0 = wrap( Math.ceil( (xTile0 - params.nx / 2.0) / 2 ), nTiles );
      yTile0 = wrap( Math.ceil( (yTile0 - params.ny / 2.0) / 2 ), nTiles );
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
