import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Select from 'react-select';

// --- Configuration ---
const API_BASE_URL = 'http://localhost:5000/api';

// --- SVG Icons ---
const StudentIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const AdminIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6M9 19a2 2 0 00-2 2h10a2 2 0 00-2-2M9 19c-1.105 0-2-.895-2-2V9c0-1.105.895-2 2-2h.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a2 2 0 012 2v4a2 2 0 01-2 2h-3m-6 0V9" />
  </svg>
);
const OfferIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const ProfileIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4z" />
  </svg>
);
const ApplicationsIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
  </svg>
);
// *** NEW ICON FOR BUG 2 FIX ***
const ManageAppsIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
  </svg>
);
// --- End of Icon Definitions ---


// --- Main App Component: Manages Login State & Routing ---
function App() {
  const [user, setUser] = useState(null);
  const [route, setRoute] = useState(window.location.hash || '#/');

  useEffect(() => {
    const loggedInUser = sessionStorage.getItem('user');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '#/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    sessionStorage.setItem('user', JSON.stringify(loggedInUser));
    window.location.hash = '#/dashboard';
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
    window.location.hash = '#/';
  };

  if (user) {
    return (
      <Dashboard user={user} onLogout={handleLogout} key={user.id} />
    );
  }

  // If not logged in, show the correct Login/Register page
  let PageComponent;
  switch (route) {
    case '#/admin':
      PageComponent = <AdminLoginView onLogin={handleLogin} />;
      break;
    case '#/register':
      PageComponent = <RegisterView />;
      break;
    case '#/':
    case '#/login':
    default:
      PageComponent = <StudentLoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginHeader />
        {PageComponent}
      </div>
    </div>
  );
}

// --- Login / Register Components ---

function StudentLoginView({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/login/student`, { email, password });
      if (res.data.success) {
        onLogin(res.data.user);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed.';
      setMessage({ text: errorMsg, isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-white rounded-b-lg shadow-lg p-8">
      <h2 className="text-3xl font-semibold text-gray-700 mb-6 text-center">Student Login</h2>
      {message && <MessageBox message={message.text} isError={message.isError} />}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm" required
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm" required
          />
        </div>
        <button
          type="submit" disabled={loading}
          className="w-full flex justify-center items-center bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <div className="text-center text-gray-600 text-sm mt-6 flex justify-between">
        <a href="#/admin" className="text-gray-600 hover:underline font-medium">
          Admin Login
        </a>
        <a href="#/register" className="text-blue-600 hover:underline font-medium">
          Register as Student
        </a>
      </div>
    </main>
  );
}

function AdminLoginView({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/login/admin`, { email, password });
      if (res.data.success) {
        onLogin(res.data.user);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed.';
      setMessage({ text: errorMsg, isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-white rounded-b-lg shadow-lg p-8">
      <h2 className="text-3xl font-semibold text-gray-700 mb-6 text-center">Admin Login</h2>
      {message && <MessageBox message={message.text} isError={message.isError} />}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm" required
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm" required
          />
        </div>
        <button
          type="submit" disabled={loading}
          className="w-full flex justify-center items-center bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="text-center text-gray-600 text-sm mt-6">
        <a href="#/" className="text-blue-600 hover:underline font-medium">
          &larr; Back to Student Login
        </a>
      </p>
    </main>
  );
}

function RegisterView() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', branch_code: '', batch_year: 2025, cgpa: '', active_backlogs: 0, password: ''
  });
  const [branches, setBranches] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchBranches = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/branches`);
      setBranches(res.data);
    } catch (err) { console.error("Failed to load branches", err); }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/register`, formData);
      if (res.data.success) {
        setMessage({ text: res.data.message, isError: false });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registration failed.';
      setMessage({ text: errorMsg, isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-white rounded-b-lg shadow-lg p-8">
      <h2 className="text-3xl font-semibold text-gray-700 mb-6 text-center">Student Registration</h2>
      {message && <MessageBox message={message.text} isError={message.isError} />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" name="name" onChange={handleChange} placeholder="Full Name" required className="w-full p-3 border border-gray-300 rounded-lg shadow-sm" />
        <input type="email" name="email" onChange={handleChange} placeholder="Email Address" required className="w-full p-3 border border-gray-300 rounded-lg shadow-sm" />
        <input type="password" name="password" onChange={handleChange} placeholder="Password" required className="w-full p-3 border border-gray-300 rounded-lg shadow-sm" />
        <div className="grid grid-cols-2 gap-4">
          <input type="tel" name="phone" onChange={handleChange} placeholder="Phone (Optional)" className="w-full p-3 border border-gray-300 rounded-lg shadow-sm" />
          <select name="branch_code" onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-lg shadow-sm bg-white">
            <option value="">Select Branch</option>
            {branches.map(b => (
              <option key={b.branch_code} value={b.branch_code}>{b.branch_name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <input type="number" name="batch_year" onChange={handleChange} placeholder="Batch Year" required className="w-full p-3 border border-gray-300 rounded-lg shadow-sm" value={formData.batch_year} />
          <input type="number" step="0.01" min="0" max="10" name="cgpa" onChange={handleChange} placeholder="CGPA" required className="w-full p-3 border border-gray-300 rounded-lg shadow-sm" />
          <input type="number" min="0" name="active_backlogs" onChange={handleChange} placeholder="Backlogs" required className="w-full p-3 border border-gray-300 rounded-lg shadow-sm" value={formData.active_backlogs} />
        </div>
        <button
          type="submit" disabled={loading}
          className="w-full flex justify-center items-center bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p className="text-center text-gray-600 text-sm mt-6">
        Already have an account?{' '}
        <a href="#/" className="text-blue-600 hover:underline font-medium">
          Login here
        </a>
      </p>
    </main>
  );
}


// --- Main App Dashboard (Shown after login) ---
function Dashboard({ user, onLogout }) {
  const [view, setView] = useState(user.role === 'admin' ? 'approve' : 'student');
  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto max-w-7xl p-4 md:p-8">
        <DashboardHeader user={user} onLogout={onLogout} />
        <nav className="flex flex-wrap bg-blue-700 rounded-b-lg shadow-md overflow-hidden mb-8">
          {isAdmin ? (
            <>
              {/* Admin Tabs */}
              <NavButton viewName="approve" title="Approve Students" icon={<AdminIcon />} activeView={view} onViewChange={setView} />
              {/* *** BUG 2 FIX: NEW TAB *** */}
              <NavButton viewName="manage_apps" title="Manage Applications" icon={<ManageAppsIcon />} activeView={view} onViewChange={setView} />
              <NavButton viewName="admin" title="Admin Analytics" icon={<ProfileIcon />} activeView={view} onViewChange={setView} />
              <NavButton viewName="offers" title="Finalize Offers" icon={<OfferIcon />} activeView={view} onViewChange={setView} />
            </>
          ) : (
            <>
              {/* Student Tabs */}
              <NavButton viewName="student" title="Available Jobs" icon={<StudentIcon />} activeView={view} onViewChange={setView} />
              <NavButton viewName="profile" title="My Profile" icon={<ProfileIcon />} activeView={view} onViewChange={setView} />
              <NavButton viewName="applications" title="My Applications" icon={<ApplicationsIcon />} activeView={view} onViewChange={setView} />
            </>
          )}
        </nav>
        <main className="bg-white rounded-lg shadow-lg min-h-[400px]">
          {/* Show the correct view based on state and role */}
          {isAdmin ? (
            <>
              {view === 'approve' && <ApproveStudentView />}
              {/* *** BUG 2 FIX: NEW COMPONENT *** */}
              {view === 'manage_apps' && <ManageApplicationsView />}
              {view === 'admin' && <AdminView />}
              {view === 'offers' && <FinalizeOfferView />}
            </>
          ) : (
            <>
              {view === 'student' && <StudentJobView user={user} />}
              {view === 'profile' && <ProfileView user={user} />}
              {view === 'applications' && <StudentApplicationsView user={user} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function DashboardHeader({ user, onLogout }) {
  return (
    <header className="mb-0 p-8 bg-blue-700 rounded-t-lg shadow-md flex justify-between items-center">
      <div>
        <h1 className="text-4xl font-bold text-white tracking-tight">College Placement Management</h1>
        <p className="text-lg text-blue-200 mt-1">Welcome, {user.name} ({user.role})</p>
      </div>
      <button
        onClick={onLogout}
        className="bg-red-500 text-white font-medium py-2 px-4 rounded-lg shadow hover:bg-red-600 transition duration-200"
      >
        Logout
      </button>
    </header>
  );
}

function NavButton({ viewName, title, icon, activeView, onViewChange }) {
  const isActive = activeView === viewName;
  const classes = isActive
    ? 'bg-white text-blue-700 shadow-inner'
    : 'bg-transparent text-blue-200 hover:bg-blue-600 hover:text-white';
  return (
    <button
      onClick={() => onViewChange(viewName)}
      className={`flex items-center justify-center px-4 py-4 font-medium transition duration-200 ease-in-out ${classes}`}
    >
      {icon}
      {title}
    </button>
  );
}

// --- Dashboard Student Views ---

function StudentJobView({ user }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/jobs/eligible/${user.id}`);
      setJobs(res.data.map(job => ({ ...job, isApplying: false })));
    } catch (err) {
      console.error(err);
      setError('Failed to load eligible jobs.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleApply = async (job_id) => {
    setMessage(null);
    setJobs(prevJobs => prevJobs.map(job => 
      job.job_id === job_id ? { ...job, isApplying: true } : job
    ));

    try {
      const res = await axios.post(`${API_BASE_URL}/applications/apply`, {
        student_id: user.id,
        job_id: job_id
      });
      setMessage({ text: res.data.message, isError: false });
      setJobs(prevJobs => prevJobs.filter(job => job.job_id !== job_id));
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Application failed.';
      setMessage({ text: errorMsg, isError: true });
      setJobs(prevJobs => prevJobs.map(job => 
        job.job_id === job_id ? { ...job, isApplying: false } : job
      ));
    }
  };
  
  return (
    <section className="p-6 md:p-10">
      <h2 className="text-3xl font-semibold text-gray-700 mb-6">Available Jobs for You</h2>
      {message && <MessageBox message={message.text} isError={message.isError} />}
      {error && <MessageBox message={error} isError={true} />}
      {loading && <Loader />}
      {!loading && jobs.length === 0 && (
        <div className="text-center p-10 bg-gray-50 rounded-lg">
          <h4 className="mt-2 text-lg font-medium text-gray-900">No New Jobs Found</h4>
          <p className="mt-1 text-sm text-gray-500">You have applied to all eligible jobs, or no jobs match your profile.</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map(job => (
          <div key={job.job_id} className="border rounded-lg p-6 bg-white shadow-lg transition-all duration-300 hover:shadow-xl flex flex-col justify-between">
            <div>
              <h4 className="text-xl font-semibold text-blue-700">{job.title}</h4>
              <p className="text-gray-800 font-medium text-lg">{job.company_name}</p>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-gray-700 text-lg font-semibold">{job.ctc_lpa} LPA</p>
                <p className="text-gray-500 text-sm">Min CGPA: {job.min_cgpa}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Required Skills</h5>
              {job.required_skills ? (
                <div className="flex flex-wrap gap-2">
                  {job.required_skills.split(', ').map(skill => (
                    <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-gray-500 italic">No specific skills required.</span>
              )}
            </div>
            <button
              onClick={() => handleApply(job.job_id)}
              disabled={job.isApplying}
              className="w-full mt-6 bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-green-700 transition duration-200 disabled:bg-gray-400"
            >
              {job.isApplying ? 'Applying...' : 'Apply Now'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function StudentApplicationsView({ user }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPLIED': return 'bg-blue-100 text-blue-800';
      case 'SHORTLISTED': return 'bg-yellow-100 text-yellow-800';
      case 'INTERVIEWED': return 'bg-purple-100 text-purple-800';
      case 'OFFERED': return 'bg-green-100 text-green-800';
      case 'ACCEPTED': return 'bg-green-600 text-white';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/applications/student/${user.id}`);
      setApplications(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load your applications.');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return (
    <section className="p-6 md:p-10">
      <h2 className="text-3xl font-semibold text-gray-700 mb-6">My Applications</h2>
      {error && <MessageBox message={error} isError={true} />}
      {loading && <Loader />}
      {!loading && (
        <div className="overflow-x-auto rounded-lg shadow border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied At</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.length === 0 ? (
                <tr><td colSpan="4" className="p-6 text-center text-gray-500">You have not applied to any jobs yet.</td></tr>
              ) : (
                applications.map(app => (
                  <tr key={app.application_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{app.company_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{app.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(app.applied_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}


function ProfileView({ user }) {
  const [allSkills, setAllSkills] = useState([]);
  const [mySkills, setMySkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchAllSkills = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/skills`);
      setAllSkills(res.data.map(skill => ({ value: skill.skill_id, label: skill.skill_name })));
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to load list of all skills.', isError: true });
    }
  }, []);

  useEffect(() => {
    fetchAllSkills();
  }, [fetchAllSkills]);

  const fetchStudentSkills = useCallback(async () => {
    setLoadingSkills(true);
    setMessage(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/students/${user.id}/skills`);
      setMySkills(res.data.map(skill => ({ value: skill.skill_id, label: skill.skill_name })));
    } catch (err) {
      console.error(err);
      setMessage({ text: "Failed to load this student's skills.", isError: true });
    } finally {
      setLoadingSkills(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchStudentSkills();
  }, [fetchStudentSkills]);

  const handleSkillChange = (selectedOptions) => {
    setMySkills(selectedOptions || []);
  };

  const handleSaveSkills = async () => {
    setLoadingSkills(true);
    setMessage(null);
    try {
      const skillIds = mySkills.map(skill => skill.value);
      const res = await axios.put(`${API_BASE_URL}/students/${user.id}/skills`, { skills: skillIds });
      setMessage({ text: res.data.message, isError: false });
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to save skills.';
      setMessage({ text: errorMsg, isError: true });
    } finally {
      setLoadingSkills(false);
    }
  };

  return (
    <section className="p-6 md:p-10">
      <h2 className="text-3xl font-semibold text-gray-700 mb-6">My Profile & Skills</h2>
      {message && <MessageBox message={message.text} isError={message.isError} />}
      <div className="max-w-xl p-8 border rounded-lg bg-gray-50 shadow-sm">
        <h3 className="text-2xl font-semibold text-gray-700 mb-4">Manage My Skills</h3>
        <p className="text-sm text-gray-600 mb-6">Select the skills you possess. This will be used to match you with eligible jobs.</p>
        {loadingSkills && <Loader />}
        {!loadingSkills && (
          <>
            <Select
              isMulti name="skills" options={allSkills} value={mySkills}
              onChange={handleSkillChange} className="basic-multi-select" classNamePrefix="select"
              styles={{
                control: (base) => ({ ...base, borderColor: 'rgb(209, 213, 219)', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', '&:hover': { borderColor: 'rgb(59, 130, 246)' } }),
                multiValue: (base) => ({ ...base, backgroundColor: 'rgb(219, 234, 254)' }),
                multiValueLabel: (base) => ({ ...base, color: 'rgb(30, 64, 175)' }),
              }}
            />
            <button
              onClick={handleSaveSkills} disabled={loadingSkills}
              className="w-full mt-6 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow hover:bg-blue-700 disabled:bg-gray-400"
            >
              Save Skills
            </button>
          </>
        )}
      </div>
    </section>
  );
}

// --- Dashboard Admin Views ---
function AdminView() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/stats`);
      setStats(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load placement statistics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <section className="p-6 md:p-10">
      <h2 className="text-3xl font-semibold text-gray-700 mb-6">Admin Analytics</h2>
      {error && <MessageBox message={error} isError={true} />}
      {loading && <Loader />}
      {!loading && (
        <div className="overflow-x-auto rounded-lg shadow border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch Name</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Students</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placed Students</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placement Rate</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Highest Package (LPA)</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Package (LPA)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.map(stat => {
                const total = parseInt(stat.total_students);
                const placed = parseInt(stat.placed_students);
                const rate = total > 0 ? ((placed / total) * 100).toFixed(1) + '%' : 'N/A';
                return (
                  <tr key={stat.branch_name} className="hover:bg-gray-50 transition duration-150">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{stat.branch_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{total}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{placed}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{rate}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{stat.highest_package}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{stat.average_package}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ApproveStudentView() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/pending-students`);
      setPending(res.data);
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to load pending students.', isError: true });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleApprove = async (id) => {
    setMessage(null);
    try {
      await axios.put(`${API_BASE_URL}/admin/approve-student/${id}`);
      setMessage({ text: 'Student approved.', isError: false });
      fetchPending(); // Refresh the list
    } catch (err) {
      setMessage({ text: 'Failed to approve student.', isError: true });
    }
  };

  return (
    <section className="p-6 md:p-10">
      <h2 className="text-3xl font-semibold text-gray-700 mb-6">Approve New Students</h2>
      {message && <MessageBox message={message.text} isError={message.isError} />}
      {loading && <Loader />}
      {!loading && (
        <div className="overflow-x-auto rounded-lg shadow border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CGPA</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pending.length === 0 ? (
                <tr><td colSpan="5" className="p-6 text-center text-gray-500">No pending student registrations.</td></tr>
              ) : (
                pending.map(student => (
                  <tr key={student.student_id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.cgpa}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.branch_code}</td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleApprove(student.student_id)}
                        className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-green-600"
                      >
                        Approve
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}


// *** BUG 2 FIX: NEW COMPONENT ***
// This component allows the admin to change application statuses
function ManageApplicationsView() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const possibleStatus = ['APPLIED', 'SHORTLISTED', 'INTERVIEWED', 'OFFERED', 'REJECTED'];
  const getStatusColor = (status) => {
    switch (status) {
      case 'APPLIED': return 'bg-blue-100 text-blue-800';
      case 'SHORTLISTED': return 'bg-yellow-100 text-yellow-800';
      case 'INTERVIEWED': return 'bg-purple-100 text-purple-800';
      case 'OFFERED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const fetchAllApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/applications/all`);
      setApplications(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllApplications();
  }, [fetchAllApplications]);

  const handleStatusChange = async (application_id, new_status) => {
    setMessage(null);
    try {
      await axios.put(`${API_BASE_URL}/applications/update-status`, {
        application_id,
        status: new_status
      });
      // Update the status in the local state for a responsive UI
      setApplications(prevApps => 
        prevApps.map(app => 
          app.application_id === application_id ? { ...app, status: new_status } : app
        )
      );
      setMessage({ text: 'Status updated.', isError: false });
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to update status.', isError: true });
    }
  };

  return (
    <section className="p-6 md:p-10">
      <h2 className="text-3xl font-semibold text-gray-700 mb-6">Manage All Applications</h2>
      {message && <MessageBox message={message.text} isError={message.isError} />}
      {error && <MessageBox message={error} isError={true} />}
      {loading && <Loader />}
      {!loading && (
        <div className="overflow-x-auto rounded-lg shadow border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company & Job</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.length === 0 ? (
                <tr><td colSpan="4" className="p-6 text-center text-gray-500">No applications found.</td></tr>
              ) : (
                applications.map(app => (
                  <tr key={app.application_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{app.student_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{app.title}</div>
                      <div className="text-xs text-gray-500">{app.company_name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.application_id, e.target.value)}
                        className="p-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm"
                      >
                        {possibleStatus.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}


function FinalizeOfferView() {
  const [offeredApps, setOfferedApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchOfferedApps = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/applications/pending`);
      setOfferedApps(res.data.map(app => ({
        value: app.application_id,
        label: `${app.student_name} - ${app.title} at ${app.company_name}`
      })));
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to load offered applications.', isError: true });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOfferedApps();
  }, [fetchOfferedApps]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) {
      setMessage({ text: 'Please select an offer to finalize.', isError: true });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/applications/accept_offer`, {
        application_id: selectedApp
      });
      setMessage({ text: `Success: ${res.data.message}`, isError: false });
      setSelectedApp('');
      fetchOfferedApps(); // Refresh the list
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Transaction failed.';
      setMessage({ text: `Transaction Failed: ${errorMsg}. Database was rolled back.`, isError: true });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="p-6 md:p-10">
      <h2 className="text-3xl font-semibold text-gray-700 mb-6">Finalize Student Offers</h2>
      {message && <MessageBox message={message.text} isError={message.isError} />}
      <form onSubmit={handleSubmit} className="max-w-lg p-8 border rounded-lg bg-gray-50 shadow-sm">
        <p className="mb-6 text-sm text-gray-600">
          Select a student's official offer from the list to finalize their placement. This will mark their application as 'ACCEPTED'
          and (via a database trigger) automatically reject all their other open applications.
        </p>
        <div className="mb-6">
          <label htmlFor="offer-select" className="block text-sm font-medium text-gray-700 mb-2">Select Offer to Finalize:</label>
          <Select
            id="offer-select"
            options={offeredApps}
            isLoading={loading && !message}
            onChange={(option) => setSelectedApp(option.value)}
            value={offeredApps.find(app => app.value === selectedApp)}
            placeholder="Select a student's offered job..."
            className="basic-single"
            classNamePrefix="select"
            styles={{
              control: (base) => ({ ...base, borderColor: 'rgb(209, 213, 219)', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', '&:hover': { borderColor: 'rgb(59, 130, 246)' } })
            }}
          />
        </div>
        <button
          type="submit" disabled={loading}
          className="w-full flex justify-center items-center bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : 'Accept Offer & Finalize'}
        </button>
      </form>
    </section>
  );
}

// --- Helper Components ---
function Loader() {
  return (
    <div className="flex justify-center items-center p-12">
      <div className="loader border-4 border-gray-200 border-t-4 border-t-blue-500 rounded-full w-12 h-12 animate-spin"></div>
    </div>
  );
}

function MessageBox({ message, isError }) {
  const icon = isError ? (
    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );

  const classes = isError
    ? 'bg-red-50 border-l-4 border-red-400 text-red-700'
    : 'bg-green-50 border-l-4 border-green-400 text-green-700';
  if (!message) return null;
  
  return (
    <div className={`p-4 mb-6 rounded-md shadow-sm ${classes}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
}

const LoginHeader = () => (
    <header className="mb-0 p-8 bg-blue-700 rounded-t-lg shadow-md flex justify-between items-center">
      <h1 className="text-4xl font-bold text-white tracking-tight">College Placement Management</h1>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white bg-opacity-20">
        <svg className="h-6 w-6 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      </div>
    </header>
);

App.defaultProps = {
  Header: LoginHeader
};

export default App;