function lonToWebMercX(lon) {
  // Convert input longitude in radians to a Web Mercator x-coordinate
  // where x = 0 at lon = -PI, x = 1 at lon = +PI
  return 0.5 + 0.5 * lon / Math.PI;
}

function latToWebMercY(lat) {
  // Convert input latitude in radians to a Web Mercator y-coordinate
  // where y = 0 at lat = 85.05113 deg, y = 1 at lat = -85.05113 deg
  return 0.5 - 0.5 / Math.PI * // Note sign flip
    Math.log( Math.tan(Math.PI / 4 + lat / 2.0) ); // This term is in [-PI,PI]
}

export { lonToWebMercX, latToWebMercY };
