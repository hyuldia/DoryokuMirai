(function () {
  let audioContext = null;

  let isMusicPlaying = false;
  let stopPlayback = false;
  let currentOscillator = null;
  let partition = null;

  const loadPartition = async () => {
    if (partition) return;

    try {
      const response = await fetch("./kickbackpartition.json");

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      partition = await response.json();
    } catch (error) {
      console.error("ERREUR PARTITION NON TROUVEE.", error);
      return;
    }
  };

  function getAudioContext() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
  }

  const playsound = ({ frequency, beat }) =>
    new Promise((resolve) => {
      if (stopPlayback) {
        return resolve();
      }

      const ctx = getAudioContext();
      const gain = new GainNode(ctx);
      const noteDuration = beat * 0.18;

      gain.connect(ctx.destination);
      gain.gain.value = 0.1;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.01);
      gain.gain.linearRampToValueAtTime(
        0,
        ctx.currentTime + noteDuration - 0.01
      );

      const oscillator = new OscillatorNode(ctx);
      currentOscillator = oscillator;

      oscillator.type = "triangle";
      oscillator.connect(gain);
      oscillator.frequency.value = frequency;
      oscillator.start();

      setTimeout(() => {
        oscillator.stop();
        currentOscillator = null;
        resolve();
      }, noteDuration * 1000);
    });

  const stopsong = function () {
    if (currentOscillator) {
      currentOscillator.stop();
      currentOscillator = null;
    }

    stopPlayback = true;
    isMusicPlaying = false;
    const musicButton = document.getElementById("playmusic");
    if (musicButton) musicButton.textContent = "CLIQUE ICI BORDEL";
    toggleGifs(false);
  };

  const toggleGifs = (active) => {
    const gifs = document.querySelectorAll(".music-gif");
    gifs.forEach((gif) => {
      if (active) {
        gif.classList.add("music-active");
      } else {
        gif.classList.remove("music-active");
      }
    });
  };

  const playsong = async function () {
    if (isMusicPlaying) return;
    if (!partition) {
      await loadPartition();
    }
    if (!Array.isArray(partition)) {
      console.error("ERREUR PARTITION NON CHARGEE OU PAS ARRAY");
      stopsong();
      return;
    }
    isMusicPlaying = true;
    stopPlayback = false;
    const musicButton = document.getElementById("playmusic");
    if (musicButton) musicButton.textContent = "NE CLIQUE PAAAAS";
    toggleGifs(true);
    for (const noteGroup of partition) {
      if (stopPlayback) {
        break;
      }

      if (!noteGroup || !noteGroup.keys || noteGroup.keys.length === 0) {
        continue;
      }

      const notePromises = noteGroup.keys.map((singleNote) => {
        return playsound(singleNote);
      });

      await Promise.all(notePromises);
    }

    if (!stopPlayback) {
      isMusicPlaying = false;
      if (musicButton) musicButton.textContent = "CLIQUE ICI BORDEL";
      toggleGifs(false);
    }
    stopPlayback = false;
  };

  const musicButton = document.getElementById("playmusic");

  if (musicButton) {
    musicButton.addEventListener("click", () => {
      if (isMusicPlaying) {
        stopsong();
      } else {
        playsong();
      }
    });
  }
})();
