function ToastHost({ toast }) {
  if (!toast?.show) return null;

  const typeToBorderClass = {
    success: 'toast-accent-success',
    danger: 'toast-accent-danger',
    info: 'toast-accent-info',
  };

  return (
    <div className="toast-host position-fixed top-0 end-0 p-3">
      <div className={`toast toast-custom show ${typeToBorderClass[toast.type] || typeToBorderClass.info}`} role="status" aria-live="polite">
        <div className="toast-body d-flex justify-content-between align-items-center gap-3">
          <span>{toast.message}</span>
        </div>
      </div>
    </div>
  );
}

export default ToastHost;
