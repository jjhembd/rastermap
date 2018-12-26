function drawTiles(display, x0, y0, zoom) {
  // Define some constants
  const tmsRoot = "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/";
  const token = "pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA";
  const tileSize = 256;
  const numX = 4;
  const numY = 2;

  var imax = 2 ** zoom;

  // Load tiles and draw on canvas.
  // Note: could return images array instead of drawing on canvas?
  const images = [];
  for (let iy = 0; iy < numY; iy++) {
    var ypx = iy * tileSize;
    var y = wrap(y0 + iy, imax);
    images[iy] = [];

    for (let ix = 0; ix < numX; ix++) {
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

export { drawTiles };
