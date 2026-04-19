import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

const API_BASE = `${import.meta.env.VITE_API_URL}/api/admin`;

const STATUS_OPTIONS = ["pending", "reviewed", "resolved", "dismissed"];

const STATUS_COLORS = {
  pending:   "bg-yellow-100 text-yellow-800 border-yellow-200",
  reviewed:  "bg-blue-100 text-blue-800 border-blue-200",
  resolved:  "bg-green-100 text-green-800 border-green-200",
  dismissed: "bg-gray-100 text-gray-600 border-gray-200",
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const { state } = useApp();

  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ pending: 0, reviewed: 0, resolved: 0, dismissed: 0 });
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(null); // reportId being saved

  const [edits, setEdits] = useState({});  // { [reportId]: { status, adminNotes } }

  const token = localStorage.getItem("token");

  // Three states:
  // 1. token exists but currentUser null => auth check still in flight => show spinner
  // 2. currentUser loaded but isAdmin false => confirmed not admin => redirect
  // 3. currentUser loaded and isAdmin true => show panel
  const authPending = !!token && !state.currentUser;

  // Redirect if not admin — only after auth has fully resolved
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (state.currentUser && !state.currentUser.isAdmin) {
      navigate("/dashboard");
    }
  }, [state.currentUser, navigate, token]);

  const fetchReports = async (status) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/reports?status=${status}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setReports(data.reports || []);
    } catch (err) {
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/reports/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.stats) setStats(data.stats);
    } catch (_) {}
  };

  useEffect(() => {
    fetchStats();
    fetchReports(statusFilter);
  }, [statusFilter]);

  const handleSave = async (reportId) => {
    const update = edits[reportId];
    if (!update) return;
    setSaving(reportId);
    try {
      const res = await fetch(`${API_BASE}/reports/${reportId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(update),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      // Update local state
      setReports((prev) =>
        prev.map((r) => (r._id === reportId ? data.report : r))
      );
      setEdits((prev) => {
        const next = { ...prev };
        delete next[reportId];
        return next;
      });
      fetchStats();
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(null);
    }
  };

  const getEdit = (report) =>
    edits[report._id] || { status: report.status, adminNotes: report.adminNotes || "" };

  const setEdit = (id, field, value) =>
    setEdits((prev) => ({
      ...prev,
      [id]: { ...getEdit({ _id: id, status: "", adminNotes: "" }), ...prev[id], [field]: value },
    }));

  if (authPending) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (state.currentUser && !state.currentUser.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 text-center p-6">
        <div className="text-4xl">🔒</div>
        <h2 className="text-xl font-bold text-gray-800">Admin Access Required</h2>
        <p className="text-gray-500 max-w-sm">
          Your account does not have admin privileges. To enable admin access, set{" "}
          <code className="bg-gray-100 px-1 rounded">isAdmin: true</code> on your user document in MongoDB.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-2 text-sm border border-gray-200 rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-50"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!state.currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-500 text-sm mt-1">Manage user reports</p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-4 py-2"
          >
            ← Back to App
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-xl border p-4 text-left transition-all ${
                statusFilter === s
                  ? "ring-2 ring-offset-1 ring-blue-400 " + STATUS_COLORS[s]
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="text-2xl font-bold">{stats[s]}</p>
              <p className="text-xs capitalize text-gray-500 mt-1">{s}</p>
            </button>
          ))}
        </div>

        {/* Reports Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            {error}
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
            No {statusFilter} reports
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const ed = getEdit(report);
              const isDirty =
                ed.status !== report.status ||
                ed.adminNotes !== (report.adminNotes || "");
              return (
                <div
                  key={report._id}
                  className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left — reporter info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-sm mb-2">
                        <span className="font-semibold text-gray-800">
                          {report.reporterId?.name ?? "Unknown"}
                        </span>
                        <span className="text-gray-400">reported</span>
                        <span className="font-semibold text-gray-800">
                          {report.reportedId?.name ?? "Unknown"}
                        </span>
                        <span
                          className={`ml-auto text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[report.status]}`}
                        >
                          {report.status}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3 bg-gray-50 rounded-lg p-3">
                        <span className="font-medium text-gray-700">Reason: </span>
                        {report.reason}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(report.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {/* Right — actions */}
                    <div className="flex-shrink-0 flex flex-col gap-2 min-w-[200px]">
                      <select
                        id={`status-${report._id}`}
                        value={ed.status}
                        onChange={(e) => setEdit(report._id, "status", e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                      <textarea
                        id={`notes-${report._id}`}
                        value={ed.adminNotes}
                        onChange={(e) => setEdit(report._id, "adminNotes", e.target.value)}
                        placeholder="Admin notes..."
                        rows={2}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                      <button
                        id={`save-${report._id}`}
                        onClick={() => handleSave(report._id)}
                        disabled={!isDirty || saving === report._id}
                        className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg px-4 py-2 transition-colors font-medium"
                      >
                        {saving === report._id ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
