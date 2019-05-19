export function initRenderer(context, params) {
  const size = params.tileSize;
  const mapWidth = params.nx * size;
  const mapHeight = params.ny * size;

  // Resize drawingbuffer to fit the specified number of tiles
  context.canvas.width = mapWidth;
  context.canvas.height = mapHeight;

  return {
    draw,
    clear,
  };

  function clear() {
    return context.clearRect(0, 0, mapWidth, mapHeight);
  }

  function draw(tilebox, ix, iy) {
    context.drawImage(
        tilebox.tile.data, // Image to read, and paint to the canvas
        tilebox.sx,        // First x-pixel in tile to read
        tilebox.sy,        // First y-pixel in tile to read
        tilebox.sw,        // Number of pixels to read in x
        tilebox.sw,        // Number of pixels to read in y
        ix * size,         // First x-pixel in canvas to paint
        iy * size,         // First y-pixel in canvas to paint
        size,              // Number of pixels to paint in x
        size               // Number of pixels to paint in y
        );
    return;
  }
}
