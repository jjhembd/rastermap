const vertexSrc = `
  attribute vec4 aVertexPosition;
  attribute vec2 aTexCoord;

  varying highp vec2 vTexCoord;

  void main(void) {
    vTexCoord = aTexCoord;
    gl_Position = aVertexPosition;
  }
`;

const fragmentSrc = `
  varying highp vec2 vTexCoord;

  uniform sampler2D uTextureSampler;

  void main(void) {
    gl_FragColor = texture2D(uTextureSampler, vTexCoord);
  }
`;

export { vertexSrc, fragmentSrc };
