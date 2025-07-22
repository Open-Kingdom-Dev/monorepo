import { logInfo, selectLogs } from '@ynaa/shared-data-access-logger';
import { useSelector, useDispatch } from 'react-redux';

export function App() {
  const logs = useSelector(selectLogs);
  const dispatch = useDispatch();
  return (
    <div>
      <h1>Hello World</h1>
      <p data-testid="logs-count">Logs: {logs.length}</p>
      <button data-testid="log-info-btn" onClick={() => dispatch(logInfo('Hello World'))}>Log Info</button>
    </div>
  );
}

export default App;
