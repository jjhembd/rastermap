export const params = Object.freeze({
  // Root URL and token for accessing the REST API
  baseURL: "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/",
  token: "pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA",
  
  // Number of zoom levels
  maxZoom: 20,
  
  // Width of a tile in pixels (ASSUMES square tiles)
  tileSize: 256,
  
  // Specify number of tiles in the map, in each direction
  nx: 4,
  ny: 3,
  
  // Specify how to get the unique ID of a tile, given its zoom and x/y indices
  getID: function(zoom, x, y) {
    return "/" + zoom + "/" + x + "/" + y + "/";
  },
  
  // Specify how to construct the URL for a given tile, from its unique ID
  getURL: function(id) {
    return this.baseURL + this.tileSize + id + "?access_token=" + this.token;
  },
});
