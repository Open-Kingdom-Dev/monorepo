/* eslint-disable jsx-a11y/accessible-emoji */
import { useState } from 'react';
import {
  useGcsStorageControllerActivateErrorModeMutation,
  useGcsStorageControllerDeactivateErrorModeMutation,
  useTwinControllerGetStatusQuery,
  type GcsErrorModeType,
  type ErrorModeStateDto,
} from '@open-kingdom/shared-frontend-data-access-api-client';
import {
  showSuccessNotification,
  showErrorNotification,
} from '@open-kingdom/shared-frontend-data-access-notifications';
import { useDispatch } from 'react-redux';

const ERROR_MODES: {
  type: GcsErrorModeType;
  label: string;
  description: string;
}[] = [
  {
    type: 'bucket-not-found',
    label: 'Bucket Not Found',
    description: 'Returns 404 for a specific bucket name',
  },
  {
    type: 'quota-exceeded',
    label: 'Quota Exceeded',
    description: 'Returns 403 on all upload operations',
  },
  {
    type: 'permission-denied',
    label: 'Permission Denied',
    description: 'Returns 403 on all GCS data operations',
  },
  {
    type: 'intermittent-failure',
    label: 'Intermittent Failure',
    description: 'Returns 500 every Nth request (deterministic)',
  },
];

/**
 * Banner shown when error simulation is active.
 * Only displays the label and a human-readable description — no raw JSON.
 */
export function ErrorBanner({ mode }: { mode: ErrorModeStateDto }) {
  if (!mode.active || !mode.type) return null;

  const errorInfo = ERROR_MODES.find((m) => m.type === mode.type);
  const label = errorInfo?.label ?? mode.type;
  const description = mode.description ?? errorInfo?.description ?? '';

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-red-500 bg-red-50 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
      {/* Animated pulse background */}
      <div className="absolute inset-0 bg-red-100 animate-pulse opacity-30" />

      <div className="relative p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 pt-1">
            <svg
              className="h-10 w-10 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.948 3.374c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-red-900 mb-1">
              ⚠️ ERROR SIMULATION ACTIVE
            </h2>
            <p className="text-lg font-semibold text-red-800 mb-1">{label}</p>
            {description && (
              <p className="text-sm text-red-700">{description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ErrorSimulatorPanel() {
  const dispatch = useDispatch();
  const { data: twinStatus } = useTwinControllerGetStatusQuery(undefined, {
    pollingInterval: 10000,
  });
  const [activateMode, { isLoading: activating }] =
    useGcsStorageControllerActivateErrorModeMutation();
  const [deactivateMode, { isLoading: deactivating }] =
    useGcsStorageControllerDeactivateErrorModeMutation();

  const [selectedType, setSelectedType] =
    useState<GcsErrorModeType>('quota-exceeded');
  const [bucketName, setBucketName] = useState('app-assets');
  const [failEveryN, setFailEveryN] = useState(2);

  const twinRunning = twinStatus?.running ?? false;
  const twinHealthy = twinStatus?.healthy ?? false;
  const modeActive = twinStatus?.errorMode?.active ?? false;
  const errorMode = twinStatus?.errorMode ?? null;

  const isDisabled = !twinRunning || !twinHealthy;

  const handleActivate = async () => {
    try {
      const payload: {
        type: GcsErrorModeType;
        bucketName?: string;
        failEveryN?: number;
      } = {
        type: selectedType,
      };
      if (selectedType === 'bucket-not-found') {
        payload.bucketName = bucketName;
      }
      if (selectedType === 'intermittent-failure') {
        payload.failEveryN = failEveryN;
      }
      await activateMode({ activateErrorModeDto: payload }).unwrap();
      dispatch(
        showSuccessNotification(`Error mode "${selectedType}" activated`)
      );
    } catch (err) {
      dispatch(
        showErrorNotification(`Failed to activate: ${(err as Error).message}`)
      );
    }
  };

  const handleDeactivate = async () => {
    try {
      await deactivateMode().unwrap();
      dispatch(showSuccessNotification('Error mode deactivated'));
    } catch (err) {
      dispatch(
        showErrorNotification(`Failed to deactivate: ${(err as Error).message}`)
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Control panel */}
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span role="img" aria-label="Flask">
            🧪
          </span>
          Error Simulator
        </h2>

        {isDisabled && (
          <div className="mb-4 p-3 bg-gray-100 rounded text-sm text-gray-600">
            Start the GCS Twin to enable error simulation.
          </div>
        )}

        {/* Active mode indicator */}
        {modeActive && errorMode?.type && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800">
              Active:{' '}
              <span className="font-bold">
                {ERROR_MODES.find((m) => m.type === errorMode.type)?.label ??
                  errorMode.type}
              </span>
            </p>
            {errorMode.description && (
              <p className="text-xs text-red-700 mt-1">
                {errorMode.description}
              </p>
            )}
          </div>
        )}

        {/* Mode selector */}
        <div className="space-y-3 mb-6">
          <label className="block text-sm font-medium text-gray-700">
            Error Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ERROR_MODES.map((mode) => (
              <button
                key={mode.type}
                onClick={() => setSelectedType(mode.type)}
                disabled={isDisabled || modeActive}
                className={`px-3 py-2 text-sm rounded-lg border-2 text-left transition-all ${
                  selectedType === mode.type
                    ? 'border-blue-500 bg-blue-50 text-blue-900 font-medium shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                } ${
                  isDisabled || modeActive
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                <div className="font-medium">{mode.label}</div>
                <div className="text-xs opacity-75 mt-0.5">
                  {mode.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Per-mode config */}
        {selectedType === 'bucket-not-found' && (
          <div className="mb-4">
            <label
              htmlFor="bucket-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Bucket Name
            </label>
            <input
              id="bucket-name"
              type="text"
              value={bucketName}
              onChange={(e) => setBucketName(e.target.value)}
              placeholder="app-assets"
              disabled={isDisabled || modeActive}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        )}

        {selectedType === 'intermittent-failure' && (
          <div className="mb-4">
            <label
              htmlFor="fail-every-n"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Fail every Nth request
            </label>
            <input
              id="fail-every-n"
              type="number"
              min={2}
              max={100}
              value={failEveryN}
              onChange={(e) =>
                setFailEveryN(Math.max(2, parseInt(e.target.value) || 2))
              }
              disabled={isDisabled || modeActive}
              className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Every {failEveryN}nd request will return 500 (deterministic)
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {!modeActive ? (
            <button
              onClick={handleActivate}
              disabled={isDisabled || activating}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {activating ? 'Activating...' : 'Activate Error Mode'}
            </button>
          ) : (
            <button
              onClick={handleDeactivate}
              disabled={deactivating}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {deactivating ? 'Deactivating...' : 'Deactivate Error Mode'}
            </button>
          )}
        </div>

        {/* Current state */}
        {!modeActive && (
          <p className="mt-4 text-sm text-gray-500">
            No error mode active — all operations pass through normally.
          </p>
        )}
      </div>
    </div>
  );
}
