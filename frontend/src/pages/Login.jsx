import { useState } from 'react';
import { Link } from 'react-router-dom';
import { loginUser } from '../api';

function Login({ onLoginSuccess, showToast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginUser(email, password);
      showToast?.('Login successful. Welcome back!', 'success');
      onLoginSuccess();
    } catch (err) {
      setError(err.message);
      showToast?.(err.message || 'Login failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 auth-container">
      <div className="card border-0 shadow-sm rounded-4 p-4">
        <h2 className="mb-3">Login</h2>
        <p className="text-secondary mb-4">Sign in to continue.</p>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="d-grid gap-3">
          <div>
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input className="form-control" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <button className="btn btn-primary rounded-3" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm" /> : 'Login'}
          </button>
        </form>

        <div className="mt-4 d-flex justify-content-between flex-wrap gap-2">
          <p className="mb-0">No account? <Link to="/register">Create one</Link></p>
          <p className="mb-0"><Link to="/forgot-password">Forgot password?</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
