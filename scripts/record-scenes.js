// Auto-record script: opens URLs in Chrome while FFmpeg records the screen
// Usage: node scripts/record-scenes.js

const { execSync, spawn } = require('child_process');

const SCENES = [
  { url: 'http://localhost:3000', duration: 5, label: 'Homepage' },
  { url: 'http://localhost:3000/workspace/star', duration: 17, label: 'Star Writing' },
  { url: 'http://localhost:3000/workspace/photon', duration: 11, label: 'Photon' },
  { url: 'http://localhost:3000/workspace/notes', duration: 6, label: 'Notes' },
  { url: 'http://localhost:3000/workspace/wanxiang', duration: 6, label: 'Wanxiang' },
  { url: 'http://localhost:3000', duration: 12, label: 'Close' },
];

const OUT_DIR = 'E:/lingyan/public/tmp/scenes';
execSync(`mkdir -p "${OUT_DIR}"`);

console.log('=== Starting auto-record ===');
console.log('Make sure Chrome is visible on screen!');
console.log('Recording will start in 3 seconds...\n');

setTimeout(() => {
  let sceneIndex = 0;

  function recordNext() {
    if (sceneIndex >= SCENES.length) {
      console.log('\n=== All scenes recorded! ===');
      process.exit(0);
    }

    const scene = SCENES[sceneIndex];
    console.log(`[${sceneIndex + 1}/${SCENES.length}] ${scene.label}: ${scene.url} (${scene.duration}s)`);

    // Open URL in Chrome
    execSync(`start chrome "${scene.url}"`, { timeout: 3000 }).catch(() => {});

    // Record segment
    const outFile = `${OUT_DIR}/scene-${String(sceneIndex).padStart(2, '0')}.mp4`;
    try {
      execSync(
        `ffmpeg -y -f gdigrab -framerate 30 -i desktop -t ${scene.duration} -c:v libx264 -preset ultrafast -crf 28 "${outFile}"`,
        { timeout: (scene.duration + 5) * 1000, stdio: 'inherit' }
      );
      console.log(`  -> saved: ${outFile}`);
    } catch (e) {
      console.error(`  -> error: ${e.message}`);
    }

    sceneIndex++;
    setTimeout(recordNext, 500);
  }

  recordNext();
}, 3000);
