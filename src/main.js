'use strict';

import { initMap2D } from "./map2D.js";
import { tileAPI } from "./mapbox-satellite.js";
import { initMercator } from "./proj-mercator.js";

function main() {
  // Setup 2D map
  const display = document.getElementById("rasterCanvas").getContext("2d");
  const overlay = document.getElementById("vectorCanvas").getContext("2d");
  const projection = initMercator();
  const map = initMap2D(display, overlay, tileAPI, projection);

  // Handle a supplied bounding box
  var westDeg = document.getElementById("west");
  var eastDeg = document.getElementById("east");
  var northDeg = document.getElementById("north");
  var southDeg = document.getElementById("south");
  var bboxSet = document.getElementById("bboxSet");
  bboxSet.addEventListener("click", function(click) {
    var p1 = [
      projection.lonToX( toRadians(westDeg.value) ),
      projection.latToY( toRadians(northDeg.value) )
    ];
    var p2 = [
      projection.lonToX( toRadians(eastDeg.value) ),
      projection.latToY( toRadians(southDeg.value) )
    ];
    map.fitBoundingBox(p1, p2);
  }, false);

  function toRadians(degrees) {
    return degrees * Math.PI / 180.0;
  };

  // Setup panning controls
  var up = document.getElementById("up");
  up.addEventListener("click", function(click) { map.pan(0, -1); }, false);
  var down = document.getElementById("down");
  down.addEventListener("click", function(click) { map.pan(0, 1); }, false);
  var left = document.getElementById("left");
  left.addEventListener("click", function(click) { map.pan(-1, 0); }, false);
  var right = document.getElementById("right");
  right.addEventListener("click", function(click) { map.pan(1, 0); }, false);

  // Setup zoom controls
  var zoomIn = document.getElementById("zoomIn");
  zoomIn.addEventListener("click", function(click) { map.zoomIn(); }, false);
  var zoomOut = document.getElementById("zoomOut");
  zoomOut.addEventListener("click", function(click) { map.zoomOut(); }, false);

  // Track loading status
  var loaded = document.getElementById("completion");
  // Start animation loop
  requestAnimationFrame(checkRender);
  function checkRender(time) {
    map.drawTiles();
    var percent = map.loaded() * 100;
    if (percent < 100) {
      loaded.innerHTML = "Loading: " + percent.toFixed(0) + "%";
    } else {
      loaded.innerHTML = "Complete! " + percent.toFixed(0) + "%";
    }
    requestAnimationFrame(checkRender);
  }
}

export { main };
