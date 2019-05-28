# rastermap
A module to draw a simple tiled raster map on an HTML Canvas, with a 
synchronous API.

You can give rastermap a target area to map, and it will *instantly* draw
a map on the canvas for that area. 

rastermap maintains a cache of tiles, and will load more tiles as needed, 
but it **does not wait** for tiles to load before drawing. If the desired zoom
is not loaded yet, rastermap will simply stretch the tiles from another zoom.

This synchronous drawing response (with asynchronous loading in the background)
enables rastermap to supply images to animated apps. The returned image will
always be correctly positioned. However, the image may be low resolution, if
the higher-resolution tiles are not loaded yet.

rastermap is like a [slippy map], only we make it *snappy*. Check out our
[rastermap example] and see for yourself!
*New:* rastermap can also display vector tiles, using the [tilekiln] renderer.
It uses Canvas 2D, so it is somewhat slow. See the [vector example].

## API
### Initialization
rasterMap.init takes three parameters:
- Parameters object
- 2D rendering context ([CanvasRenderingContext2D] object) for the target canvas
- (Optional) 2D rendering context for an overlay QC of the current bounding box

The parameters object must contain the following fields:
- style: a Mapbox style document, or a URL pointing to it
- token (optional): a Mapbox API key. Used for expanding Mapbox shorthand URLs
  of the form mapbox://...
- tileSize: size in pixels of the supplied tiles. ASSUMES square tiles.
- width, height: pixel size of the displayed map. MUST be multiple of tileSize.
  If not provided, will use the canvas width of the supplied canvas context
- maxZoom: maximum allowed zoom

Note that rastermap will automatically resize the drawingbuffer of the canvas
to width X height. It is up to the user to make sure this is consistent with 
the CSS displayed size of the canvas (or the texture into which the canvas 
will be copied, in WebGL animation applications).

### Map requests
- drawTiles: method to draw tiles on the canvas (no arguments)
- loaded: method to return the loading status of the requested tiles. If some
  of the tiles on the map are drawn with a stretched parent tile, those tiles
  are not counted as done. No arguments, returns a value between 0 and 1.
- move: Inputs (INTEGER) values of (dz, dx, dy), and updates the zoom and pan
  of the map
- fitBoundingBox: Inputs two arrays of [x, y] points, corresponding to the
  NorthWest and SouthEast corners of the desired area, and updates the map
  coordinates to fit this area as closely as possible
- toLocal: function(local, global). Converts global X/Y to local X/Y at the
  current zoom level. ASSUMES global coordinates range from 0 to 1.
- getScale: Returns the scaling factor between global and local coordinates

## Code structure
- main.js: Module entry point. Checks user parameters, assigns defaults for
  missing parameters, and initializes sub-modules. Returns API object.
- cache.js: maintains a cache of tiles. When a tile is requested, tileCache
  will return it if it is available. If not, it will return a *parent* tile
  from a lower zoom level, along with information about which part of the
  parent covers the area of the requested tile. Any missing tiles or parents
  are then requested from the tile service, for use in future draw calls.
  Tiles far from the requested area are *pruned*, to keep memory usage in
  in control.
- coords.js: manages the coordinates of the tiled map. Given a bounding box,
  or pan/zoom action, tileCoords will update the zoom and origin of the map
  to cover the desired area. coords.js also does some general coordinate math
  and computes distances between tiles.
- map.js: executes draw commands, and tracks the status of each tile in the 
  displayed map.
- renderer.js: simple wrapper for drawImage and clearRect
- boxqc.js: manages and draws an overlay showing the current bounding box
- tile.js: defines structure of new tile objects. NOT USED--see tilekiln

[slippy map]: https://en.wikipedia.org/wiki/Tiled_web_map
[CanvasRenderingContext2D]: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
[rastermap example]: https://jjhembd.github.io/rastermap/examples/raster/index.html
[tilekiln]: https://github.com/jjhembd/tilekiln
[vector example]: https://jjhembd.github.io/rastermap/examples/vector/index.html
