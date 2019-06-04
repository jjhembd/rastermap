import { initTouchy } from 'touchy';

export function initMapCursor(div, mapParams) {
  const cursor = initTouchy(div);
  const tilenum = new Float64Array(2);
  const tilepix = new Float64Array(2);
  var nearestFeature;

  return {
    update,
    tilenum,
    tilepix,
    feature: () => nearestFeature,
  };

  function update(boxes) {
    var box = div.getBoundingClientRect();
    var x = cursor.x() - box.left;
    var y = cursor.y() - box.top;
    // Compute tile index
    var ix = Math.floor(x / mapParams.tileSize);
    var iy = Math.floor(y / mapParams.tileSize);
    // retrieve tilebox parameters (TODO)

    tilenum[0] = ix;
    tilenum[1] = iy;

    // Get the tile box at this grid point
    if (!boxes || !boxes[iy]) return;
    var box = boxes[iy][ix]
    if (!box) return; // console.log("No box at this tile!");

    // Compute pixel within tile, ignoring tilebox stretching...
    var size = mapParams.tileSize;
    var ratio = box.sw / size;
    var xpx = x - ix * size;
    var ypx = y - iy * size;
    tilepix[0] = xpx * ratio + box.sx;
    tilepix[1] = ypx * ratio + box.sy;

    nearestFeature = findNearest(tilepix, 10, box.tile.sources.wells);
  }
}

function findNearest(target, threshold, geojson) {
  var collection = geojson["TWDB_Groundwater_v2"];
  if (!collection) return; // console.log("ERROR in findNearest: no collection!");

  var features = collection.features;
  var minDistance = Infinity;
  var minIndex = 0;

  features.forEach(checkDistance);

  function checkDistance(feature, index) {
    var point = feature.geometry.coordinates;
    var distance = Math.sqrt( 
        (point[0] - target[0])**2 + 
        (point[1] - target[1])**2 );
    if (distance < minDistance) {
      minDistance = distance;
      minIndex = index;
    }
  }

  return (minDistance <= threshold)
    ? features[minIndex]
    : {};
}
