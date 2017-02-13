/* eslint-env browser */

window.MutePanel = (function makeMutePanel() {
  const coords = {
    totalWidth: 80,
    totalHeight: 60,
    width: 70,
    height: 50,
    topOrigin: 0,
    leftOrigin: 0,
  };

  let bgCanvas;
  let fgCanvas;
  let bgCtx;
  let fgCtx;
  let pressed = false;

  function drawButtonState() {
    const w = 1;
    if (pressed) {
      fgCtx.fillStyle = '#999999';
      fgCtx.fillRect(coords.leftOrigin + w, coords.topOrigin + w, coords.width - w, coords.height - w);
    } else {
      fgCtx.clearRect(coords.leftOrigin + w, coords.topOrigin + w, coords.width - w, coords.height - w);
    }
  }

  function renderBg(ctx) {
    ctx.strokeStyle = '#999999';
    ctx.fillStyle = '#333333';
    ctx.translate(0.5, 0.5);
    ctx.fillRect(coords.leftOrigin, coords.topOrigin, coords.width, coords.height);
    ctx.strokeRect(coords.leftOrigin, coords.topOrigin, coords.width, coords.height);
    ctx.translate(-0.5, -0.5);
    ctx.fillStyle = '#999999';
    ctx.textAlign = 'center';
    ctx.font = '12px Arial';
    ctx.fillText('mute bass', coords.leftOrigin + (coords.width / 2), coords.topOrigin + (coords.height / 2) + 4);
  }

  function onTouchStart(evt) {
    evt.preventDefault();
    pressed = true;
    drawButtonState();
  }

  function onTouchEnd(evt) {
    evt.preventDefault();
    pressed = false;
    drawButtonState();
  }

  function draw() {
    bgCanvas.width = coords.totalWidth;
    fgCanvas.width = coords.totalWidth;
    bgCanvas.height = coords.totalHeight;
    fgCanvas.height = coords.totalHeight;
    renderBg(bgCtx);
    drawButtonState();
  }

  function moveTo(x, y) {
    bgCanvas.style.left = `${x}px`;
    bgCanvas.style.top = `${y}px`;
    fgCanvas.style.left = `${x}px`;
    fgCanvas.style.top = `${y}px`;
  }

  function init(abgCanvas, afgCanvas) {
    bgCanvas = abgCanvas;
    fgCanvas = afgCanvas;
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
    isPressed: () => pressed,
  };
}());
