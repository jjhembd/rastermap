import resolve from 'rollup-plugin-node-resolve';

export default [{
  input: 'raster/main.js',
  plugins: [
    resolve(),
  ],
  output: {
    file: 'raster/main.min.js',
    format: 'iife',
    name: 'rasterMap'
  }
}, {
  input: 'vector/main.js',
  plugins: [
    resolve(),
  ],
  output: {
    file: 'vector/main.min.js',
    format: 'iife',
    name: 'vectorMap'
  }
}, {
  input: 'dynamic/main.js',
  plugins: [
    resolve(),
  ],
  output: {
    file: 'dynamic/main.min.js',
    format: 'iife',
    name: 'dynamic'
  }
}, {
  input: 'macrostrat/main.js',
  plugins: [
    resolve(),
  ],
  output: {
    file: 'macrostrat/main.min.js',
    format: 'iife',
    name: 'macrostrat'
  }
}];
