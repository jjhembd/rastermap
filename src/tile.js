export function initTileFactory(tileAPI) {
  // This closure just stores the tileAPI for use in the returned method

  function orderTile(z, x, y) {
    // Declare main tile object and properties
    const tile = {
      z, x, y,
      ready: false,
    };

    // Request the data
    const data = new Image();
    data.onerror = requestError;
    data.onload = checkData;
    data.crossOrigin = "anonymous";
    data.src = tileAPI.getURL( tileAPI.getID(z, x, y) );

    function checkData() {
      tile.ready = (data.complete && data.naturalWidth !== 0);
    }

    function requestError(err) {
      console.log("Request error in orderTile: " + err);
      // delete this tile? Or flag it for reloading?
    }

    // Add to the tile object and return
    tile.data = data;
    return tile;
  }

  return orderTile;
}
