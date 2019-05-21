import { readMVT } from "./readVector.js";

export function initVectorTileFactory(tileAPI) {
  // This closure just stores the tileAPI for use in the returned method

  function orderTile(z, x, y) {
    // Declare main tile object and properties
    const tile = {
      z, x, y,
      ready: false,
    };

    // Request the data
    var tileURL = tileAPI.getURL( tileAPI.getID(z, x, y) );
    readMVT(tileURL, tileAPI.tileSize, checkData);

    function checkData(err, data) {
      if (err) return requestError(err);
      tile.data = data;
      tile.ready = true;
    }

    function requestError(err) {
      console.log("Request error in orderTile: " + err);
      // delete this tile? Or flag it for reloading?
    }

    return tile;
  }

  return orderTile;
}
