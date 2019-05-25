// A skeleton tile factory for raster tiles. Currently not used--
// we use tilekiln/src/tile.js, which can handle both vector and raster
export function initTileFactory(tileAPI) {
  // This closure just stores the tileAPI for use in the returned method

  function orderTile(z, x, y) {
    // Declare main tile object and properties
    const tile = {
      z, x, y,
      ready: false,
    };

    // Request the image
    const img = new Image();
    img.onerror = requestError;
    img.onload = checkData;
    img.crossOrigin = "anonymous";
    img.src = tileAPI.getURL(z, x, y);

    function checkData() {
      tile.ready = (img.complete && img.naturalWidth !== 0);
    }

    function requestError(err) {
      console.log("Request error in orderTile: " + err);
      // delete this tile? Or flag it for reloading?
    }

    // Add to the tile object and return
    tile.img = img;
    return tile;
  }

  return orderTile;
}
