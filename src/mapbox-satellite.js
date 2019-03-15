const params = {
  baseURL: "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/",
  token: "pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA",
  tileSize: 512,
  maxZoom: 20,
}
// Export as read-only
const tileAPI = Object.freeze(params);
export { tileAPI };
