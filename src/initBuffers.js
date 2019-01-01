function initBuffers(gl) {
  // 4 vertices at the corners of the screen
  const vertices = [
    -1, -1,  0,    1, -1,  0,    1,  1,  0,   -1,  1,  0
  ];

  // Texture coordinates assume image has 0,0 at top left
  const texCoordData = [
    0, 1,   1, 1,   1, 0,   0, 0
  ];

  // Index into two triangles
  var indices = [
     0,  1,  2,    2,  3,  0
  ];

  // Store byte info and load into GPU
  const vertexPositions = {
    buffer: gl.createBuffer(),
    numComponents: 3,
    type: gl.FLOAT,
    normalize: false,
    stride: 0,
    offset: 0
  };
  // Bind to the gl context
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositions.buffer);
  // Pass the array into WebGL
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  const texCoords = {
    buffer: gl.createBuffer(),
    numComponents: 2,
    type: gl.FLOAT,
    normalize: false,
    stride: 0,
    offset: 0
  };
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoords.buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoordData), gl.STATIC_DRAW);

  const vertexIndices = {
    buffer: gl.createBuffer(),
    vertexCount: indices.length,
    type: gl.UNSIGNED_SHORT,
    offset: 0
  };
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndices.buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  // Note: unlike in ../../globe/src/initBuffers.js, we do not initialize the
  // textures here. The texture sampler is set as a uniform, so we never really
  // need the texture in the bufferInfo object.
  // In this case, initializing a tiled texture returns both a sampler and a
  // method to update tiles. Putting all this in bufferInfo would be
  // unnecessarily messy.
  
  return {
    attributes: {
      aVertexPosition: vertexPositions,
      aTexCoord: texCoords,
    },
    indices: vertexIndices,
  };
}

export { initBuffers };
