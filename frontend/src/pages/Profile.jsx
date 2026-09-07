import React, { useState, useEffect } from 'react';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const DEFAULT_INTEREST_SUGGESTIONS = [
  'Artificial Intelligence', 'Machine Learning', 'Computer Vision',
  'Natural Language Processing', 'Robotics & Autonomous Systems',
  'Cybersecurity', 'Cloud Computing', 'Internet of Things (IoT)',
  'Blockchain', 'Bioinformatics', 'Data Mining', 'Software Engineering'
];

const Profile = () => {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Profile Form
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [studentId, setStudentId] = useState('');
  const [bio, setBio] = useState('');
  const [officeLocation, setOfficeLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [researchInterests, setResearchInterests] = useState([]);
  const [interestInput, setInterestInput] = useState('');

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await authAPI.me();
      const u = res.data.data;
      if (u) {
        setName(u.name || '');
        setDepartment(u.department || 'Computer Science & Engineering');
        setStudentId(u.studentId || '');
        setBio(u.bio || '');
        setOfficeLocation(u.officeLocation || '');
        setPhone(u.phone || '');
        setResearchInterests(u.researchInterests || []);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
    setLoading(false);
  };

  const handleAddInterest = (tag) => {
    const trimmed = (tag || interestInput).trim();
    if (trimmed && !researchInterests.includes(trimmed)) {
      setResearchInterests([...researchInterests, trimmed]);
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (tag) => {
    setResearchInterests(researchInterests.filter(t => t !== tag));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ type: '', text: '' });
    try {
      const res = await authAPI.updateProfile({
        name,
        department,
        studentId: user?.role === 'student' ? studentId : undefined,
        bio,
        officeLocation,
        phone,
        researchInterests
      });

      // Update local storage user object
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        const merged = { ...parsed, ...res.data.data };
        localStorage.setItem('user', JSON.stringify(merged));
      }

      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Error updating profile' });
    }
    setSavingProfile(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    setSavingPassword(true);
    setPasswordMsg({ type: '', text: '' });
    try {
      await authAPI.updatePassword({ currentPassword, newPassword });
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Error changing password' });
    }
    setSavingPassword(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-28">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const roleLabel = {
    student: 'Student Researcher',
    supervisor: 'Faculty / Thesis Supervisor',
    admin: 'System Administrator'
  }[user?.role] || user?.role;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="w-10 h-1 bg-blue-600 mb-4" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 flex items-center justify-center text-white text-2xl font-black">
              {name ? name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900">{name}</h1>
                <span className="bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase px-2 py-0.5">
                  {roleLabel}
                </span>
              </div>
              <p className="text-slate-500 text-sm">{user?.email}</p>
              <p className="text-xs text-slate-400 mt-0.5">{department}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Personal & Academic Details</h2>
              <p className="text-xs text-slate-500">Update your profile information and research focus.</p>
            </div>

            {profileMsg.text && (
              <div className={`p-3 text-xs font-semibold border ${
                profileMsg.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full border border-slate-300 px-3.5 py-2 text-sm bg-white focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                    Email (Read Only)
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full border border-slate-200 px-3.5 py-2 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                    Academic Department *
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full border border-slate-300 px-3.5 py-2 text-sm bg-white focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>

                {user?.role === 'student' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                      Student ID
                    </label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={e => setStudentId(e.target.value)}
                      placeholder="e.g. 21101050"
                      className="w-full border border-slate-300 px-3.5 py-2 text-sm bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                      Office / Room
                    </label>
                    <input
                      type="text"
                      value={officeLocation}
                      onChange={e => setOfficeLocation(e.target.value)}
                      placeholder="e.g. UB20401 / Faculty Bay 502"
                      className="w-full border border-slate-300 px-3.5 py-2 text-sm bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+880 1..."
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Academic Bio / Research Summary
                </label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Summarize your academic focus, current projects, or research goals..."
                  rows={3}
                  className="w-full border border-slate-300 px-3.5 py-2 text-sm bg-white focus:outline-none focus:border-blue-600 resize-none"
                />
              </div>

              {/* Research Interests Tags */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Research Interests & Expertise
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={interestInput}
                    onChange={e => setInterestInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddInterest(); } }}
                    placeholder="Add area (e.g. Deep Learning, ROS 2, Cryptography)..."
                    className="flex-1 border border-slate-300 px-3 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddInterest()}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-1.5 transition"
                  >
                    + Add
                  </button>
                </div>

                {/* Selected Tags */}
                {researchInterests.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {researchInterests.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-800 text-xs px-2.5 py-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveInterest(tag)}
                          className="text-blue-500 hover:text-blue-800 font-bold leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No research interest tags added yet.</p>
                )}

                {/* Suggestions */}
                <div className="pt-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Suggestions:</p>
                  <div className="flex flex-wrap gap-1">
                    {DEFAULT_INTEREST_SUGGESTIONS.filter(s => !researchInterests.includes(s)).slice(0, 6).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleAddInterest(s)}
                        className="text-[11px] bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 px-2 py-0.5 transition"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-6 py-2.5 transition shadow-sm disabled:opacity-50"
                >
                  {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Security / Password Card (1 col) */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Account Security</h2>
              <p className="text-xs text-slate-500">Update your account password.</p>
            </div>

            {passwordMsg.text && (
              <div className={`p-3 text-xs font-semibold border ${
                passwordMsg.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Current Password *
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  New Password *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 transition shadow-sm disabled:opacity-50"
                >
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Account Overview Widget */}
          <div className="bg-slate-50 border border-slate-200 p-5 space-y-2 text-xs">
            <p className="font-bold text-slate-700 uppercase tracking-wide">Account Status</p>
            <div className="space-y-1 text-slate-600">
              <p>Role: <strong className="text-slate-900">{roleLabel}</strong></p>
              <p>Account Type: <strong className="text-slate-900">Verified Institutional</strong></p>
              <p>System Access: <span className="text-green-700 font-bold">● Active & Synchronized</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
