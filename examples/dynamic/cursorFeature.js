import { initTouchy } from 'touchy';

export function initMapCursor(div, mapParams) {
  const cursor = initTouchy(div);
  const tilenum = new Float64Array(2);
  const tilepix = new Float64Array(2);

  return {
    update,
    tilenum,
    tilepix,
  };

  function update() {
    var box = div.getBoundingClientRect();
    var x = cursor.x() - box.left;
    var y = cursor.y() - box.top;
    // Compute tile index
    tilenum[0] = Math.floor(x / mapParams.tileSize);
    tilenum[1] = Math.floor(y / mapParams.tileSize);
    // retrieve tilebox parameters (TODO)
    // Compute pixel within tile, ignoring tilebox stretching...
    tilepix[0] = x - tilenum[0] * mapParams.tileSize;
    tilepix[1] = y - tilenum[1] * mapParams.tileSize;
  }
}
