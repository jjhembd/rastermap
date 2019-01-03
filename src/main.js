'use strict';

import { initMap2D } from "./map2D.js";
import { lonToWebMercX, latToWebMercY } from "./coords.js";
import * as shaders from "./shaders.js";
import { initShaderProgram, drawScene } from "./webgl-utils.js";
import { initBuffers } from "./initBuffers.js";

function main() {
  // Get graphics contexts for canvases
  // WebGL canvas for drawing raster tiles
  const rasterCanvas = document.getElementById("rasterCanvas");
  var display = rasterCanvas.getContext("webgl", { premultipliedAlpha: false });
  // 2D canvas for vector overlays
  const vectorCanvas = document.getElementById("vectorCanvas");
  var overlay = vectorCanvas.getContext("2d");

  // Initialize shaders
  const progInfo = initShaderProgram(display, 
      shaders.vertexSrc, shaders.fragmentSrc);
  // Load data into GPU for shaders: vertices, texture coordinates, indices
  const bufferInfo = initBuffers(display);

  // Initialize tiled map texture, with methods to update zoom and pan
  // TODO: add callback to set needToRender at every update of the texture
  var map = initMap2D(display, overlay);

  // Initialize shader uniforms
  const uniformValues = {
    uTextureSampler: map.sampler,
  };

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
    var bbox = map.fitBoundingBox(x1, y1, x2, y2);
    if (!bbox) {
      console.log("ERROR: Failed to define map containing this bounding box");
      return;
    }
    // Draw the bounding box on the map
    var pix1 = map.xyToMapPixels(x1, y1);
    var pix2 = map.xyToMapPixels(x2, y2);
    overlay.strokeStyle = "#FF0000";
    overlay.strokeRect(pix1.x, pix1.y, pix2.x - pix1.x, pix2.y - pix1.y);
  }, false);

  function toRadians(degrees) {
    return degrees * Math.PI / 180.0;
  };

  // Setup panning controls
  var up = document.getElementById("up");
  up.addEventListener("click", function(click) { map.pan( 0, -1); }, false);
  var down = document.getElementById("down");
  down.addEventListener("click", function(click) { map.pan( 0,  1); }, false);
  var left = document.getElementById("left");
  left.addEventListener("click", function(click) { map.pan(-1,  0); }, false);
  var right = document.getElementById("right");
  right.addEventListener("click", function(click) { map.pan( 1,  0); }, false);

  // Setup zoom controls
  var zoomIn = document.getElementById("zoomIn");
  zoomIn.addEventListener("click", function(click) { map.zoomIn(); }, false);
  var zoomOut = document.getElementById("zoomOut");
  zoomOut.addEventListener("click", function(click) { map.zoomOut(); }, false);

  requestAnimationFrame(checkRender);

  function checkRender(time) {
    drawScene(display, progInfo, bufferInfo, uniformValues);
    requestAnimationFrame(checkRender);
  }
}

export { main };
