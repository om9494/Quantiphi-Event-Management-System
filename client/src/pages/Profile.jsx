// Profile page — view and edit user profile details.
// Calls PUT /users/profile; the server validates all fields.
// This page is pure presentation — no validation logic lives here.

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getProfileApi, updateProfileApi } from '../api/user.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from '../components/Loader.jsx';

const Profile = () => {
  const { user, login, token } = useAuth();
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [editing, setEditing]   = useState(false);

  const [form, setForm] = useState({
    name:        '',
    city:        '',
    countryCode: '',
    bio:         '',
    avatarUrl:   '',
  });

  // Load profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await getProfileApi();
        const u = data.user;
        setForm({
          name:        u.name        || '',
          city:        u.city        || '',
          countryCode: u.countryCode || '',
          bio:         u.bio         || '',
          avatarUrl:   u.avatarUrl   || '',
        });
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await updateProfileApi(form);
      // Refresh the auth context with updated user data
      login(token, data.user);
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors?.length) {
        errors.forEach((e) => toast.error(e.msg || e.message));
      } else {
        toast.error(err.response?.data?.message || 'Could not save profile');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account details.</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        {form.avatarUrl ? (
          <img
            src={form.avatarUrl}
            alt={form.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-brand-200"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-2xl font-bold select-none">
            {form.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div>
          <p className="font-semibold text-gray-800">{form.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>

      {/* Profile form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              disabled={!editing}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="city">
              City
            </label>
            <input
              id="city"
              name="city"
              type="text"
              value={form.city}
              onChange={handleChange}
              disabled={!editing}
              placeholder="e.g. New York"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Country Code */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="countryCode">
              Country Code
            </label>
            <input
              id="countryCode"
              name="countryCode"
              type="text"
              value={form.countryCode}
              onChange={handleChange}
              disabled={!editing}
              placeholder="e.g. US"
              maxLength={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="bio">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              value={form.bio}
              onChange={handleChange}
              disabled={!editing}
              rows={3}
              placeholder="Tell us a bit about yourself…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-500 resize-none"
            />
          </div>

          {/* Avatar URL */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="avatarUrl">
              Avatar URL
            </label>
            <input
              id="avatarUrl"
              name="avatarUrl"
              type="url"
              value={form.avatarUrl}
              onChange={handleChange}
              disabled={!editing}
              placeholder="https://…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-60 transition"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex-1 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition"
              >
                Edit Profile
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
