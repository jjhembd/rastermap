import { 
  createAttributeSetters, 
  setBuffersAndAttributes } from "./webgl-attributes.js";
import { 
  createUniformSetters, 
  setUniforms } from "./webgl-uniforms.js";

// Initialize a shader program
function initShaderProgram(gl, vsSource, fsSource) {
  // Load extensions
  // ERROR: doesn't work here, but works if loaded right after .getContext ?!?
  //gl.getExtension('OES_standard_derivatives');

  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert( 'Unable to initialize the shader program: \n' +
        gl.getProgramInfoLog(shaderProgram) );
    // This is not very good error handling... should be returning the error
    return null;
  }

  return {
    program: shaderProgram,
    attributeSetters: createAttributeSetters(gl, shaderProgram),
    uniformSetters: createUniformSetters(gl,shaderProgram),
  };
}

// create shader of a given type, upload source, compile it
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  // no error handling for createShader??

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // Now check for errors
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    // this alert business is sloppy...
    alert( 'An error occurred compiling the shaders: \n' +
        gl.getShaderInfoLog(shader) );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function resizeCanvas(onscreen, offscreen, perspective) { //qc, perspective) {
  // Make sure the canvas drawingbuffer is the same size as the display
  // https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html

  // We have 2 canvases: one offscreen for WebGL rendering, and one onscreen
  // for display. The onscreen canvas could be re-sized by the client.
  var width = onscreen.clientWidth;
  var height = onscreen.clientHeight;

  if (offscreen.width !== width || offscreen.height !== height) {
    // The visible canvas was resized. We need to reset sizes of both
    onscreen.width = width;
    onscreen.height = height;
    offscreen.width = width;
    offscreen.height = height;
    //qc.width = width;
    //qc.height = height;
    perspective.aspect = width / height;

    // Let the calling program know the canvas was resized
    // If it was, the scene needs to be re-drawn
    return true;
  }
  return false;
}

function drawScene( gl, programInfo, bufferInfo, uniforms ) {
  // Make a blank canvas that fills the displayed size from CSS
  prepCanvas(gl);

  // Tell WebGL to use our program when drawing
  gl.useProgram(programInfo.program);

  // Prepare shader attributes.
  setBuffersAndAttributes( gl, programInfo.attributeSetters, bufferInfo );
  // Set the shader uniforms
  setUniforms( programInfo.uniformSetters, uniforms );

  // Draw the scene
  gl.drawElements(gl.TRIANGLES, bufferInfo.indices.vertexCount,
      bufferInfo.indices.type, bufferInfo.indices.offset);
}

function prepCanvas(gl) {
  // Set some parameters
  gl.clearColor(1.0, 0.0, 0.0, 1.0);  // Clear to solid red
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Clear the canvas AND the depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  return;
}

export { 
  initShaderProgram, 
  resizeCanvas, 
  drawScene,
};
