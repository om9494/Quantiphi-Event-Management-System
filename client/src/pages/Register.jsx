import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { registerApi } from '../api/auth.api.js';
import { useAuth } from '../context/AuthContext.jsx';

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    city: '',
    countryCode: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await registerApi(form);
      login(data.token, data.user);
      toast.success(`Welcome, ${data.user.name}!`);
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Create account</h1>
        <p className="text-sm text-gray-500 mb-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Full Name', name: 'name', type: 'text', placeholder: 'Jane Doe', required: true },
            { label: 'Email', name: 'email', type: 'email', placeholder: 'you@example.com', required: true },
            { label: 'Password', name: 'password', type: 'password', placeholder: '8+ characters', required: true, minLength: 8 },
            { label: 'City (optional)', name: 'city', type: 'text', placeholder: 'New York' },
            { label: 'Country Code (optional)', name: 'countryCode', type: 'text', placeholder: 'US', maxLength: 3 },
          ].map(({ label, ...props }) => (
            <div key={props.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                {...props}
                value={form[props.name]}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
