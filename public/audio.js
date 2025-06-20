document.addEventListener('DOMContentLoaded', () => {
  const toggle          = document.getElementById('music-toggle');
  const player          = document.getElementById('music-player');
  const audio           = document.getElementById('audio');
  const playBtn         = document.getElementById('play-pause');
  const seek            = document.getElementById('seek');
  const widget          = document.getElementById('music-widget');
  const titleEl         = document.getElementById('track-title');
  const currentTimeEl   = document.getElementById('current-time');
  const totalDurationEl = document.getElementById('total-duration');

  // Inisialisasi judul track
  if (audio.dataset.title) titleEl.textContent = audio.dataset.title;

  // Toggle panel
  toggle.addEventListener('click', () => {
    player.style.display = player.style.display === 'block' ? 'none' : 'block';
  });

  // Load metadata
  audio.addEventListener('loadedmetadata', () => {
    totalDurationEl.textContent = formatTime(audio.duration);
    seek.max = audio.duration;
  });

  // Play/Pause
  playBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
      playBtn.textContent = '⏸️';
    } else {
      audio.pause();
      playBtn.textContent = '▶️';
    }
  });

  // Update waktu
  audio.addEventListener('timeupdate', () => {
    currentTimeEl.textContent = formatTime(audio.currentTime);
    seek.value = audio.currentTime;
  });

  // Seek
  seek.addEventListener('input', () => {
    audio.currentTime = seek.value;
  });

  // === NON-ACTIVE DRAG: hapus atau komentari ketiga listener berikut ===
  // widget.addEventListener('pointerdown', e => {});
  // widget.addEventListener('pointermove', e => {});
  // widget.addEventListener('pointerup', e => {});

  function formatTime(sec) {
    const m = Math.floor(sec/60), s = Math.floor(sec%60);
    return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  }
});