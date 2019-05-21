export const params = Object.freeze({
  // Root URL and token for accessing the REST API
  baseURL: "https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2,mapbox.mapbox-streets-v7",
  token: "pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA",
  
  // Number of zoom levels
  maxZoom: 20,
  
  // Width of a tile in pixels (ASSUMES square tiles)
  tileSize: 512,
  
  // Specify number of tiles in the map, in each direction
  nx: 2,
  ny: 1,
  
  // Specify how to get the unique ID of a tile, given its zoom and x/y indices
  getID: function(zoom, x, y) {
    return "/" + zoom + "/" + x + "/" + y;
  },
  
  // Specify how to construct the URL for a given tile, from its unique ID
  getURL: function(id) {
    return this.baseURL + id + ".mvt?access_token=" + this.token;
  },
  vector: true,
  styleURL: function() {
    return "https://api.mapbox.com/styles/v1/mapbox/streets-v8" + "?access_token=" + this.token;
  },
});
