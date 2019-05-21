import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs'; // Yuck... needed for ieee754 package
import { glsl } from "./glsl-plugin.js";
import pkg from "../package.json";

export default {
  input: 'src/main.js',
  plugins: [
    glsl(),
    resolve(),
    commonjs(),
  ],
  output: {
    file: pkg.main,
    format: 'esm',
    name: pkg.name
  }
};
