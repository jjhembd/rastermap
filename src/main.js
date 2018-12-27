'use strict';

import{ initMap2D } from "./map2D.js";

function main() {
  // Define some constants
  const minZoom = 1;
  const maxZoom = 19;

  // Set initial values
  var x0 = 1;
  var y0 = 0;
  var zoom = 1;

  // Setup 2D map
  const visibleCanvas = document.getElementById("visibleCanvas");
  var display = visibleCanvas.getContext("2d", { premultipliedAlpha: false });
  var map = initMap2D(display);

  // Setup panning controls
  var up = document.getElementById("up");
  up.addEventListener("click", function(click) {
    y0--;
    map.drawTiles(zoom, x0, y0);
  }, false);
  var down = document.getElementById("down");
  down.addEventListener("click", function(click) {
    y0++;
    map.drawTiles(zoom, x0, y0);
  }, false);
  var left = document.getElementById("left");
  left.addEventListener("click", function(click) {
    x0--;
    map.drawTiles(zoom, x0, y0);
  }, false);
  var right = document.getElementById("right");
  right.addEventListener("click", function(click) {
    x0++;
    map.drawTiles(zoom, x0, y0);
  }, false);

  // Setup zoom controls
  var zoomIn = document.getElementById("zoomIn");
  zoomIn.addEventListener("click", function(click) {
    //zoom = Math.min(zoom + 1, maxZoom);
    zoom++;
    x0 = 2 * x0 + 2; // TODO: these formula depend on numX, numY
    y0 = 2 * y0 + 1;
    map.drawTiles(zoom, x0, y0);
  }, false);
  var zoomOut = document.getElementById("zoomOut");
  zoomOut.addEventListener("click", function(click) {
    //zoom = Math.max(zoom - 1, minZoom);
    zoom--;
    x0 = Math.ceil( (x0 - 2) / 2 );
    y0 = Math.ceil( (y0 - 1) / 2 );
    map.drawTiles(zoom, x0, y0);
  }, false);

  map.drawTiles(zoom, x0, y0);
}

export { main };
