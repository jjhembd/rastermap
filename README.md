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

## API
### Initialization
rasterMap.init takes two parameters:
- 2D rendering context ([CanvasRenderingContext2D] object) for the target canvas
- Parameters object

The parameters object must contain the following fields:
- maxZoom: maximum zoom level of the tile service
- tileSize: size in pixels of the supplied tiles. ASSUMES square tiles.
- nx: number of tiles spanning the map in the x-direction
- ny: number of tiles spanning the map in the y-direction
- getID: A function with arguments (zoom, x, y) that will return the unique
  ID of the tile at the specified coordinates
- getURL: A function with argument (id) that returns the URL used to access
  the specified tile. Note that any API tokens must be included here.

Note that rastermap will automatically resize the drawingbuffer of the canvas
to (nx * tileSize) X (ny * tileSize). It is up to the user to make sure this is
consistent with the CSS displayed size of the canvas (or the texture into which
the canvas will be copied, in WebGL animation applications).

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
- rasterMap.js: Module entry point. Draws the tiles to the Canvas, and
  tracks the status of each tile in the map.
- tileCache.js: maintains a cache of tiles. When a tile is requested, tileCache
  will return it if it is available. If not, it will return a *parent* tile
  from a lower zoom level, along with information about which part of the
  parent covers the area of the requested tile. Any missing tiles or parents
  are then requested from the tile service, for use in future draw calls.
  Tiles far from the requested area are *pruned*, to keep memory usage in
  in control.
- tileCoords.js: manages the coordinates of the tiled map. Given a bounding
  box, or pan/zoom action, tileCoords will update the zoom and origin of the
  map to cover the desired area. tileCoords also does some general coordinate
  math and computes distances between tiles.

[slippy map]: https://en.wikipedia.org/wiki/Tiled_web_map
[CanvasRenderingContext2D]: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
[rastermap example]: https://jjhembd.github.io/rastermap/examples/index.html
