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
    var frac = box.sw / size;  // Fraction of the tile we will use
    var tileX = (mapX - ix * size) * frac + box.sx;
    var tileY = (mapY - iy * size) * frac + box.sy;

    // Scale the threshold by frac to make it a displayed distance
    // rather than a distance in local tile coordinates
    var feature = findNearest(tileX, tileY, threshold * frac, data.features);

    if (!feature.geometry) return feature; // No actual feature selected

    // TODO: The below ASSUMES feature.geometry.type === "Point"

    // Make a deep copy of the feature (not just a link to the original)
    feature = JSON.parse(JSON.stringify(feature));

    // Transform the feature coordinates from tile coordinates back to 
    //  global map coordinates
    var coords = feature.geometry.coordinates;
    var numTiles = 2 ** box.tile.z;
    coords[0] = (box.tile.x + coords[0] / size) / numTiles;
    coords[1] = (box.tile.y + coords[1] / size) / numTiles;

    return feature;
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
