import { Link } from 'react-router-dom';
import { useState } from 'react';
import { changePassword } from '../api';

function Settings({ onLogout, showToast }) {
  const [form, setForm] = useState({ newPassword1: '', newPassword2: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.newPassword1 || !form.newPassword2) {
      setError('Both password fields are required.');
      return;
    }

    setLoading(true);
    try {
      await changePassword(form);
      setForm({ newPassword1: '', newPassword2: '' });
      showToast?.('Password changed successfully.', 'success');
    } catch (err) {
      setError(err.message || 'Failed to change password');
      showToast?.(err.message || 'Failed to change password', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4 px-3 px-lg-4">
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-3">
        <h2 className="mb-3">Account Settings</h2>
        <p className="text-secondary mb-3">Manage your account security and session.</p>

        {error && <div className="alert alert-danger">{error}</div>}

        <form className="row g-3" onSubmit={handleSubmit}>
          <div className="col-12 col-lg-6">
            <label className="form-label">New password</label>
            <input type="password" className="form-control" value={form.newPassword1} onChange={(e) => setForm((prev) => ({ ...prev, newPassword1: e.target.value }))} required />
          </div>
          <div className="col-12 col-lg-6">
            <label className="form-label">Confirm new password</label>
            <input type="password" className="form-control" value={form.newPassword2} onChange={(e) => setForm((prev) => ({ ...prev, newPassword2: e.target.value }))} required />
          </div>
          <div className="col-12 d-flex gap-2 flex-wrap">
            <button className="btn btn-primary" disabled={loading}>{loading ? 'Updating...' : 'Change password'}</button>
            <Link className="btn btn-outline-secondary" to="/forgot-password">Need password reset?</Link>
          </div>
        </form>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-4">
        <h5 className="mb-3">Session</h5>
        <button className="btn btn-danger" onClick={onLogout}>
          <i className="bi bi-box-arrow-right me-2" />
          Logout
        </button>
      </div>
    </div>
  );
}

export default Settings;
