import { AppleMusicTwin } from '../src/apple-music/index.js';

async function main() {
  const twin = new AppleMusicTwin();

  process.on('SIGINT', async () => {
    console.log('\nShutting down Apple Music twin...');
    await twin.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await twin.stop();
    process.exit(0);
  });

  await twin.start();
  console.log(`Apple Music Twin is running at ${twin.getEmulatorHost()}`);
  console.log('  Search: GET /v1/catalog/us/search?term=...&types=songs');
  console.log('  Shim:   GET /musickit.js');
  console.log('  Health: GET /test/apple-music/health');
  console.log('\nPress Ctrl+C to stop.');
}

main().catch((err) => {
  console.error('Failed to start Apple Music twin:', err);
  process.exit(1);
});
