'use strict';

import { params } from "./wells.js";
import * as rasterMap from "../../dist/rastermap.bundle.js";
import { initMapCursor } from "./cursorFeature.js";
import * as projection from "./proj-mercator.js";

export function main() {
  // Get the map container div
  const mapDiv = document.getElementById("map");

  // Setup 2D map
  const display = document.getElementById("rasterCanvas").getContext("2d");
  const overlay = document.getElementById("vectorCanvas").getContext("2d");
  const map = rasterMap.init(params, display, overlay);

  // Set up mouse tracking
  const cursor = initMapCursor(mapDiv, params);

  // Handle a supplied bounding box
  var westDeg = document.getElementById("west");
  var eastDeg = document.getElementById("east");
  var northDeg = document.getElementById("north");
  var southDeg = document.getElementById("south");
  var bboxSet = document.getElementById("bboxSet");
  bboxSet.addEventListener("click", function(click) {
    var p1 = [];
    projection.lonLatToXY( p1, 
        [toRadians(westDeg.value), toRadians(northDeg.value)] );
    var p2 = [];
    projection.lonLatToXY( p2,
        [toRadians(eastDeg.value), toRadians(southDeg.value)] );
    map.fitBoundingBox(p1, p2);
  }, false);

  function toRadians(degrees) {
    return degrees * Math.PI / 180.0;
  };

  // Setup panning controls
  var up = document.getElementById("up");
  up.addEventListener("click", function(click) { map.move(0, 0, -1); }, false);
  var down = document.getElementById("down");
  down.addEventListener("click", function(click) { map.move(0, 0, 1); }, false);
  var left = document.getElementById("left");
  left.addEventListener("click", function(click) { map.move(0, -1, 0); }, false);
  var right = document.getElementById("right");
  right.addEventListener("click", function(click) { map.move(0, 1, 0); }, false);

  // Setup zoom controls
  var zoomIn = document.getElementById("zoomIn");
  zoomIn.addEventListener("click", function(click) { map.move(1, 0, 0); }, false);
  var zoomOut = document.getElementById("zoomOut");
  zoomOut.addEventListener("click", function(click) { map.move(-1, 0, 0); }, false);

  // Track loading status and cursor position
  var loaded = document.getElementById("completion");
  var tooltip = document.getElementById("tooltip");
  // Start animation loop
  requestAnimationFrame(checkRender);
  function checkRender(time) {
    map.drawTiles();
    var percent = map.loaded() * 100;
    loaded.innerHTML = (percent < 100)
      ? "Loading: " + percent.toFixed(0) + "%"
      : "Complete! 100%";
    cursor.update();
    tooltip.innerHTML = "Tile index: (" + cursor.tilenum[0] + "," + cursor.tilenum[1] + ")";
    tooltip.innerHTML += "<br>Pixel: (" + cursor.tilepix[0] + "," + cursor.tilepix[1] + ")";
    requestAnimationFrame(checkRender);
  }
}
