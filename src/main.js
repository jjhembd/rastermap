'use strict';

import{ drawTiles } from "./drawTiles.js";

function main() {
  // Define some constants
  const minZoom = 1;
  const maxZoom = 19;

  // Set initial values
  var x0 = 1;
  var y0 = 0;
  var zoom = 1;

  // Setup canvases
  const visibleCanvas = document.getElementById("visibleCanvas");
  var display = visibleCanvas.getContext("2d", { premultipliedAlpha: false });
  display.canvas.width = display.canvas.clientWidth;
  display.canvas.height = display.canvas.clientHeight;
  console.log("display size: " + display.canvas.width + " x " + display.canvas.height);

  var up = document.getElementById("up");
  up.addEventListener("click", function(click) {
    y0--;
    drawTiles(display, x0, y0, zoom);
  }, false);
  var down = document.getElementById("down");
  down.addEventListener("click", function(click) {
    y0++;
    drawTiles(display, x0, y0, zoom);
  }, false);
  var left = document.getElementById("left");
  left.addEventListener("click", function(click) {
    x0--;
    drawTiles(display, x0, y0, zoom);
  }, false);
  var right = document.getElementById("right");
  right.addEventListener("click", function(click) {
    x0++;
    drawTiles(display, x0, y0, zoom);
  }, false);

  var zoomIn = document.getElementById("zoomIn");
  zoomIn.addEventListener("click", function(click) {
    //zoom = Math.min(zoom + 1, maxZoom);
    zoom++;
    x0 = 2 * x0 + 2; // TODO: these formula depend on numX, numY
    y0 = 2 * y0 + 1;
    drawTiles(display, x0, y0, zoom);
  }, false);
  var zoomOut = document.getElementById("zoomOut");
  zoomOut.addEventListener("click", function(click) {
    //zoom = Math.max(zoom - 1, minZoom);
    zoom--;
    x0 = Math.ceil( (x0 - 2) / 2 );
    y0 = Math.ceil( (y0 - 1) / 2 );
    drawTiles(display, x0, y0, zoom);
  }, false);

  drawTiles(display, x0, y0, zoom);
}

export { main };
