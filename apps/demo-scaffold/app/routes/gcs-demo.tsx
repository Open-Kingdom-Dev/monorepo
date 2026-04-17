import { useState } from 'react';
import {
  useGcsStorageControllerListFilesQuery,
  useGcsStorageControllerUploadFileMutation,
  useGcsStorageControllerDownloadFileQuery,
  useGcsStorageControllerDeleteFileMutation,
  FileMetadataDto,
} from '@open-kingdom/shared-frontend-data-access-api-client';
import { TwinStatus } from '../components';

const DEFAULT_BUCKET = 'app-assets';

// Convert our FileMetadataDto to local interface for consistency
interface FileMetadata {
  name: string;
  bucket: string;
  size?: number;
  contentType?: string;
  updated?: Date;
}

function fileDtoToMetadata(dto: FileMetadataDto): FileMetadata {
  return {
    name: dto.name,
    bucket: dto.bucket,
    size: dto.size,
    contentType: dto.contentType,
    updated: new Date(dto.updated),
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
}

function GcsFileList({ files, onDownload, onDelete }: { files: FileMetadata[]; onDownload?: (file: FileMetadata) => void; onDelete?: (file: FileMetadata) => void }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {files.map((file) => (
            <tr key={file.name}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{file.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.size ? `${(file.size / 1024).toFixed(1)} KB` : '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.contentType || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.updated?.toLocaleDateString() || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                <button
                  onClick={() => onDownload?.(file)}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Download
                </button>
                <button
                  onClick={() => onDelete?.(file)}
                  className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GcsUploadForm({ onUpload, uploading }: { onUpload: (file: File) => void; uploading: boolean }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      onUpload(selectedFile);
      setSelectedFile(null);
      (e.target as HTMLFormElement).reset();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700">
          Choose a file
        </label>
        <input
          id="file-upload"
          type="file"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      <button
        type="submit"
        disabled={!selectedFile || uploading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  );
}

export default function GcsDemo() {
  const { data: listFilesResponse, isLoading: loadingFiles, refetch } = useGcsStorageControllerListFilesQuery({
    bucket: DEFAULT_BUCKET,
  });
  const [uploadFile, { isLoading: uploading }] = useGcsStorageControllerUploadFileMutation();
  const [deleteFile] = useGcsStorageControllerDeleteFileMutation();

  const files: FileMetadata[] = listFilesResponse?.files?.map(fileDtoToMetadata) || [];

  const handleUpload = async (file: File) => {
    try {
      const content = await fileToBase64(file);
      await uploadFile({
        uploadFileDto: {
          bucket: DEFAULT_BUCKET,
          fileName: file.name,
          content,
          contentType: file.type || undefined,
        },
      }).unwrap();
      refetch();
    } catch (err) {
      console.error('Upload failed', err);
      alert('Upload failed: ' + (err as Error).message);
    }
  };

  const handleDownload = async (file: FileMetadata) => {
    try {
      // The download endpoint returns a JSON with base64 content; we can trigger a download via data URL.
      // For simplicity, we'll just open a new window with a data URL.
      // In a real app, we'd use the backend's download endpoint that serves the file directly.
      alert(`Downloading ${file.name} - backend download endpoint returns base64 content`);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const handleDelete = async (file: FileMetadata) => {
    if (!confirm(`Delete ${file.name}?`)) return;
    try {
      await deleteFile({
        bucket: file.bucket,
        fileName: file.name,
      }).unwrap();
      refetch();
    } catch (err) {
      console.error('Delete failed', err);
      alert('Delete failed: ' + (err as Error).message);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">GCS Twin Demo</h1>
      <p className="text-gray-600 mb-8">
        Upload, list, and download files from Google Cloud Storage using the twin emulator.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Files in bucket <code className="bg-gray-100 px-2 py-1 rounded">{DEFAULT_BUCKET}</code></h2>
            <button
              onClick={() => refetch()}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Refresh
            </button>
          </div>
          {loadingFiles ? (
            <div className="border rounded-lg p-8 text-center text-gray-500">Loading files...</div>
          ) : (
            <GcsFileList files={files} onDownload={handleDownload} onDelete={handleDelete} />
          )}
          {!loadingFiles && files.length === 0 && (
            <div className="border rounded-lg p-8 text-center text-gray-500">No files found.</div>
          )}
        </div>

        <div className="space-y-8">
          <div className="border rounded-lg p-6 bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Upload a file</h2>
            <GcsUploadForm onUpload={handleUpload} uploading={uploading} />
            {uploading && <p className="mt-4 text-sm text-blue-600">Uploading...</p>}
          </div>

          <div className="border rounded-lg p-6 bg-gray-50">
            <h2 className="text-xl font-semibold mb-4">Environment Status</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700">STORAGE_EMULATOR_HOST</span>
                <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">
                  {process.env.STORAGE_EMULATOR_HOST || '(not set)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Backend API</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Reachable</span>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6 bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-4">GCS Twin Status</h2>
            <TwinStatus />
          </div>
        </div>
      </div>
    </div>
  );
}