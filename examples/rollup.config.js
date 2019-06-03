import resolve from 'rollup-plugin-node-resolve';

export default [{
  input: 'raster/main.js',
  plugins: [],
  output: {
    file: 'raster/main.min.js',
    format: 'iife',
    name: 'rasterMap'
  }
}, {
  input: 'vector/main.js',
  plugins: [],
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
}];
