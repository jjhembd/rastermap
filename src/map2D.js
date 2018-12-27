function initMap2D(context) {
  // Define some parameters for a tiled map
  const tmsRoot = "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/";
  const token = "pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA";
  const tileSize = 256;
  const numTilesX = 4;
  const numTilesY = 2;
  const display = context;

  // Set canvas drawing buffer size equal to the CSS displayed size
  display.canvas.width = display.canvas.clientWidth;
  display.canvas.height = display.canvas.clientHeight;
  console.log("display size: " + display.canvas.width + 
      "x" + display.canvas.height);

  // Return methods for drawing a 2D map
  return {
    boundingBoxToZXY: boundingBoxToZXY,
    drawTiles: drawTiles,
  };

  function boundingBoxToZXY(minLon, minLat, maxLon, maxLat) {
    // 1. Compute floating point tile numbers of the supplied center location
    //  var centerTileX = (centerLon + Math.PI) * imax / (2.0 * Math.PI);
    //  var centerTileY = (Math.PI / 2 - centerLat) * imax / Math.PI;
    // 2. Find the integer tile numbers of the top left corner of the rectangle
    //    whose center will be within 1/2 tile of (centerTileX, centerTileY)
    //  var x0 = Math.round(centerTileX - numTilesX / 2.0);
    //  var y0 = Math.round(centerTileY - numTilesY / 2.0);
  }

  function drawTiles(zoom, x0, y0) {
    var imax = 2 ** zoom;
    // Load tiles and draw on canvas.
    // Note: could return images array instead of drawing on canvas?
    const images = [];
    for (let iy = 0; iy < numTilesY; iy++) {
      var ypx = iy * tileSize;
      var y = wrap(y0 + iy, imax);
      images[iy] = [];

      for (let ix = 0; ix < numTilesX; ix++) {
        var xpx = ix * tileSize;
        var x = wrap(x0 + ix, imax);
        images[iy][ix] = new Image();

        console.log(x + "," + y + ": " + xpx + "," + ypx);
        images[iy][ix].xpx = xpx;
        images[iy][ix].ypx = ypx;
        images[iy][ix].onload = drawTile;
        images[iy][ix].src = tmsRoot + tileSize + "/" + zoom + "/" + x + "/" + y + 
          "/" + "?access_token=" + token;
        console.log(images[iy][ix].src);
      }
    }
  }

  function drawTile() {
    display.drawImage(this, this.xpx, this.ypx);
  }
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
