#!/usr/bin/env tsx
/**
 * Startup script for GCS twin.
 *
 * Starts the fake-gcs-server container, seeds buckets, waits for health check,
 * and outputs the twin URL. Handles cleanup on exit.
 *
 * Usage:
 *   tsx scripts/start-twin.ts [port]
 *
 * Example:
 *   tsx scripts/start-twin.ts 9019
 */

import { GcsTwin } from '../src/gcs/gcs-twin.js';

async function main() {
  const startTime = Date.now();
  const portArg = process.argv[2];
  const port = portArg ? parseInt(portArg, 10) : undefined;

  if (
    portArg &&
    port !== undefined &&
    (isNaN(port) || port < 1 || port > 65535)
  ) {
    console.error(
      `Invalid port: ${portArg}. Must be a number between 1 and 65535.`
    );
    process.exit(1);
  }

  console.log('Starting GCS twin...');
  if (port) {
    console.log(`Using port: ${port}`);
  }

  const twin = new GcsTwin(port ? { port } : undefined);

  // Handle cleanup on exit
  const cleanup = async () => {
    console.log('\nCleaning up...');
    try {
      await twin.stop();
      console.log('GCS twin stopped.');
    } catch (err) {
      console.error('Error stopping twin:', (err as Error).message);
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', () => {
    // Synchronous cleanup for process exit
    console.log('Process exiting.');
  });

  try {
    await twin.start();
    const startupTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n✅ GCS twin started in ${startupTime}s`);
    console.log(`Twin URL: ${twin.getEmulatorHost()}`);
    console.log(`\nSet GCS_EMULATOR_URL=${twin.getEmulatorHost()}/storage/v1`);
    console.log('\nPress Ctrl+C to stop the twin.\n');

    // Keep the script running
    await new Promise(() => {
      // Intentionally never resolves - keeps the twin running
    });
  } catch (err) {
    console.error('Failed to start GCS twin:', (err as Error).message);
    await cleanup();
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
