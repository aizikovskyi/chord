/* eslint-env browser */
/* eslint-disable no-mixed-operators */
/* eslint-disable space-infix-ops */

/* global SoundEngine */

window.ChordPanel = (function makeChordPanel() {
  let bgCanvas;
  let fgCanvas;
  let bgCtx;
  let fgCtx;
  let activeTouch = null;
  let activeCell = null; // an x,y pair

  const gridDimensions = { x: 3, y: 6 };
  const gridChords = [
    ['7#5', 'mM7', 'sus'],
    ['9', 'm9', 'maj9'],
    ['7b5', 'm6', '6'],
    ['7b9', 'm7b5', '7'],
    ['dim', 'm7', 'maj7'],
    ['5', 'min', 'maj'],
  ];

  //  7add13 sus2

  const coords = {
    topOrigin: 0,
    leftOrigin: 0,
    cellWidth: 70,
    cellHeight: 60,
    totalWidth: (70 * gridDimensions.x) + 5,
    totalHeight: (60 * gridDimensions.y) + 5,
  };

  function prettyChordName(name) {
    return name.replace('b', '\u266d').replace('#', '\u266f');
  }

  function cellForCoords(x, y) {
    const cellX = Math.floor((x - coords.leftOrigin) / coords.cellWidth);
    const cellY = Math.floor((y - coords.topOrigin) / coords.cellHeight);

    if (cellX < 0 || cellY < 0 || cellX >= gridDimensions.x || cellY >= gridDimensions.y) {
      return null;
    }
    return { x: cellX, y: cellY };
  }

  function renderBg(ctx) {
    ctx.translate(0.5, 0.5);
    ctx.strokeStyle = '#999999';
    ctx.fillStyle = '#999999';
    ctx.textAlign = 'center';
    ctx.font = '15px Arial';
    ctx.beginPath();
    const c = coords;
    for (let x = 0; x <= gridDimensions.x; x++) {
      ctx.moveTo(c.leftOrigin + x*c.cellWidth, c.topOrigin);
      ctx.lineTo(c.leftOrigin + x*c.cellWidth, c.topOrigin + gridDimensions.y * c.cellHeight);
    }
    for (let y = 0; y <= gridDimensions.y; y++) {
      ctx.moveTo(c.leftOrigin, c.topOrigin + y*c.cellHeight);
      ctx.lineTo(c.leftOrigin + gridDimensions.x * c.cellWidth, c.topOrigin + y * c.cellHeight);
    }
    ctx.stroke();
    for (let x = 0; x < gridDimensions.x; x++) {
      for (let y = 0; y < gridDimensions.y; y++) {
        const textLeft = c.leftOrigin + x * c.cellWidth + c.cellWidth / 2.0;
        const textTop = c.topOrigin + y * c.cellHeight + c.cellHeight / 2.0;
        ctx.fillText(prettyChordName(gridChords[y][x]), textLeft, textTop);
      }
    }
    ctx.translate(-0.5, -0.5);
  }

  function fillCell(x, y, operation) {
    const w = 1;
    const left = coords.leftOrigin + (coords.cellWidth * x) + w;
    const top = coords.topOrigin + (coords.cellHeight * y) + w;
    const width = coords.cellWidth - w;
    const height = coords.cellHeight - w;
    fgCtx.fillStyle = '#449944';
    if (operation === 'clear') {
      fgCtx.clearRect(left, top, width, height);
    } else {
      fgCtx.fillRect(left, top, width, height);
    }
  }

  function updateGrid(newCell) {
    if (activeCell != null) fillCell(activeCell.x, activeCell.y, 'clear');
    activeCell = newCell;
    if (activeCell != null) fillCell(activeCell.x, activeCell.y, 'fill');
  }

  function onTouchStart(evt) {
    evt.preventDefault();
    const touches = evt.changedTouches;
    for (let i = 0; i < touches.length; i++) {
      const rect = fgCanvas.getBoundingClientRect();
      const x = touches[i].clientX - rect.left;
      const y = touches[i].clientY - rect.top;
      const cell = cellForCoords(x, y);
      if (cell != null) {
        activeTouch = touches[i].identifier;
        updateGrid(cell);
        SoundEngine.playChord(gridChords[cell.y][cell.x]);
      }
    }
  }

  function onTouchEnd(evt) {
    evt.preventDefault();
    const touches = evt.changedTouches;
    for (let i = 0; i < touches.length; i++) {
      if (touches[i].identifier === activeTouch) {
        updateGrid(null);
      }
    }
  }

  function draw() {
    bgCanvas.width = coords.totalWidth;
    bgCanvas.height = coords.totalHeight;
    fgCanvas.width = coords.totalWidth;
    fgCanvas.height = coords.totalHeight;
    renderBg(bgCtx);
    const currCell = activeCell;
    updateGrid(null);
    updateGrid(currCell);
  }

  function moveTo(x, y) {
    bgCanvas.style.left = `${x}px`;
    bgCanvas.style.top = `${y}px`;
    fgCanvas.style.left = `${x}px`;
    fgCanvas.style.top = `${y}px`;
  }

  function init(bgChordCanvas, fgChordCanvas) {
    bgCanvas = bgChordCanvas;
    fgCanvas = fgChordCanvas;
    bgCtx = bgCanvas.getContext('2d');
    fgCtx = fgCanvas.getContext('2d');
    fgCanvas.addEventListener('touchstart', onTouchStart);
    fgCanvas.addEventListener('touchend', onTouchEnd);
    draw();
  }

  return {
    init,
    draw,
    moveTo,
  };
}());
