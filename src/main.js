'use strict';

import{ initMap2D } from "./map2D.js";

function main() {
  // Setup 2D map
  const display = document.getElementById("rasterCanvas").getContext("2d");
  const overlay = document.getElementById("vectorCanvas").getContext("2d");
  var map = initMap2D(display, overlay);

  // Handle a supplied bounding box
  var westDeg = document.getElementById("west");
  var eastDeg = document.getElementById("east");
  var northDeg = document.getElementById("north");
  var southDeg = document.getElementById("south");
  var bboxSet = document.getElementById("bboxSet");
  bboxSet.addEventListener("click", function(click) {
    var p1 = [
      lonToWebMercX( toRadians(westDeg.value) ),
      latToWebMercY( toRadians(northDeg.value) )
    ];
    var p2 = [
      lonToWebMercX( toRadians(eastDeg.value) ),
      latToWebMercY( toRadians(southDeg.value) )
    ];
    map.fitBoundingBox(p1, p2);
  }, false);

  function toRadians(degrees) {
    return degrees * Math.PI / 180.0;
  };

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
