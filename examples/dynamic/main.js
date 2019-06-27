'use strict';

import { params } from "./wells.js";
import * as rasterMap from "../../dist/rastermap.bundle.js";
import { initTouchy } from 'touchy';

export function main() {
  // Get the map container div
  const mapDiv = document.getElementById("map");

  // Setup 2D map
  const display = document.getElementById("rasterCanvas").getContext("2d");
  const map = rasterMap.init(params, display);

  // Set up mouse tracking
  const cursor = initTouchy(mapDiv);

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

  // Get ready to print out feature info
  var info = document.getElementById("info");

  // Start animation loop
  requestAnimationFrame(checkRender);
  function checkRender(time) {
    map.drawTiles();

    // Report loading status
    var percent = map.loaded() * 100;
    loaded.innerHTML = (percent < 100)
      ? "Loading: " + percent.toFixed(0) + "%"
      : "Complete! 100%";

    // Find the well nearest to the cursor
    var box = mapDiv.getBoundingClientRect();
    var x = cursor.x() - box.left;
    var y = cursor.y() - box.top;
    var selected = map.select(x, y, 5, "wells", "TWDB_Groundwater_v2");

    // Get link to the highlighted-well style
    var highlighter;
    var layers = map.style().layers;
    if (layers) {
      highlighter = layers.find(layer => layer.id === "highlighted-well");
      if (!highlighter) {
        // do nothing
      } else if (selected && selected.properties) {
        highlighter.filter[2] = selected.properties.title.toString();
      } else {
        highlighter.filter[2] = "99999999999";
      }
      map.redraw("highlight");
    }

    info.innerHTML = "<pre>" + JSON.stringify(selected, null, 2) + "</pre>";

    requestAnimationFrame(checkRender);
  }
}
