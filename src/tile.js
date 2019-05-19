export function initTileFactory(tileAPI) {
  // This closure just stores the tileAPI for use in the returned method

  function orderTile(z, x, y) {
    // Declare main tile object and properties
    const tile = {
      z, x, y,
      ready: false,
    };

    // Setup object for data request
    const data = new Image();
    data.onload = () => {
      tile.ready = (data.complete && data.naturalWidth !== 0);
    }
    //data.onerror = () => {// delete tile?}

    // Submit request
    data.crossOrigin = "anonymous";
    data.src = tileAPI.getURL( tileAPI.getID(z, x, y) );

    // Add to the tile object and return
    tile.data = data;
    return tile;
  }

  return orderTile;
}
