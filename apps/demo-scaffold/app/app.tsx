import { logInfo, selectLogs } from '@ynaa/shared-data-access-logger';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '@ynaa/shared-ui-theme';

export function App() {
  const logs = useSelector(selectLogs);
  const dispatch = useDispatch();
  const { mode, setMode } = useTheme();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 dark:text-primary-400">
            Hello World
          </h1>
          <button
            onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg shadow-md transition-colors"
          >
            Toggle {mode === 'light' ? 'Dark' : 'Light'} Mode
          </button>
        </div>
        
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-neutral-800 dark:text-neutral-200">
            Application State
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300 mb-4">
            Logs: <span className="font-mono text-primary-600 dark:text-primary-400">{logs.length}</span>
          </p>
          <button 
            data-testid="log-info-btn" 
            onClick={() => dispatch(logInfo('Hello World'))}
            className="px-4 py-2 bg-success-500 hover:bg-success-600 text-white rounded-md transition-colors"
          >
            Log Info
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-primary-50 dark:bg-primary-900/20 p-6 rounded-lg border border-primary-200 dark:border-primary-700">
            <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200 mb-2">Primary Colors</h3>
            <p className="text-primary-600 dark:text-primary-400">This demonstrates the primary color palette.</p>
          </div>
          
          <div className="bg-secondary-50 dark:bg-secondary-900/20 p-6 rounded-lg border border-secondary-200 dark:border-secondary-700">
            <h3 className="text-lg font-semibold text-secondary-800 dark:text-secondary-200 mb-2">Secondary Colors</h3>
            <p className="text-secondary-600 dark:text-secondary-400">This demonstrates the secondary color palette.</p>
          </div>
          
          <div className="bg-neutral-50 dark:bg-neutral-800 p-6 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">Neutral Colors</h3>
            <p className="text-neutral-600 dark:text-neutral-400">This demonstrates the neutral color palette.</p>
          </div>
        </div>


      </div>
    </div>
  );
}

export default App;
