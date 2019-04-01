export function initBoxQC(overlay, coords, width, height) {

  // Resize canvases to fit the specified number of tiles
  overlay.canvas.width = width;
  overlay.canvas.height = height;

  // Track status of bounding box for QC
  const boxQC = [ [0,0], [0,0] ];
  const pixQC = [ [0,0], [0,0] ];

  // Return methods for drawing the QC
  return {
    draw,
    reset,
  };

  function draw(p1, p2, mapChanged) {
    // Check if bounding box changed since last call
    var boxChanged = updateBox(boxQC, [p1, p2]);
    if (!boxChanged && !mapChanged) return;

    // Special case: box moved but map didn't
    if (!mapChanged) overlay.clearRect(0, 0, width, height);

    // Convert box to map pixels
    coords.xyToMapPixels( pixQC[0], boxQC[0] );
    coords.xyToMapPixels( pixQC[1], boxQC[1] );

    // Draw bounding box on overlay
    overlay.strokeStyle = "#FF0000";
    overlay.lineWidth = 5;
    overlay.strokeRect(
        pixQC[0][0],
        pixQC[0][1],
        pixQC[1][0] - pixQC[0][0],
        pixQC[1][1] - pixQC[0][1]
        );

    return;
  }

  function updateBox(bOld, bNew) {
    var same = (
        bNew[0][0] === bOld[0][0] &&
        bNew[0][1] === bOld[0][1] &&
        bNew[1][0] === bOld[1][0] &&
        bNew[1][1] === bOld[1][1]
        );
    if (same) return false;

    // Box changed. Do a deep copy
    bOld[0][0] = bNew[0][0];
    bOld[0][1] = bNew[0][1];
    bOld[1][0] = bNew[1][0];
    bOld[1][1] = bNew[1][1];
    return true;
  }

  function reset() {
    overlay.clearRect(0, 0, width, height);
    boxQC[0][0] = 0;
    boxQC[0][1] = 0;
    boxQC[1][0] = 0;
    boxQC[1][1] = 0;
    return;
  }
}
