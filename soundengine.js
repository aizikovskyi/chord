/* eslint-env browser */
/* eslint-disable no-loop-func */
/* global debugLog */

window.SoundEngine = (function makeSoundEngine() {
  let audioCtx;
  let bassGain;
  let trebleGain;
  let masterGain;
  const samples = {};
  let lastUserChordPressTime = 0.0;
  let lastChordTime = 0.0;
  let lastRealChordTime = 0.0; // doesn't include pauses
  let lastRootReleaseTime = 0.0;
  let lastChordType = null;
  let lastRealChordRoot = null;
  let chordGains;
  let currentChordGain = 0;
  let currentRoot = null;

  const GAIN_LEVELS = {
    bass: 1.0,
    treble: 1.0,
    master: 0.4,
    almostZero: 0.0001,
  };

  const QUICK_DECAY_TIME = 0.3;

  const pitchClasses = { 'c': 0, 'c#': 1, 'd': 2, 'd#': 3, 'e': 4, 'f': 5, 'f#': 6, 'g': 7, 'g#': 8, 'a': 9, 'a#': 10, 'b': 11 };

  const chords = {
    '5': [0, 7],
    'maj': [0, 4, 7],
    'min': [0, 3, 7],
    'maj7': [0, 4, 7, 11],
    'm7': [0, 3, 7, 10],
    'mM7': [0, 3, 7, 11],
    'maj9': [4, 7, 11, 14],
    '9': [4, 7, 10, 14],
    'm9': [3, 7, 10, 14],
    '7': [0, 4, 7, 10],
    '7b9': [4, 7, 10, 13],
    '7b5': [0, 4, 6, 10],
    '7#5': [0, 4, 8, 10],
    '6': [0, 4, 7, 9],
    'm6': [0, 3, 7, 9],
    'm7b5': [0, 3, 6, 10],
    'dim': [0, 3, 6, 9],
    'sus': [0, 5, 7],
    'sus7': [0, 5, 7, 10],
  };

  const sampleInfo = {
    bassCOffset: 16,
    trebleCOffset: 40,
    trebleLowestSample: 35,
    trebleHighestSample: 46,
  };

  function playSample(i, gainNode) {
    if (samples[i] == null) return null; // not yet ready, or some other problem
    const source = audioCtx.createBufferSource();
    source.buffer = samples[i];
    source.connect(gainNode);
    source.start(0);
    return source;
  }

  function initSamples() {
    // bass samples: 16-27 (c-b)
    // treble samples: 35-46 (g-f#)
    for (let i = sampleInfo.bassCOffset; i <= sampleInfo.trebleHighestSample; i++) {
      if (i <= sampleInfo.bassCOffset + 11 || i >= sampleInfo.trebleLowestSample) {
        const request = new XMLHttpRequest();
        const sampleIdx = `00${i}`.slice(-3);
        const url = `samples/piano${sampleIdx}.wav`;
        const onError = e => `Error with decoding audio data: ${e.err}`;
        request.responseType = 'arraybuffer';
        request.open('GET', url, true);
        request.onload = () => {
          audioCtx.decodeAudioData(request.response, (buffer) => {
            samples[i] = buffer;
          }, onError);
        };
        request.send();
      }
    }
  }

  function playChordInternal(chordName) {
    if (chords[chordName] == null) return;

    lastChordType = chordName;
    lastChordTime = audioCtx.currentTime;

    // Play the chord if a current root exists, OR
    // if it was cleared only very recently
    const recentRoot = currentRoot || ((audioCtx.currentTime - lastRootReleaseTime < 0.07) ? lastRealChordRoot : null);
    if (recentRoot) {
      lastRealChordTime = lastChordTime;

      const oldGainNode = chordGains[currentChordGain];
      // if (oldGainNode.gain.value > GAIN_LEVELS.almostZero) {
      // A chord is already playing. Silence it gracefully before moving on
      oldGainNode.gain.setValueAtTime(1, audioCtx.currentTime);
      oldGainNode.gain.exponentialRampToValueAtTime(GAIN_LEVELS.almostZero,
        audioCtx.currentTime + QUICK_DECAY_TIME);
      // }

      currentChordGain = (currentChordGain + 1) % chordGains.length;
      const gainNode = chordGains[currentChordGain];
      gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
      gainNode.gain.setValueAtTime(1, audioCtx.currentTime);

      for (let i = 0; i < chords[chordName].length; i++) {
        let sampleIdx = chords[chordName][i] + sampleInfo.trebleCOffset + pitchClasses[recentRoot];
        while (sampleIdx < sampleInfo.trebleLowestSample) sampleIdx += 12;
        while (sampleIdx > sampleInfo.trebleHighestSample) sampleIdx -= 12;
        playSample(sampleIdx, gainNode);
      }
    }
  }

  function playChord(chordName) {
    lastUserChordPressTime = audioCtx.currentTime;
    playChordInternal(chordName);
  }

  function init() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    initSamples();

    const limiter = audioCtx.createDynamicsCompressor();
    limiter.threshold.value = 0.0; // this is the pitfall, leave some headroom
    limiter.knee.value = 0.0; // brute force
    limiter.ratio.value = 20.0; // max compression
    limiter.attack.value = 0.005; // 5ms attack
    limiter.release.value = 0.050; // 50ms release
    limiter.connect(audioCtx.destination);

    masterGain = audioCtx.createGain();
    masterGain.gain.value = GAIN_LEVELS.master;
    masterGain.connect(limiter);
    bassGain = audioCtx.createGain();
    bassGain.gain.value = GAIN_LEVELS.bass;
    bassGain.connect(masterGain);
    trebleGain = audioCtx.createGain();
    trebleGain.gain.value = GAIN_LEVELS.treble;
    trebleGain.connect(masterGain);

    chordGains = [];
    for (let i = 0; i <= 64; i++) {
      chordGains[i] = audioCtx.createGain();
      chordGains[i].gain.value = GAIN_LEVELS.almostZero;
      chordGains[i].connect(trebleGain);
    }
  }

  function setRoot(noteName) {
    if (currentRoot === noteName) return;
    currentRoot = noteName;
    if (noteName == null) {
      lastRootReleaseTime = audioCtx.currentTime;
      return;
    }
    // if the previous chord was played really recently, repeat it with the new root
    // DON'T repeat the chord if the one played really recently was the same one,
    // UNLESS the user actually pressed the chord grid button since then, and this press
    // did not result in a chord (because the root was turned off)
    if (audioCtx.currentTime - lastChordTime < 0.07) {
      if (lastRealChordRoot !== currentRoot) {
        playChordInternal(lastChordType);
      } else if (audioCtx.currentTime - lastRealChordTime > 0.5 ||
                 lastUserChordPressTime > lastRealChordTime) {
        playChordInternal(lastChordType);
      }
    }
    lastRealChordRoot = noteName;
  }

  function playBassNote(noteName) {
    playSample(pitchClasses[noteName] + sampleInfo.bassCOffset, bassGain);
  }
  return {
    init,
    setRoot,
    playBassNote,
    playChord,
  };
}());
