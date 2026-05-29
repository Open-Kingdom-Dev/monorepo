import { YoutubeTwin } from '../src/youtube/index.js';

async function main() {
  const twin = new YoutubeTwin();

  process.on('SIGINT', async () => {
    console.log('\nShutting down YouTube twin...');
    await twin.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await twin.stop();
    process.exit(0);
  });

  await twin.start();
  console.log(`YouTube Twin is running at ${twin.getEmulatorHost()}`);
  console.log('  Search: GET /youtube/v3/search?q=...&key=test&part=snippet');
  console.log('  Shim:   GET /iframe_api');
  console.log('  Health: GET /test/youtube/health');
  console.log('\nPress Ctrl+C to stop.');
}

main().catch((err) => {
  console.error('Failed to start YouTube twin:', err);
  process.exit(1);
});
