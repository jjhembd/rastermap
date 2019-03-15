function initMap2D(display, overlay) {
  // Define some parameters for a tiled map
  const numTilesX = 4;
  const numTilesY = 3;

  // Set canvas drawing buffer size equal to the CSS displayed size
  display.canvas.width = display.canvas.clientWidth;
  display.canvas.height = display.canvas.clientHeight;
  overlay.canvas.width = display.canvas.clientWidth;
  overlay.canvas.height = display.canvas.clientHeight;
  console.log("display size: " + display.canvas.width + 
      "x" + display.canvas.height);

  // Return methods for drawing a 2D map
  return {
    drawTiles,
  };

  function drawTiles(zoom, x0, y0) {
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

        images[iy][ix].xpx = ix * tileSize;
        images[iy][ix].ypx = ypx;
        images[iy][ix].onload = drawTile;
        images[iy][ix].src = tmsRoot + tileSize + zxyString + 
          "?access_token=" + token;
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
