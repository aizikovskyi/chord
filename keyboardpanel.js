/* eslint-env browser */
/* eslint-disable no-mixed-operators */
/* eslint-disable space-infix-ops */
/* eslint-disable comma-spacing */

/* global MutePanel SoundEngine debugLog */

window.KeyboardPanel = (function makeKeyboardPanel() {
  const keyCoords = {
    whiteKeyWidth: 50,
    halfBlackKeyWidth: 19,
    blackKeyHeight: 150,
    whiteKeyOnlyHeight: 100,
    topOrigin: 0,
    leftOrigin: 0,
    totalWidth: (50 * 7) + 5,
    totalHeight: 150 + 100 + 5,
  };

  let bgKeyCanvas;
  let fgKeyCanvas;
  let bgKeyCtx;
  let fgKeyCtx;

  const keyState = {
    rootKey: null,
    soundKey: null,
  };

  const touches = {
    rootTouch: null,
    soundTouch: null,
  };


  function keyNameForCoords(x, y) {
    const c = keyCoords;

    if (x < c.leftOrigin || x > c.leftOrigin + (7 * c.whiteKeyWidth)) return null;
    if (y < c.topOrigin || y > c.topOrigin + c.blackKeyHeight + c.whiteKeyOnlyHeight) return null;

    x -= c.leftOrigin;
    y -= c.topOrigin;

    if (y < c.blackKeyHeight) {
      x -= c.whiteKeyWidth / 2;
      if (x < c.whiteKeyWidth) return 'c#';
      if (x < c.whiteKeyWidth * 2.5) return 'd#';
      if (x < c.whiteKeyWidth * 4) return 'f#';
      if (x < c.whiteKeyWidth * 5) return 'g#';
      return 'a#';
    }
    if (x < c.whiteKeyWidth) return 'c';
    if (x < c.whiteKeyWidth * 2) return 'd';
    if (x < c.whiteKeyWidth * 3) return 'e';
    if (x < c.whiteKeyWidth * 4) return 'f';
    if (x < c.whiteKeyWidth * 5) return 'g';
    if (x < c.whiteKeyWidth * 6) return 'a';
    return 'b';
  }

  function fillKey(key, fillStyle, operation) {
    const ctx = fgKeyCtx;
    let rect = ctx.fillRect.bind(ctx);
    const c = keyCoords;
    const w = 1; // line width
    const wkw = c.whiteKeyWidth - c.halfBlackKeyWidth; // convenience: width of top part of white keys C E F B
    const swkw = c.whiteKeyWidth - (2 * c.halfBlackKeyWidth); // convenience: width of top parts of D G A
    const bkw = 2 * c.halfBlackKeyWidth;

    if (operation === 'clear') rect = ctx.clearRect.bind(ctx);
    ctx.fillStyle = fillStyle;

    if (key === 'c') {
      rect(c.leftOrigin+w,c.topOrigin+w,wkw-w,c.blackKeyHeight);
      rect(c.leftOrigin+w,c.topOrigin+c.blackKeyHeight+w,c.whiteKeyWidth-w,c.whiteKeyOnlyHeight-w);
    } else if (key === 'd') {
      rect(c.leftOrigin+1*c.whiteKeyWidth+c.halfBlackKeyWidth+w,c.topOrigin+w,swkw-w,c.blackKeyHeight);
      rect(c.leftOrigin+1*c.whiteKeyWidth+w,c.topOrigin+c.blackKeyHeight+w,c.whiteKeyWidth-w,c.whiteKeyOnlyHeight-w);
    } else if (key === 'e') {
      rect(c.leftOrigin+2*c.whiteKeyWidth+c.halfBlackKeyWidth+w,c.topOrigin+w,wkw-w,c.blackKeyHeight);
      rect(c.leftOrigin+2*c.whiteKeyWidth+w,c.topOrigin+c.blackKeyHeight+w,c.whiteKeyWidth-w,c.whiteKeyOnlyHeight-w);
    } else if (key === 'f') {
      rect(c.leftOrigin+3*c.whiteKeyWidth+w,c.topOrigin+w,wkw-w,c.blackKeyHeight);
      rect(c.leftOrigin+3*c.whiteKeyWidth+w,c.topOrigin+c.blackKeyHeight+w,c.whiteKeyWidth-w,c.whiteKeyOnlyHeight-w);
    } else if (key === 'g') {
      rect(c.leftOrigin+4*c.whiteKeyWidth+c.halfBlackKeyWidth+w,c.topOrigin+w,swkw-w,c.blackKeyHeight);
      rect(c.leftOrigin+4*c.whiteKeyWidth+w,c.topOrigin+c.blackKeyHeight+w,c.whiteKeyWidth-w,c.whiteKeyOnlyHeight-w);
    } else if (key === 'a') {
      rect(c.leftOrigin+5*c.whiteKeyWidth+c.halfBlackKeyWidth+w,c.topOrigin+w,swkw-w,c.blackKeyHeight);
      rect(c.leftOrigin+5*c.whiteKeyWidth+w,c.topOrigin+c.blackKeyHeight+w,c.whiteKeyWidth-w,c.whiteKeyOnlyHeight-w);
    } else if (key === 'b') {
      rect(c.leftOrigin+6*c.whiteKeyWidth+c.halfBlackKeyWidth+w,c.topOrigin+w,wkw-w,c.blackKeyHeight);
      rect(c.leftOrigin+6*c.whiteKeyWidth+w,c.topOrigin+c.blackKeyHeight+w,c.whiteKeyWidth-w,c.whiteKeyOnlyHeight-w);
    } else if (key === 'c#') {
      rect(c.leftOrigin+1*c.whiteKeyWidth-c.halfBlackKeyWidth+w,c.topOrigin+w,bkw-w,c.blackKeyHeight-w);
    } else if (key === 'd#') {
      rect(c.leftOrigin+2*c.whiteKeyWidth-c.halfBlackKeyWidth+w,c.topOrigin+w,bkw-w,c.blackKeyHeight-w);
    } else if (key === 'f#') {
      rect(c.leftOrigin+4*c.whiteKeyWidth-c.halfBlackKeyWidth+w,c.topOrigin+w,bkw-w,c.blackKeyHeight-w);
    } else if (key === 'g#') {
      rect(c.leftOrigin+5*c.whiteKeyWidth-c.halfBlackKeyWidth+w,c.topOrigin+w,bkw-w,c.blackKeyHeight-w);
    } else if (key === 'a#') {
      rect(c.leftOrigin+6*c.whiteKeyWidth-c.halfBlackKeyWidth+w,c.topOrigin+w,bkw-w,c.blackKeyHeight-w);
    }
  }

  function renderBgKeys(ctx) {
    ctx.strokeStyle = '#999999';
    ctx.fillStyle = '#333333';
    ctx.translate(0.5, 0.5);
    const c = keyCoords;

    // a rectangle around the whole thing
    ctx.strokeRect(c.leftOrigin, c.topOrigin, 7*c.whiteKeyWidth, c.blackKeyHeight+c.whiteKeyOnlyHeight);

    for (let i = 1; i <= 6; i++) {
      // outline of black key
      if (i !== 3) {
        ctx.fillRect(c.leftOrigin+i*c.whiteKeyWidth-c.halfBlackKeyWidth, c.topOrigin, c.halfBlackKeyWidth * 2, c.blackKeyHeight);
        ctx.strokeRect(c.leftOrigin+i*c.whiteKeyWidth-c.halfBlackKeyWidth, c.topOrigin, c.halfBlackKeyWidth * 2, c.blackKeyHeight);
      }

      // separator between white keys
      ctx.beginPath();
      ctx.moveTo(c.leftOrigin + i * c.whiteKeyWidth, c.topOrigin+c.blackKeyHeight+c.whiteKeyOnlyHeight);
      if (i === 3) {
        ctx.lineTo(c.leftOrigin + i * c.whiteKeyWidth, c.topOrigin);
      } else {
        ctx.lineTo(c.leftOrigin + i * c.whiteKeyWidth, c.topOrigin+c.blackKeyHeight);
      }
      ctx.stroke();
    }
    ctx.translate(-0.5, -0.5);
  }

  function updateKeyboard(rootKey, soundKey) {
    if (keyState.rootKey && keyState.rootKey !== rootKey) {
      fillKey(keyState.rootKey, '#449944', 'clear');
    }
    if (keyState.soundKey && keyState.soundKey !== soundKey) {
      fillKey(keyState.soundKey, '#449944', 'clear');
    }
    keyState.rootKey = rootKey;
    keyState.soundKey = soundKey;
    if (rootKey) {
      fillKey(rootKey, '#449944', 'fill');
    }
    if (soundKey && soundKey !== rootKey) {
      fillKey(soundKey, '#555555', 'fill');
    }
  }

  function handleKeyPressLogic(keyName, touch) {
    if (MutePanel.isPressed()) {
      touches.rootTouch = touch;
      SoundEngine.setRoot(keyName);
      if (keyName === keyState.soundKey) {
        touches.soundTouch = null;
        updateKeyboard(keyName, null);
      } else {
        updateKeyboard(keyName, keyState.soundKey);
      }
      return;
    }
    SoundEngine.playBassNote(keyName); // CORRECT SPOT
    touches.soundTouch = touch;
    if (touches.rootTouch != null) {
      updateKeyboard(keyState.rootKey, keyName);
    } else {
      touches.rootTouch = touch;
      SoundEngine.setRoot(keyName);
      updateKeyboard(keyName, keyName);
    }
  }

  function handleKeyReleaseLogic(touch) {
    if (touch === touches.rootTouch) {
      touches.rootTouch = null;
      // If both root and sound keys are held down and then root is released,
      // persist it anyway for the purposes of chords. Otherwise, set chord to empty
      if (keyState.soundKey == null || keyState.soundKey === keyState.rootKey) {
        updateKeyboard(null, null);
        SoundEngine.setRoot(null);
      }
    }
    if (touch === touches.soundTouch) {
      touches.soundTouch = null;
      // If both root and touch were held down and then root got released,
      // it wasn't cleared, as described in the comment above. We have to clear it now
      if (touches.rootTouch == null) {
        updateKeyboard(null, null);
        SoundEngine.setRoot(null);
      } else {
        updateKeyboard(keyState.rootKey, null);
      }
    }
  }

  function onKeyTouchStart(evt) {
    evt.preventDefault();
    const currTouches = evt.changedTouches;
    for (let i = 0; i < currTouches.length; i++) {
      const rect = fgKeyCanvas.getBoundingClientRect();
      const x = currTouches[i].clientX - rect.left;
      const y = currTouches[i].clientY - rect.top;
      const keyName = keyNameForCoords(x, y);
      if (keyName != null) {
        handleKeyPressLogic(keyName, currTouches[i].identifier);
      }
    }
  }

  function onKeyTouchEnd(evt) {
    evt.preventDefault();
    const currTouches = evt.changedTouches;
    for (let i = 0; i < currTouches.length; i++) {
      handleKeyReleaseLogic(currTouches[i].identifier);
    }
  }

  function draw() {
    bgKeyCanvas.width = keyCoords.totalWidth;
    bgKeyCanvas.height = keyCoords.totalHeight;
    fgKeyCanvas.width = keyCoords.totalWidth;
    fgKeyCanvas.height = keyCoords.totalHeight;
    renderBgKeys(bgKeyCtx);
    const rootKey = keyState.rootKey;
    const touchKey = keyState.touchKey;
    updateKeyboard(null, null);
    updateKeyboard(rootKey, touchKey);
  }

  function moveTo(x, y) {
    bgKeyCanvas.style.left = `${x}px`;
    bgKeyCanvas.style.top = `${y}px`;
    fgKeyCanvas.style.left = `${x}px`;
    fgKeyCanvas.style.top = `${y}px`;
  }

  function init(bgCanvas, fgCanvas) {
    bgKeyCanvas = bgCanvas;
    fgKeyCanvas = fgCanvas;
    bgKeyCtx = bgCanvas.getContext('2d');
    fgKeyCtx = fgCanvas.getContext('2d');
    fgCanvas.addEventListener('touchstart', onKeyTouchStart);
    fgCanvas.addEventListener('touchend', onKeyTouchEnd);
    draw();
  }

  return {
    init,
    draw,
    moveTo,
  };
}());
