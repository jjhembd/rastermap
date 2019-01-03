import { initTiledTexture } from "./webgl-textures.js";

function initMap2D(rasterContext, vectorContext) {
  // Define some parameters for a tiled map texture
  const tmsRoot = "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/";
  const token = "pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA";
  const tileSize = 256;
  const numTilesX = 4;
  const numTilesY = 3;
  const display = rasterContext;
  const overlay = vectorContext;

  // Initialize position and zoom of the map
  var zoom = 2;
  var x0 = 0;
  var y0 = 0;

  // Set canvas drawing buffer size equal to the CSS displayed size
  display.canvas.width = display.canvas.clientWidth;
  display.canvas.height = display.canvas.clientHeight;
  overlay.canvas.width = display.canvas.clientWidth;
  overlay.canvas.height = display.canvas.clientHeight;

  // Initialize the WebGL texture
  const tileTex = initTiledTexture(display, numTilesX, numTilesY, tileSize);

  // Load tiles to the texture for the initial map
  drawTiles();

  // Return methods for updating the tiles, along with the texture sampler
  return {
    pan,
    zoomIn,
    zoomOut,
    fitBoundingBox,
    xyToMapPixels,
    sampler: tileTex.sampler,
  };

  function pan(dx, dy) {
    x0 += dx;
    y0 += dy;
    drawTiles();
  }

  function zoomIn() {
    zoom++;
    x0 = Math.floor(2 * x0 + numTilesX / 2.0);
    y0 = Math.floor(2 * y0 + numTilesY / 2.0);
    drawTiles();
  }

  function zoomOut() {
    zoom--;
    x0 = Math.ceil( (x0 - numTilesX / 2.0) / 2 );
    y0 = Math.ceil( (y0 - numTilesY / 2.0) / 2 );
    drawTiles();
  }

  function fitBoundingBox(x1, y1, x2, y2) {
    // Inputs x1,y1, x2,y2 are Web Mercator coordinates in the range 
    // [0,1] X [0,1] with (0,0) at the top left corner.
    // ASSUMES (x2,y2) is SouthEast of (x1,y1) although we may have x2 < x1
    // if the box crosses the antimeridian (longitude = +/- PI)

    // Remember old values
    var oldZ = zoom;
    var oldX = x0;
    var oldY = y0;

    // 1. Calculate the maximum zoom level at which the bounding box will fit
    // within the map. Note: we want to be able to pan without having to change
    // zoom. Hence the bounding box must always fit within numTiles - 1.
    // (allows panning to where x1 is near the right edge of a tile.)

    // Compute box width and height, with special handling for antimeridian
    var boxWidth = x2 - x1;
    if (boxWidth < 0) boxWidth += 1.0; // Crossing antimeridian
    if (boxWidth > 0.5) return false;  // x1 and x2 are flipped?
    var boxHeight = y2 - y1;
    if (boxHeight < 0) return false;

    // Width/height of a tile: 1 / 2 ** zoom. Hence we need
    //  (numTiles? - 1) / 2 ** zoom > boxSize in both X and Y.
    var zoomX = Math.log2( (numTilesX - 1) / boxWidth );
    var zoomY = Math.log2( (numTilesY - 1) / boxHeight );
    zoom = Math.floor( Math.min(zoomX, zoomY) );
    var imax = 2 ** zoom; // Number of tiles at this zoom level

    // 2. Compute the tile indices of the center of the box
    var centerX = (x1 + boxWidth / 2.0) * imax;
    if (centerX > imax) centerX -= imax;
    var centerY = 0.5 * (y1 + y2) * imax;

    // 3. Find the integer tile numbers of the top left corner of the rectangle
    //    whose center will be within 1/2 tile of (centerX, centerY)
    x0 = Math.round(centerX - numTilesX / 2.0);
    x0 = wrap(x0, imax);  // in case we pushed x0 back across the antimeridian
    y0 = Math.round(centerY - numTilesY / 2.0);

    if (zoom !== oldZ || x0 !== oldX || y0 !== oldY) drawTiles();
    return true;
  }

  function xyToMapPixels(webMercX, webMercY) {
    var imax = 2 ** zoom; // Number of tiles at this zoom level

    // Convert input point to fractional number of tiles from x0, y0
    var rx = webMercX * imax - x0;
    if (rx < 0) rx += imax; // Crossed longitude = 180
    if (rx > numTilesX) return false; // Outside the map!
    var ry = webMercY * imax - y0;
    if (ry < 0 || ry > numTilesY) return false; // Outside the map!

    return { // Convert to number of pixels
      x: rx * tileSize, 
      y: ry * tileSize,
    };
  }

  function drawTiles() {
    overlay.clearRect(0, 0, overlay.canvas.width, overlay.canvas.height);
    var imax = 2 ** zoom;
    // Load tiles and draw on canvas.
    // Note: could return images array instead of drawing on canvas?
    const images = [];
    for (let iy = 0; iy < numTilesY; iy++) {
      images[iy] = [];
      var y = wrap(y0 + iy, imax);
      var ypx = iy * tileSize;

      for (let ix = 0; ix < numTilesX; ix++) {
        images[iy][ix] = new Image();
        var x = wrap(x0 + ix, imax);
        var zxyString = "/" + zoom + "/" + x + "/" + y + "/";
        //console.log("zxyString: " + zxyString);

        images[iy][ix].xoffset = ix * tileSize;
        images[iy][ix].yoffset = ypx;
        //images[iy][ix].onload = drawTile;
        images[iy][ix].onload = tileTex.updateTile;
        images[iy][ix].crossOrigin = "anonymous";
        images[iy][ix].src = tmsRoot + tileSize + zxyString + 
          "?access_token=" + token;
      }
    }
  }

  //function drawTile() {
  //  display.drawImage(this, this.xpx, this.ypx);
  //}
}

function wrap(x, xmax) {
  while (x < 0) {
    x += xmax;
  }
  while (x >= xmax) {
    x -= xmax;
  }
  return x;
}

export { initMap2D };
