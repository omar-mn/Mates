import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api';

function Register({ showToast }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');


    if (form.password !== form.confirmPassword) {
      const message = 'Passwords do not match.';
      setError(message);
      showToast?.(message, 'danger');
      return;
    }
    setLoading(true);

    try {
      await registerUser(form);
      const successMessage = 'Account created! You can now login.';
      setSuccess(successMessage);
      showToast?.(successMessage, 'success');
      setTimeout(() => navigate('/login'), 900);
    } catch (err) {
      setError(err.message);
      showToast?.(err.message || 'Register failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 auth-container">
      <div className="card border-0 shadow-sm rounded-4 p-4">
        <h2 className="mb-3">Register</h2>
        <p className="text-secondary mb-4">Create your account.</p>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="d-grid gap-3">
          <div>
            <label className="form-label">Username</label>
            <input className="form-control" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input className="form-control" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Confirm password</label>
            <input className="form-control" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
          </div>

          <button className="btn btn-primary rounded-3" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm" /> : 'Create account'}
          </button>
        </form>

        <p className="mt-4 mb-0">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
