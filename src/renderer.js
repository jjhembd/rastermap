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

  function draw(tileObj, ix, iy) {
    context.drawImage(
        tileObj.img,    // Image to read, and paint to the canvas
        tileObj.sx,     // First x-pixel in tile to read
        tileObj.sy,     // First y-pixel in tile to read
        tileObj.sw,     // Number of pixels to read in x
        tileObj.sw,     // Number of pixels to read in y
        ix * size,      // First x-pixel in canvas to paint
        iy * size,      // First y-pixel in canvas to paint
        size,           // Number of pixels to paint in x
        size            // Number of pixels to paint in y
        );
    return;
  }
}
