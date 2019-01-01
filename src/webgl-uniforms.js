// Very similar to greggman's module:
// https://github.com/greggman/webgl-fundamentals/blob/master/webgl/resources/webgl-utils.js
function createUniformSetters(gl, program) {

  var uniformSetters = {};
  var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

  // Track texture bindpoint index in case multiple textures are required
  var textureUnit = 0;

  for (let i = 0; i < numUniforms; i++) {
    var uniformInfo = gl.getActiveUniform(program, i);
    if (!uniformInfo) break;

    var name = uniformInfo.name;
    // remove the array suffix added by getActiveUniform
    if (name.substr(-3) === "[0]") {
      name = name.substr(0, name.length - 3);
    }
    var setter = createUniformSetter(program, uniformInfo);
    uniformSetters[name] = setter;
  }
  return uniformSetters;

  // This function must be nested to access the textureUnit index
  function createUniformSetter(program, uniformInfo) {
    var location = gl.getUniformLocation(program, uniformInfo.name);
    var isArray = (uniformInfo.size > 1 && uniformInfo.name.substr(-3) === "[0]");
    var type = uniformInfo.type;
    switch (type) {
      case gl.FLOAT :
        if (isArray) {
          return function(v) { gl.uniform1fv(location, v); };
        } else {
          return function(v) { gl.uniform1f(location, v); };
        }
      case gl.FLOAT_VEC2 :
        return function(v) { gl.uniform2fv(location, v); };
      case gl.FLOAT_VEC3 :
        return function(v) { gl.uniform3fv(location, v); };
      case gl.FLOAT_VEC4 :
        return function(v) { gl.uniform4fv(location, v); };
      case gl.INT :
        if (isArray) {
          return function(v) { gl.uniform1iv(location, v); };
        } else {
          return function(v) { gl.uniform1i(location, v); };
        }
      case gl.INT_VEC2 :
        return function(v) { gl.uniform2iv(location, v); };
      case gl.INT_VEC3 :
        return function(v) { gl.uniform3iv(location, v); };
      case gl.INT_VEC4 :
        return function(v) { gl.uniform4iv(location, v); };
      case gl.BOOL :
        return function(v) { gl.uniform1iv(location, v); };
      case gl.BOOL_VEC2 :
        return function(v) { gl.uniform2iv(location, v); };
      case gl.BOOL_VEC3 :
        return function(v) { gl.uniform3iv(location, v); };
      case gl.BOOL_VEC4 :
        return function(v) { gl.uniform4iv(location, v); };
      case gl.FLOAT_MAT2 :
        return function(v) { gl.uniformMatrix2fv(location, false, v); };
      case gl.FLOAT_MAT3 :
        return function(v) { gl.uniformMatrix3fv(location, false, v); };
      case gl.FLOAT_MAT4 :
        return function(v) { gl.uniformMatrix4fv(location, false, v); };
      case gl.SAMPLER_2D :
      case gl.SAMPLER_CUBE :
        if (isArray) {
          var units = [];
          for (let i = 0; i < uniformInfo.size; i++) { // greggman wrong here!
            units.push(textureUnit++);
          }
          return function(bindPoint, units) {
            return function(textures) {
              gl.uniform1iv(location, units);
              textures.forEach( function(texture, index) {
                gl.activeTexture(gl.TEXTURE0 + units[index]);
                gl.bindTexture(bindPoint, texture);
              });
            };
          }(getBindPointForSamplerType(gl, type), units);
        } else {
          return function(bindPoint, unit) {
            return function(texture) {
              //gl.uniform1i(location, units); // Typo? How did it even work?
              gl.uniform1i(location, unit);
              gl.activeTexture(gl.TEXTURE0 + unit);
              gl.bindTexture(bindPoint, texture);
            };
          }(getBindPointForSamplerType(gl, type), textureUnit++);
        }
     default:  // we should never get here
        throw("unknown type: 0x" + type.toString(16));
    }
  }
}

function getBindPointForSamplerType(gl, type) {
  if (type === gl.SAMPLER_2D)   return gl.TEXTURE_2D;
  if (type === gl.SAMPLER_CUBE) return gl.TEXTURE_CUBE_MAP;
  return undefined;
}

function setUniforms(setters, values) {
  Object.keys(values).forEach( function(name) {
    var setter = setters[name];
    if (setter) setter(values[name]);
  });
}

export { createUniformSetters, setUniforms };
