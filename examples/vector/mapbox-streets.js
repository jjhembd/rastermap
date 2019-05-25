export const params = Object.freeze({
  // Root URL and token for accessing the REST API
  token: "pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA",
  style: "mapbox://styles/mapbox/streets-v8",
  
  // Number of zoom levels
  maxZoom: 20,
  
  // Width of a tile in pixels (ASSUMES square tiles)
  tileSize: 512,
  
  // Specify number of tiles to display in the map, in each direction
  nx: 2,
  ny: 1,
});
