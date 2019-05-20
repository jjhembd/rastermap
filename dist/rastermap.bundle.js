function initTileCoords( params ) {

  // Initialize position and zoom of the map. All are integers
  var zoom = Math.floor( Math.log2( Math.max(params.nx, params.ny) ) );
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
    scale[0] = nTiles / params.nx; // Problematic if < 1 ?
    scale[1] = nTiles / params.ny;
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
    local[0] *= params.nx * params.tileSize;
    local[1] *= params.ny * params.tileSize;
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
    };
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
    var zoomX = Math.log2( Math.max(params.nx, (params.nx - 1) / boxWidth) );
    var zoomY = Math.log2( Math.max(params.ny, (params.ny - 1) / boxHeight) );
    zoom = Math.floor( Math.min(zoomX, zoomY) );
    zoom = Math.min(zoom, params.maxZoom);
    nTiles = 2 ** zoom; // Number of tiles at this zoom level

    // 2. Compute the tile indices of the center of the box
    var centerX = (p1[0] + boxWidth / 2.0) * nTiles;
    if (centerX > nTiles) centerX -= nTiles;
    var centerY = 0.5 * (p1[1] + p2[1]) * nTiles;

    // 3. Find the integer tile numbers of the top left corner of the rectangle
    //    whose center will be within 1/2 tile of (centerX, centerY)
    xTile0 = Math.round(centerX - params.nx / 2.0);
    xTile0 = wrap(xTile0, nTiles); // in case we crossed the antimeridian
    yTile0 = Math.round(centerY - params.ny / 2.0);
    // Don't let box cross poles
    yTile0 = Math.min(Math.max(0, yTile0), nTiles - params.ny);

    // Return a flag indicating whether map parameters were updated
    if (zoom !== oldZ || xTile0 !== oldX || yTile0 !== oldY) {
      updateTransform();
      return true;
    }
    return false;
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

function initTileFactory(tileAPI) {
  // This closure just stores the tileAPI for use in the returned method

  function orderTile(z, x, y) {
    // Declare main tile object and properties
    const tile = {
      z, x, y,
      ready: false,
    };

    // Request the data
    const data = new Image();
    data.onerror = requestError;
    data.onload = checkData;
    data.crossOrigin = "anonymous";
    data.src = tileAPI.getURL( tileAPI.getID(z, x, y) );

    function checkData() {
      tile.ready = (data.complete && data.naturalWidth !== 0);
    }

    function requestError(err) {
      console.log("Request error in orderTile: " + err);
      // delete this tile? Or flag it for reloading?
    }

    // Add to the tile object and return
    tile.data = data;
    return tile;
  }

  return orderTile;
}

function initTileCache(tileAPI, tileFactory) {
  const size = tileAPI.tileSize;

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
    let id = z + "/" + x + "/" + y; //tileAPI.getID(z, x, y);

    // If the tile exists and is ready, return it with cropping info
    if (tiles[id] && tiles[id].ready) {
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
    if (!tiles[id]) tiles[id] = tileFactory(z, x, y);

    return;
  }

  function prune(metric, threshold) {
    // Remove tiles far from current view (as measured by metric)

    for ( let id in tiles ) {
      let distance = metric(tiles[id].zoom, tiles[id].indx, tiles[id].indy);
      if (distance >= threshold) {
        tiles[id].data.src = ""; // Cancel any outstanding request (is it necessary?)
        delete tiles[id];
      }
    }
    return;
  }
}

function initRenderer(context, params) {
  const size = params.tileSize;
  const mapWidth = params.nx * size;
  const mapHeight = params.ny * size;

  // Resize drawingbuffer to fit the specified number of tiles
  context.canvas.width = mapWidth;
  context.canvas.height = mapHeight;

  return {
    draw,
    clear,
  };

  function clear() {
    return context.clearRect(0, 0, mapWidth, mapHeight);
  }

  function draw(tilebox, ix, iy) {
    context.drawImage(
        tilebox.tile.data, // Image to read, and paint to the canvas
        tilebox.sx,        // First x-pixel in tile to read
        tilebox.sy,        // First y-pixel in tile to read
        tilebox.sw,        // Number of pixels to read in x
        tilebox.sw,        // Number of pixels to read in y
        ix * size,         // First x-pixel in canvas to paint
        iy * size,         // First y-pixel in canvas to paint
        size,              // Number of pixels to paint in x
        size               // Number of pixels to paint in y
        );
    return;
  }
}

function initMap(params, renderer, coords, tiles) {
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
  };
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
    const tilebox = {};
    const zxy = [];

    // Loop over tiles in the map
    for (let iy = 0; iy < params.ny; iy++) {
      for (let ix = 0; ix < params.nx; ix++) {
        if (mapStatus.dz[iy][ix] === 0) continue; // This tile already done

        coords.getZXY(zxy, ix, iy);
        var foundTile = tiles.retrieve( tilebox, zxy );
        if (!foundTile) continue; // No image available for this tile
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

function initBoxQC(overlay, coords, width, height) {

  // Resize canvases to fit the specified number of tiles
  overlay.canvas.width = width;
  overlay.canvas.height = height;

  // Track status of bounding box for QC
  const boxQC = [ [0,0], [0,0] ];
  const pixQC = [ [0,0], [0,0] ];

  // Return methods for drawing the QC
  return {
    draw,
    reset,
  };

  function draw(p1, p2, mapChanged) {
    // Check if bounding box changed since last call
    var boxChanged = updateBox(boxQC, [p1, p2]);
    if (!boxChanged && !mapChanged) return;

    // Special case: box moved but map didn't
    if (!mapChanged) overlay.clearRect(0, 0, width, height);

    // Convert box to map pixels
    coords.xyToMapPixels( pixQC[0], boxQC[0] );
    coords.xyToMapPixels( pixQC[1], boxQC[1] );

    // Draw bounding box on overlay
    overlay.strokeStyle = "#FF0000";
    overlay.lineWidth = 5;
    overlay.strokeRect(
        pixQC[0][0],
        pixQC[0][1],
        pixQC[1][0] - pixQC[0][0],
        pixQC[1][1] - pixQC[0][1]
        );

    return;
  }

  function updateBox(bOld, bNew) {
    var same = (
        bNew[0][0] === bOld[0][0] &&
        bNew[0][1] === bOld[0][1] &&
        bNew[1][0] === bOld[1][0] &&
        bNew[1][1] === bOld[1][1]
        );
    if (same) return false;

    // Box changed. Do a deep copy
    bOld[0][0] = bNew[0][0];
    bOld[0][1] = bNew[0][1];
    bOld[1][0] = bNew[1][0];
    bOld[1][1] = bNew[1][1];
    return true;
  }

  function reset() {
    overlay.clearRect(0, 0, width, height);
    boxQC[0][0] = 0;
    boxQC[0][1] = 0;
    boxQC[1][0] = 0;
    boxQC[1][1] = 0;
    return;
  }
}

function init(params, context, overlay) {
  // Check if we have a valid canvas rendering context
  var haveRaster = context instanceof CanvasRenderingContext2D;
  if (!haveRaster) {
    console.log("WARNING in rastermap.init: not a 2D rendering context!");
    //return false;
  }

  // Compute pixel size of map
  const mapWidth = params.nx * params.tileSize;
  const mapHeight = params.ny * params.tileSize;
  console.log("map size: " + mapWidth + "x" + mapHeight);

  // Setup tile coordinates and associated methods
  const coords = initTileCoords( params );

  // Initialize a tile factory function and a cache of loaded tiles
  const tileFactory = initTileFactory( params );
  const tiles = initTileCache( params, tileFactory );

  // Initialize renderer, to draw the tiles on the canvas
  const renderer = initRenderer(context, params);
  // Initialize grid of rendered tiles
  const map = initMap(params, renderer, coords, tiles);

  // Initialize bounding box QC overlay
  var boxQC;
  var haveVector = overlay instanceof CanvasRenderingContext2D;
  if (haveVector) {
    boxQC = initBoxQC(overlay, coords, mapWidth, mapHeight);
  }

  // Return methods for drawing a 2D map
  return {
    drawTiles,
    loaded: map.loaded,
    move: function(dz, dx, dy) {
      var changed = coords.move(dz, dx, dy);
      if (changed) reset();
    },
    fitBoundingBox,
    toLocal: coords.toLocal,
    getScale: coords.getScale,
    xyToMapPixels: coords.xyToMapPixels,
  };

  function fitBoundingBox(p1, p2) {
    var mapChanged = coords.fitBoundingBox(p1, p2);
    if (mapChanged) reset();
    if (haveVector) boxQC.draw(p1, p2, mapChanged);
    return;
  }

  function drawTiles() {
    var updated = map.drawTiles();
    // Clean up -- don't let images object get too big
    tiles.prune(coords.tileDistance, 3.5);
    return updated;
  }

  function reset() {
    map.reset();
    if (haveVector) boxQC.reset();
    return;
  }
}

export { init };
