export function initSelector(size, boxes) {
  // This closure just stores the tile size and a link to the tile boxes

  return select;

  function select(mapX, mapY, threshold, source, layer) {
    // Compute tile index
    var ix = Math.floor(mapX / size);
    var iy = Math.floor(mapY / size);

    // Get a link to the tile box
    if (!boxes[iy]) return;
    var box = boxes[iy][ix];
    if (!box) return; // "No box at this tile!"

    // Get a link to the data from the requested layer
    var layers = box.tile.sources[source];
    if (!layers) return;
    // TODO: Make sure it's a vector source?
    var data = layers[layer];
    if (!data) return;

    // Compute pixel within tile
    var ratio = box.sw / size;
    var tileX = (mapX - ix * size) * ratio + box.sx;
    var tileY = (mapY - iy * size) * ratio + box.sy;

    return findNearest(tileX, tileY, threshold, data.features);
  }

  function findNearest(x, y, threshold, features) {
    var minDistance = Infinity;
    var minIndex = 0;

    features.forEach(checkDistance);

    function checkDistance(feature, index) {
      var p = feature.geometry.coordinates;
      var distance = Math.sqrt( (p[0] - x)**2 + (p[1] - y)**2 );
      if (distance < minDistance) {
        minDistance = distance;
        minIndex = index;
      }
    }

    return (minDistance <= threshold)
      ? features[minIndex]
      : {};
  }
}
