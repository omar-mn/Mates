import { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../api';

function ForgotPassword({ showToast }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      const message = 'Reset password request sent. Please check your email.';
      setSuccess(message);
      showToast?.(message, 'success');
    } catch (err) {
      setError(err.message);
      showToast?.(err.message || 'Failed to reset password', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 auth-container">
      <div className="card border-0 shadow-sm rounded-4 p-4">
        <h2 className="mb-3">Forgot Password</h2>
        <p className="text-secondary mb-4">Enter your account email and we will send reset instructions.</p>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="d-grid gap-3">
          <div>
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Sending...' : 'Send reset request'}</button>
        </form>

        <p className="mt-4 mb-0">
          Remembered it? <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
