export function SharedUiNotifications() {
  return (
    <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700">
      <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-4">
        Welcome to SharedUiNotifications!
      </h1>
      <div className="space-y-4">
        <div className="p-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-700 rounded-md">
          <h3 className="text-lg font-semibold text-success-800 dark:text-success-200 mb-2">
            Success Notification
          </h3>
          <p className="text-success-600 dark:text-success-400">
            This is a success notification using the theme system.
          </p>
        </div>
        
        <div className="p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-700 rounded-md">
          <h3 className="text-lg font-semibold text-warning-800 dark:text-warning-200 mb-2">
            Warning Notification
          </h3>
          <p className="text-warning-600 dark:text-warning-400">
            This is a warning notification using the theme system.
          </p>
        </div>
        
        <div className="p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-700 rounded-md">
          <h3 className="text-lg font-semibold text-error-800 dark:text-error-200 mb-2">
            Error Notification
          </h3>
          <p className="text-error-600 dark:text-error-400">
            This is an error notification using the theme system.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SharedUiNotifications;
