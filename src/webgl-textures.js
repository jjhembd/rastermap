function initTiledTexture(gl, numTilesX, numTilesY, tileSize) {
  // Create the texture object
  const texture = gl.createTexture();
  // Bind to the 2D target in the WebGL context
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Define parameters
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = numTilesX * tileSize;
  const height = numTilesY * tileSize;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;

  // Create a blank dummy image
  //const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
  const dummy = new Uint8Array( 4 * width * height );

  // Initialize the texture using defined parameters and dummy image
  gl.texImage2D( gl.TEXTURE_2D, level, internalFormat,
      width, height, border, srcFormat, srcType, dummy );

  // Set up mipmapping and anisotropic filtering, if appropriate
  setupMipMaps(gl, gl.TEXTURE_2D, width, height);
  setTextureAnisotropy(gl, gl.TEXTURE_2D);

  // Save a link to the WebGL rendering context, for use in updateTextureTile()
  const glSave = gl;

  // Define the method for loading an image tile to this texture
  function updateTextureTile() {
    // We don't know what happened re: binding points between the
    // initialization of the texture and the invocation of this method.
    // Hence we re-bind the texture to the 2D target (binding point)
    glSave.bindTexture( glSave.TEXTURE_2D, texture );

    // updateTiledTexture will have been assigned as a method of an image 
    // object, so 'this' is an image to which has been added the additional
    // properties xoffset and yoffset specifying the positioning of the image
    // relative to the origin of the texture
    glSave.texSubImage2D( glSave.TEXTURE_2D, level, 
        this.xoffset, this.yoffset, srcFormat, srcType, this );
  }

  return {
    sampler: texture,
    updateTile: updateTextureTile
  };
}

function setupMipMaps(gl, target, width, height) {
  // On mobile browsers, we might still be using WebGL1.
  // WebGL1 can't handle mipmapping for non-power-of-2 images
  // (not sure if this limitation applies to externally provided mipmaps)
  // For external mips, see https://stackoverflow.com/a/21540856/10082269
  if (isPowerOf2(width) && isPowerOf2(height)) {
    gl.generateMipmap(target);
  } else { // Turn off mipmapping 
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Set wrapping to clamp to edge
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  return;
}

function setTextureAnisotropy(gl, target) {
  var ext = (
      gl.getExtension('EXT_texture_filter_anisotropic') ||
      gl.getExtension('MOZ_EXT_texture_filter_anisotropic') || 
      gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic')
      );
  if (ext) {
    var maxAnisotropy = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
    gl.texParameterf(target, ext.TEXTURE_MAX_ANISOTROPY_EXT, 
        maxAnisotropy);
  }
  return;
}

function loadTexture(gl, url, callBack) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Initialize a single-pixel image to use before the supplied image loads
  const level = 0;                // Mipmap level
  const internalFormat = gl.RGBA; // 4 values per pixel
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D( gl.TEXTURE_2D, level, internalFormat,
      width, height, border, srcFormat, srcType, pixel );

  // Load image asynchronously from supplied URL
  const image = new Image();
  image.onload = function () {
    // Not sure why we re-bind now??
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        srcFormat, srcType, image);
    console.log("texture image width, heigth = " + 
        image.width + ", " + image.height);

    // Setup mipmapping and anisotropic filtering, if appropriate
    setupMipMaps(gl, gl.TEXTURE_2D, width, height);
    setTextureAnisotropy(gl, gl.TEXTURE_2D);

    // Callback to let the calling program know everything is finally loaded
    callBack();
  };

  image.src = url;

  return texture;
}

function loadCubeMapTexture(gl, urlArray, callBack) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

  // Initialize a single-pixel image to use before the supplied image load
  const level = 0;                 // Mipmap level
  const internalFormat = gl.RGBA;  // 4 values per pixel
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  for (let i = 0; i < 6; i++) {
    gl.texImage2D( gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, level, internalFormat,
        width, height, border, srcFormat, srcType, pixel );
  }

  // Load images asynchronously from supplied URLs
  const images = [];
  var imagesLoaded = 0;
  for (let i = 0; i < 6; i++) {
    images[i] = new Image();
    images[i].onload = loadImagesToCubeMap;
    images[i].src = urlArray[i];
  }
  function loadImagesToCubeMap() {
    // Count calls, and confirm we have all 6 images before proceeding
    imagesLoaded++;
    if (imagesLoaded < 6) return;

    // Set up cubemap texture
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    for (let i = 0; i < 6; i++) {
      gl.texImage2D( gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, level, internalFormat,
          srcFormat, srcType, images[i] );
    }

    // Generate mipmaps -- watch out for seams!
    // It may be better to generate them externally. Use AMD's cubemapgen? See
    // https://www.reddit.com/r/opengl/comments/38tlww/accessing_cubemaps_mipmap_level/
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    // Set some parameters for edge handling in WebGL1, following
    // http://www.alecjacobson.com/weblog/?p=1871
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    //gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    //gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

    // Check for anisotropic filtering, and use it if available
    setTextureAnisotropy(gl, gl.TEXTURE_CUBE_MAP);

    // Callback to let the calling program know everything is finally loaded
    callBack();
  }

  return texture;
}

function isPowerOf2(value) {
  // This trick uses bitwise operators.
  // See https://stackoverflow.com/a/30924333/10082269
  return value && !(value & (value - 1));
  // For a better explanation, with some errors in the solution, see
  // https://stackoverflow.com/a/30924360/10082269
}

export {
  initTiledTexture,
  loadTexture, 
  loadCubeMapTexture,
};
