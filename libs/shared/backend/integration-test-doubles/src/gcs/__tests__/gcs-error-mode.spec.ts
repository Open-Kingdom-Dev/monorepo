import {
  isGcsDataOperation,
  isUploadOperation,
  extractBucketName,
  GcsErrorModeManager,
} from '../gcs-error-mode.js';

describe('isGcsDataOperation', () => {
  it('matches NestJS /api/gcs/* paths', () => {
    expect(isGcsDataOperation('POST', '/api/gcs/upload')).toBe(true);
    expect(isGcsDataOperation('GET', '/api/gcs/files?bucket=app-assets')).toBe(
      true
    );
    expect(
      isGcsDataOperation('GET', '/api/gcs/files/app-assets/test.txt/url')
    ).toBe(true);
    expect(
      isGcsDataOperation('GET', '/api/gcs/files/app-assets/test.txt/download')
    ).toBe(true);
    expect(
      isGcsDataOperation('POST', '/api/gcs/files/app-assets/test.txt/delete')
    ).toBe(true);
  });

  it('excludes twin control endpoints', () => {
    expect(isGcsDataOperation('POST', '/api/twin/gcs/error-mode')).toBe(false);
    expect(isGcsDataOperation('DELETE', '/api/twin/gcs/error-mode')).toBe(
      false
    );
    expect(isGcsDataOperation('GET', '/api/twin/gcs/error-mode')).toBe(false);
    expect(isGcsDataOperation('GET', '/api/twin/status')).toBe(false);
    expect(isGcsDataOperation('POST', '/api/twin/start')).toBe(false);
  });

  it('excludes error-mode control endpoints', () => {
    expect(isGcsDataOperation('POST', '/api/gcs/error-mode')).toBe(false);
    expect(isGcsDataOperation('DELETE', '/api/gcs/error-mode')).toBe(false);
    expect(isGcsDataOperation('GET', '/api/gcs/error-mode')).toBe(false);
  });

  it('excludes non-GCS endpoints', () => {
    expect(isGcsDataOperation('GET', '/')).toBe(false);
    expect(isGcsDataOperation('GET', '/health')).toBe(false);
    expect(isGcsDataOperation('GET', '/healthz')).toBe(false);
    expect(isGcsDataOperation('GET', '/api/auth/login')).toBe(false);
    expect(isGcsDataOperation('GET', '/api/users')).toBe(false);
  });

  it('matches native GCS API paths', () => {
    expect(isGcsDataOperation('GET', '/storage/v1/b/app-assets/o')).toBe(true);
    expect(
      isGcsDataOperation('POST', '/upload/storage/v1/b/app-assets/o')
    ).toBe(true);
    expect(
      isGcsDataOperation('GET', '/download/storage/v1/b/app-assets/o/test.txt')
    ).toBe(true);
    expect(isGcsDataOperation('GET', '/b/app-assets/o')).toBe(true);
  });
});

describe('isUploadOperation', () => {
  it('matches NestJS /api/gcs/upload path', () => {
    expect(isUploadOperation('POST', '/api/gcs/upload')).toBe(true);
  });

  it('does not match GET requests', () => {
    expect(isUploadOperation('GET', '/api/gcs/upload')).toBe(false);
    expect(isUploadOperation('GET', '/api/gcs/files?bucket=app-assets')).toBe(
      false
    );
  });

  it('does not match non-upload NestJS GCS paths', () => {
    expect(
      isUploadOperation('POST', '/api/gcs/files/app-assets/test.txt/delete')
    ).toBe(false);
  });

  it('matches native GCS upload paths', () => {
    expect(isUploadOperation('POST', '/upload/storage/v1/b/app-assets/o')).toBe(
      true
    );
    expect(isUploadOperation('POST', '/storage/v1/b/app-assets/o')).toBe(true);
  });
});

describe('extractBucketName', () => {
  describe('NestJS /api/gcs paths', () => {
    it('extracts from query-string bucket parameter', () => {
      expect(extractBucketName('/api/gcs/files?bucket=app-assets')).toBe(
        'app-assets'
      );
      expect(
        extractBucketName('/api/gcs/files?bucket=user-uploads&other=1')
      ).toBe('user-uploads');
    });

    it('extracts from path-based bucket parameter', () => {
      expect(extractBucketName('/api/gcs/files/app-assets/test.txt/url')).toBe(
        'app-assets'
      );
      expect(
        extractBucketName('/api/gcs/files/user-uploads/photo.jpg/download')
      ).toBe('user-uploads');
    });

    it('returns undefined for upload endpoint (bucket in body)', () => {
      expect(extractBucketName('/api/gcs/upload')).toBeUndefined();
    });
  });

  describe('Native GCS API paths', () => {
    it('extracts bucket from standard paths', () => {
      expect(extractBucketName('/storage/v1/b/app-assets/o')).toBe(
        'app-assets'
      );
      expect(extractBucketName('/storage/v1/b/user-uploads')).toBe(
        'user-uploads'
      );
    });

    it('extracts bucket from upload/download prefixes', () => {
      expect(extractBucketName('/upload/storage/v1/b/app-assets/o')).toBe(
        'app-assets'
      );
      expect(
        extractBucketName('/download/storage/v1/b/my-bucket/o/file.txt')
      ).toBe('my-bucket');
    });

    it('extracts bucket from short form', () => {
      expect(extractBucketName('/b/app-assets/o')).toBe('app-assets');
    });
  });
});

describe('GcsErrorModeManager.matchRequest with /api/gcs paths', () => {
  let manager: GcsErrorModeManager;

  beforeEach(() => {
    manager = new GcsErrorModeManager();
  });

  it('permission-denied blocks all /api/gcs operations', () => {
    manager.setMode({ type: 'permission-denied' });

    const listResult = manager.matchRequest(
      'GET',
      '/api/gcs/files?bucket=app-assets'
    );
    expect(listResult).not.toBeNull();
    expect(listResult!.status).toBe(403);

    const uploadResult = manager.matchRequest('POST', '/api/gcs/upload');
    expect(uploadResult).not.toBeNull();
    expect(uploadResult!.status).toBe(403);

    const downloadResult = manager.matchRequest(
      'GET',
      '/api/gcs/files/app-assets/test.txt/url'
    );
    expect(downloadResult).not.toBeNull();
    expect(downloadResult!.status).toBe(403);

    const deleteResult = manager.matchRequest(
      'POST',
      '/api/gcs/files/app-assets/test.txt/delete'
    );
    expect(deleteResult).not.toBeNull();
    expect(deleteResult!.status).toBe(403);
  });

  it('quota-exceeded blocks /api/gcs/upload only', () => {
    manager.setMode({ type: 'quota-exceeded' });

    const uploadResult = manager.matchRequest('POST', '/api/gcs/upload');
    expect(uploadResult).not.toBeNull();
    expect(uploadResult!.status).toBe(403);

    const listResult = manager.matchRequest(
      'GET',
      '/api/gcs/files?bucket=app-assets'
    );
    expect(listResult).toBeNull();
  });

  it('bucket-not-found matches bucket from query string', () => {
    manager.setMode({ type: 'bucket-not-found', bucketName: 'app-assets' });

    const result = manager.matchRequest(
      'GET',
      '/api/gcs/files?bucket=app-assets'
    );
    expect(result).not.toBeNull();
    expect(result!.status).toBe(404);

    // Different bucket should pass through
    const otherResult = manager.matchRequest(
      'GET',
      '/api/gcs/files?bucket=other-bucket'
    );
    expect(otherResult).toBeNull();
  });

  it('bucket-not-found matches bucket from path parameter', () => {
    manager.setMode({ type: 'bucket-not-found', bucketName: 'app-assets' });

    const result = manager.matchRequest(
      'GET',
      '/api/gcs/files/app-assets/test.txt/url'
    );
    expect(result).not.toBeNull();
    expect(result!.status).toBe(404);
  });

  it('does not match /api/twin endpoints', () => {
    manager.setMode({ type: 'permission-denied' });

    expect(manager.matchRequest('GET', '/api/twin/status')).toBeNull();
    expect(manager.matchRequest('POST', '/api/twin/gcs/error-mode')).toBeNull();
    expect(
      manager.matchRequest('DELETE', '/api/twin/gcs/error-mode')
    ).toBeNull();
  });

  it('permission-denied does not block error-mode control endpoints', () => {
    manager.setMode({ type: 'permission-denied' });

    // Deactivation must always be reachable
    expect(manager.matchRequest('DELETE', '/api/gcs/error-mode')).toBeNull();
    // Activation (mode switching) must also be reachable
    expect(manager.matchRequest('POST', '/api/gcs/error-mode')).toBeNull();
  });

  it('clearMode resets to pass-through', () => {
    manager.setMode({ type: 'permission-denied' });
    expect(
      manager.matchRequest('GET', '/api/gcs/files?bucket=app-assets')
    ).not.toBeNull();

    manager.clearMode();
    expect(
      manager.matchRequest('GET', '/api/gcs/files?bucket=app-assets')
    ).toBeNull();
  });
});
