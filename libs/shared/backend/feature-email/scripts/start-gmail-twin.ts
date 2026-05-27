#!/usr/bin/env tsx
/**
 * Startup script for Gmail twin.
 *
 * Starts the NestJS Gmail mock server on a local port, handles
 * clean termination and outputs instructions.
 *
 * Usage:
 *   tsx scripts/start-gmail-twin.ts [port]
 */

import { GmailTwinServer } from '../src/lib/twin/gmail-twin-server.js';

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

  console.log('Starting NestJS Gmail twin...');
  const twin = new GmailTwinServer(port ? { port } : undefined);

  const cleanup = async () => {
    console.log('\nCleaning up...');
    try {
      await twin.stop();
      console.log('Gmail twin stopped.');
    } catch (err) {
      console.error('Error stopping twin:', (err as Error).message);
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  try {
    await twin.start();
    const startupTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n✅ Gmail twin started in ${startupTime}s`);
    console.log(
      `Twin Control Endpoint: http://localhost:${
        port || 9014
      }/test/gmail/emails`
    );
    console.log('\nPress Ctrl+C to stop the twin.\n');

    await new Promise<void>((resolve) => {
      process.on('exit', resolve);
    });
  } catch (err) {
    console.error('Failed to start Gmail twin:', (err as Error).message);
    await cleanup();
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
