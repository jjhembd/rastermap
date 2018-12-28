'use strict';

import{ initMap2D } from "./map2D.js";
import { lonToWebMercX, latToWebMercY } from "./coords.js";

function main() {
  // Define some constants
  const minZoom = 1;
  const maxZoom = 19;

  // Set initial values
  var x0 = 1;
  var y0 = 0;
  var zoom = 1;

  // Setup 2D map
  const rasterCanvas = document.getElementById("rasterCanvas");
  var display = rasterCanvas.getContext("2d", { premultipliedAlpha: false });
  const vectorCanvas = document.getElementById("vectorCanvas");
  var overlay = vectorCanvas.getContext("2d");
  var map = initMap2D(display, overlay);

  // Handle a supplied bounding box
  var westDeg = document.getElementById("west");
  var eastDeg = document.getElementById("east");
  var northDeg = document.getElementById("north");
  var southDeg = document.getElementById("south");
  var bboxSet = document.getElementById("bboxSet");
  bboxSet.addEventListener("click", function(click) {
    var x1 = lonToWebMercX( toRadians(westDeg.value) );
    var y1 = latToWebMercY( toRadians(northDeg.value) );
    var x2 = lonToWebMercX( toRadians(eastDeg.value) );
    var y2 = latToWebMercY( toRadians(southDeg.value) );
    console.log("x1,y1  x2,y2 = " + x1 + "," + y1 + "  " + x2 + "," + y2);
    var bboxZXY = map.boundingBoxToZXY(x1, y1, x2, y2);
    if (!bboxZXY) {
      console.log("ERROR: Failed to define map containing this bounding box");
      return;
    }
    zoom = bboxZXY.zoom;
    x0 = bboxZXY.x0;
    y0 = bboxZXY.y0;
    map.drawTiles(zoom, x0, y0);
    // Draw the bounding box on the map
    var pix1 = map.xyToMapPixels(x1, y1, zoom, x0, y0);
    var pix2 = map.xyToMapPixels(x2, y2, zoom, x0, y0);
    overlay.strokeStyle = "#FF0000";
    overlay.strokeRect(pix1.x, pix1.y, pix2.x - pix1.x, pix2.y - pix1.y);
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
