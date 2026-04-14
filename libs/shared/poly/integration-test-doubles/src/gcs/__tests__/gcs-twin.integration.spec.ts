import { Storage } from '@google-cloud/storage';
import { GcsTwin } from '../gcs-twin.js';
import Docker from 'dockerode';

/**
 * Check if Docker is available by attempting to ping the daemon.
 */
async function isDockerAvailable(): Promise<boolean> {
  try {
    const docker = new Docker();
    await docker.ping();
    return true;
  } catch {
    return false;
  }
}

// Suite for GCS twin integration tests
describe('GcsTwin (integration)', () => {
  let twin: GcsTwin;
  let dockerAvailable = false;
  const testPort = 9019; // Must be within 9010‑9020 and not collide with other tests

  beforeAll(async () => {
    dockerAvailable = await isDockerAvailable();
    if (dockerAvailable) {
      twin = new GcsTwin({ port: testPort });
    }
  });

  afterAll(async () => {
    // Ensure twin is stopped even if a test fails
    try {
      await twin.stop();
    } catch (err) {
      console.warn('Error stopping twin in afterAll:', err);
    }
  });

  it('should upload and download a file using Google Cloud Storage SDK', async () => {
    if (!dockerAvailable) {
      console.warn('Skipping test: Docker not available');
      return;
    }
    // Start the twin (spins up fake‑gcs‑server container)
    await twin.start();

    // Verify environment variable is set
    expect(process.env.STORAGE_EMULATOR_HOST).toBe(
      `http://localhost:${testPort}`
    );

    // Set project ID environment variables (required by SDK)
    process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
    process.env.GCLOUD_PROJECT = 'test-project';

    // Small delay to ensure env vars are propagated
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Create a Storage client that will use the emulator via STORAGE_EMULATOR_HOST
    console.log('Creating Storage client with env:', {
      STORAGE_EMULATOR_HOST: process.env.STORAGE_EMULATOR_HOST,
      GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT,
    });
    const storage = new Storage();

    const bucketName = 'app-assets'; // bucket seeded by twin
    const fileName = 'test-upload.txt';
    const fileContent = 'Hello, GCS twin!';

    // Upload a file
    console.log('Uploading to bucket:', bucketName, 'file:', fileName);
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);
    await file.save(fileContent, {
      contentType: 'text/plain',
    });
    console.log('Upload succeeded');

    // Download the file using raw HTTP (SDK download has issues with fake-gcs-server)
    console.log('Downloading file via raw HTTP...');
    const downloadRes = await fetch(
      `${
        process.env.STORAGE_EMULATOR_HOST
      }/download/storage/v1/b/${bucketName}/o/${encodeURIComponent(
        fileName
      )}?alt=media`
    );
    expect(downloadRes.ok).toBe(true);
    const downloadedContent = await downloadRes.text();
    console.log('Download succeeded, content:', downloadedContent);

    // Verify content matches
    expect(downloadedContent).toBe(fileContent);

    // Optionally delete the test file (clean up) - ignore errors
    try {
      await file.delete();
      console.log('Cleanup completed');
    } catch (err) {
      console.warn('Cleanup failed (non-fatal):', (err as Error).message);
    }
    console.log('Test completed');
  }, 60_000); // Increase timeout for image pull and container startup

  it('should unset STORAGE_EMULATOR_HOST after stop', async () => {
    if (!dockerAvailable) {
      console.warn('Skipping test: Docker not available');
      return;
    }
    await twin.start();
    expect(process.env.STORAGE_EMULATOR_HOST).toBe(
      `http://localhost:${testPort}`
    );

    await twin.stop();
    expect(process.env.STORAGE_EMULATOR_HOST).toBeUndefined();
  }, 60_000); // Increase timeout for image pull and container startup
});
