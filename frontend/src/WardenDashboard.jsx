import { useEffect, useMemo, useState } from "react";
import "./WardenDashboard.css";

const API_URL = import.meta.env.VITE_API_URL;

const Icon = ({ name, size = 20 }) => {
  const shapes = {
    grid: <><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>,
    request: <><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h6M12 10v6"/></>,
    students: <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 20a6 6 0 0 1 12 0M14 19a5 5 0 0 1 7 0"/></>,
    hostel: <><path d="M4 20V7l8-4 8 4v13"/><path d="M8 20v-6h8v6M8 9h.01M12 9h.01M16 9h.01"/></>,
    history: <><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2M4 6v4h4"/></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8"/><path d="M10 21h4"/></>,
    profile: <><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></>,
    logout: <><path d="M10 4H5v16h5"/><path d="m13 8 4 4-4 4M9 12h8"/></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14.8-4L4 9"/><path d="M4 4v5h5M4 13a8 8 0 0 0 14.8 4L20 15"/><path d="M20 20v-5h-5"/></>,
    arrow: <><path d="M5 12h13M13 7l5 5-5 5"/></>,
    check: <><circle cx="12" cy="12" r="8"/><path d="m8.5 12 2.4 2.4 4.7-5"/></>,
    close: <><circle cx="12" cy="12" r="8"/><path d="m9 9 6 6M15 9l-6 6"/></>,
    clock: <><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></>,
    document: <><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v5h5M9 13h6M9 17h4"/></>,
    gate: <><path d="M5 21V5h14v16M8 9h8M8 13h8M9 21v-4h6v4"/></>,
    chart: <><path d="M5 20V10M12 20V4M19 20v-7"/></>,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      className="ui-icon" aria-hidden="true">
      {shapes[name]}
    </svg>
  );
};

function WardenDashboard() {
  const [outpasses, setOutpasses] = useState([]);
  const [allOutpasses, setAllOutpasses] = useState([]);
  const [gateHistory, setGateHistory] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [hostelName, setHostelName] = useState("Assigned Hostel");
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyDataLoading, setHistoryDataLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedOutpass, setSelectedOutpass] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const token = localStorage.getItem("token");

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const fetchPendingOutpasses = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/outpass/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch pending requests.");
      }

      setOutpasses(data.outpasses || []);

      if (data.hostel) {
        setHostelName(data.hostel);
      }
    } catch (err) {
      setError(err.message || "Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllOutpasses = async () => {
    try {
      setHistoryDataLoading(true);

      const response = await fetch(`${API_URL}/api/outpass/warden-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch outpass history.");
      }

      setAllOutpasses(data.outpasses || []);

      if (data.hostel) {
        setHostelName(data.hostel);
      }
    } catch (err) {
      setError(err.message || "Unable to load outpass history.");
    } finally {
      setHistoryDataLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);

      const response = await fetch(`${API_URL}/api/outpass/warden-students`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch hostel students.");
      }

      setStudents(data.students || []);

      if (data.hostel) {
        setHostelName(data.hostel);
      }
    } catch (err) {
      setError(err.message || "Unable to load hostel students.");
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchGateHistory = async () => {
    try {
      setHistoryLoading(true);

      const response = await fetch(`${API_URL}/api/outpass/gate-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch gate history.");
      }

      setGateHistory(data.gateLogs || []);
    } catch (err) {
      setError(err.message || "Unable to fetch gate history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingOutpasses();
    fetchAllOutpasses();
    fetchGateHistory();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (
      outpasses.length > 0 &&
      (
        !selectedOutpass ||
        !outpasses.some(
          item => item.outpassId === selectedOutpass.outpassId
        )
      )
    ) {
      setSelectedOutpass(outpasses[0]);
    }

    if (outpasses.length === 0) {
      setSelectedOutpass(null);
    }
  }, [outpasses]);

  const refreshDashboard = () => {
    setError("");
    fetchPendingOutpasses();
    fetchAllOutpasses();
    fetchGateHistory();
    fetchStudents();
  };

  const approveOutpass = async outpassId => {
    try {
      setActionLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/outpass/${outpassId}/approve`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to approve outpass.");
      }

      setOutpasses(prev =>
        prev.filter(item => item.outpassId !== outpassId)
      );

      setSelectedOutpass(null);
      await fetchAllOutpasses();
    } catch (err) {
      setError(err.message || "Unable to approve outpass.");
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = outpass => {
    setSelectedOutpass(outpass);
    setRejectionReason("");
    setShowRejectModal(true);
    setError("");
  };

  const closeRejectModal = () => {
    if (actionLoading) {
      return;
    }

    setShowRejectModal(false);
    setRejectionReason("");
  };

  const rejectOutpass = async () => {
    if (!selectedOutpass) {
      return;
    }

    if (!rejectionReason.trim()) {
      setError("Please enter a rejection reason.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/outpass/${selectedOutpass.outpassId}/reject`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            rejectionReason: rejectionReason.trim()
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to reject outpass.");
      }

      const rejectedId = selectedOutpass.outpassId;

      setOutpasses(prev =>
        prev.filter(item => item.outpassId !== rejectedId)
      );

      setShowRejectModal(false);
      setRejectionReason("");
      setSelectedOutpass(null);

      await fetchAllOutpasses();
    } catch (err) {
      setError(err.message || "Unable to reject outpass.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  };

  const formatDate = date => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const formatDateTime = date => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const totalCount = allOutpasses.length;
  const pendingCount = allOutpasses.filter(
    item => item.status === "pending"
  ).length;
  const approvedCount = allOutpasses.filter(
    item => item.status === "approved"
  ).length;
  const rejectedCount = allOutpasses.filter(
    item => item.status === "rejected"
  ).length;

  const filteredStudents = students.filter(student => {
    const query = studentSearch.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [
      student.name,
      student.studentId,
      student.course,
      student.roomNumber
    ].some(value =>
      String(value || "").toLowerCase().includes(query)
    );
  });

  const initials = name =>
    (name || "W").trim().charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="warden-loading">
        <div className="warden-spinner" />
        <p>Loading pending requests...</p>
      </div>
    );
  }

  return (
    <div className="warden-dashboard">
      <aside className="warden-sidebar">
        <div>
          <div className="warden-sidebar-brand">
            <strong>E Outpass</strong>
          </div>

          <nav className="warden-nav">
            <button
              className="warden-nav-link active"
              onClick={() =>
                window.scrollTo({ top: 0, behavior: "smooth" })
              }
            >
              <Icon name="grid" />
              Dashboard
            </button>

            <button
              className="warden-nav-link"
              onClick={() =>
                document
                  .getElementById("pending-request")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <Icon name="request" />
              Review Requests
            </button>

            <button
              className="warden-nav-link"
              onClick={() =>
                document
                  .getElementById("students-directory")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <Icon name="students" />
              Students
            </button>

            <button
              className="warden-nav-link"
              onClick={() =>
                document
                  .getElementById("gate-history")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <Icon name="history" />
              Outpass History
            </button>

            <button className="warden-nav-link">
              <Icon name="profile" />
              Profile
            </button>
          </nav>
        </div>

        <div className="warden-sidebar-bottom">
          <button
            className="warden-nav-link"
            onClick={handleLogout}
          >
            <Icon name="logout" />
            Logout
          </button>
        </div>
      </aside>

      <main className="warden-main">
        <header className="warden-topbar">
          <div className="warden-mobile-brand">
            <strong>E Outpass</strong>
          </div>

          <div className="warden-topbar-actions">
            <button
              className="warden-refresh-button"
              onClick={refreshDashboard}
              title="Refresh dashboard"
            >
              <Icon name="refresh" size={17} />
            </button>

            <div className="warden-profile-chip">
              <span className="warden-avatar">
                {initials(user?.name)}
              </span>
              <span className="warden-role">Warden</span>
              <span className="warden-chevron">⌄</span>
            </div>
          </div>
        </header>

        <div className="warden-content">
          <section className="warden-hero">
            <div>
              <span className="warden-eyebrow">
                WARDEN PORTAL
              </span>
              <h1>Good morning, Warden!</h1>
              <p>
                Review and manage outpass requests for your hostel.
              </p>
            </div>
          </section>

          {error && (
            <div className="warden-alert">
              <span>!</span>
              {error}
            </div>
          )}

          <section className="hostel-card">
            <div className="section-heading">Your Hostel</div>

            <div className="hostel-main">
              <div className="hostel-icon">
                <Icon name="hostel" size={25} />
              </div>

              <div className="hostel-info">
                <h2>{hostelName}</h2>
                <p>
                  Warden-managed hostel
                  <span>•</span>
                  Student outpass administration
                </p>
              </div>
            </div>
          </section>

          <section className="activity-card">
            <div className="section-heading-row">
              <h2>
                Outpass Activity <span>(This Month)</span>
              </h2>
            </div>

            <div className="warden-stats">
              <div className="warden-stat blue">
                <div className="stat-icon">
                  <Icon name="document" />
                </div>
                <div>
                  <strong>
                    {historyDataLoading ? "—" : totalCount}
                  </strong>
                  <span>Total Requests</span>
                </div>
              </div>

              <div className="warden-stat yellow">
                <div className="stat-icon">
                  <Icon name="clock" />
                </div>
                <div>
                  <strong>
                    {historyDataLoading ? "—" : pendingCount}
                  </strong>
                  <span>Pending</span>
                </div>
              </div>

              <div className="warden-stat green">
                <div className="stat-icon">
                  <Icon name="check" />
                </div>
                <div>
                  <strong>
                    {historyDataLoading ? "—" : approvedCount}
                  </strong>
                  <span>Approved</span>
                </div>
              </div>

              <div className="warden-stat red">
                <div className="stat-icon">
                  <Icon name="close" />
                </div>
                <div>
                  <strong>
                    {historyDataLoading ? "—" : rejectedCount}
                  </strong>
                  <span>Rejected</span>
                </div>
              </div>
            </div>
          </section>

          <div className="warden-two-column">
            <section className="decisions-card">
              <div className="section-header compact">
                <div>
                  <span className="warden-eyebrow">ACTIVITY</span>
                  <h2>Recent Decisions</h2>
                  <p>
                    Latest status changes across your hostel.
                  </p>
                </div>
              </div>

              <div className="decision-list">
                {allOutpasses
                  .filter(item => item.status !== "pending")
                  .slice(0, 5)
                  .map(item => (
                    <div
                      className="decision-row"
                      key={item.outpassId}
                    >
                      <div className="mini-avatar">
                        {initials(item.student?.name)}
                      </div>

                      <div className="decision-info">
                        <strong>
                          {item.student?.name || "Unknown Student"}
                        </strong>

                        <span>
                          {item.student?.course || "Student"}
                          <i>•</i>
                          {formatDate(item.dateRequestedFor)}
                        </span>
                      </div>

                      <span
                        className={`decision-badge ${item.status}`}
                      >
                        {item.status === "approved"
                          ? "✓ Approved"
                          : item.status === "rejected"
                          ? "✕ Rejected"
                          : "↩ Completed"}
                      </span>
                    </div>
                  ))}

                {allOutpasses.filter(
                  item => item.status !== "pending"
                ).length === 0 && (
                  <div className="small-empty">
                    No recent decisions yet.
                  </div>
                )}
              </div>
            </section>

            <section className="quick-actions-card">
              <div className="section-heading">
                Quick Access
              </div>

              <button
                onClick={() =>
                  document
                    .getElementById("students-directory")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                <span>
                  <Icon name="students" />
                </span>
                <div>
                  <strong>View All Students</strong>
                  <small>
                    Search and view student details
                  </small>
                </div>
                <Icon name="arrow" size={16} />
              </button>

              <button onClick={refreshDashboard}>
                <span>
                  <Icon name="refresh" />
                </span>
                <div>
                  <strong>Refresh Dashboard</strong>
                  <small>
                    Update the latest records
                  </small>
                </div>
                <Icon name="arrow" size={16} />
              </button>
            </section>
          </div>

          <section
            className="pending-request-section"
            id="pending-request"
          >
            <div className="section-header">
              <div>
                <h2>Pending Request</h2>
                <p>
                  Review and decide on the outpass request.
                </p>
              </div>

              <span className="history-count">
                {outpasses.length}
              </span>
            </div>

            {outpasses.length === 0 ? (
              <div className="empty-card">
                <div className="empty-icon">
                  <Icon name="check" />
                </div>
                <h3>No pending requests</h3>
                <p>You're all caught up for now.</p>
              </div>
            ) : (
              <>
                <div className="pending-request-list">
                  {outpasses.slice(0, 6).map(outpass => (
                    <button
                      type="button"
                      key={outpass.outpassId}
                      className={`pending-request-row ${
                        selectedOutpass?.outpassId ===
                        outpass.outpassId
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        setSelectedOutpass(outpass)
                      }
                    >
                      <div className="mini-avatar">
                        {initials(outpass.student?.name)}
                      </div>

                      <div className="pending-request-student">
                        <strong>
                          {outpass.student?.name ||
                            "Unknown Student"}
                        </strong>
                        <span>
                          {outpass.student?.course || "Student"}
                        </span>
                      </div>

                      <div className="pending-request-purpose">
                        <strong>
                          {outpass.reason || "Outpass Request"}
                        </strong>
                        <span>
                          {outpass.placeOfVisit || "—"}
                        </span>
                      </div>

                      <div className="pending-request-date">
                        <strong>
                          {formatDate(outpass.dateRequestedFor)}
                        </strong>
                        <span>
                          {outpass.timeOfLeaving || "—"}
                        </span>
                      </div>

                      <span className="review-button">
                        Review
                        <Icon name="arrow" size={15} />
                      </span>
                    </button>
                  ))}
                </div>

                {selectedOutpass && (
                  <div className="pending-review-panel">
                    <div className="pending-review-main">
                      <div className="review-profile">
                        <div className="review-avatar">
                          {initials(
                            selectedOutpass.student?.name
                          )}
                        </div>

                        <div>
                          <span>STUDENT</span>
                          <h3>
                            {selectedOutpass.student?.name ||
                              "Unknown Student"}
                          </h3>
                          <p>
                            {selectedOutpass.student?.studentId ||
                              "Student ID unavailable"}
                            <i>•</i>
                            {selectedOutpass.student?.course ||
                              "Course unavailable"}
                          </p>
                        </div>
                      </div>

                      <div className="review-details-grid">
                        <div>
                          <span>PLACE OF VISIT</span>
                          <strong>
                            {selectedOutpass.placeOfVisit || "—"}
                          </strong>
                        </div>

                        <div>
                          <span>REASON</span>
                          <strong>
                            {selectedOutpass.reason || "—"}
                          </strong>
                        </div>

                        <div>
                          <span>DATE</span>
                          <strong>
                            {formatDate(
                              selectedOutpass.dateRequestedFor
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>TIME OF LEAVING</span>
                          <strong>
                            {selectedOutpass.timeOfLeaving || "—"}
                          </strong>
                        </div>

                        <div>
                          <span>EXPECTED RETURN</span>
                          <strong>
                            {selectedOutpass.expectedReturnTime || "—"}
                          </strong>
                        </div>

                        <div>
                          <span>OUTPASS ID</span>
                          <strong>
                            {selectedOutpass.outpassId || "—"}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="review-actions">
                      <button
                        className="reject-action"
                        onClick={() =>
                          openRejectModal(selectedOutpass)
                        }
                        disabled={actionLoading}
                      >
                        <Icon name="close" size={17} />
                        Reject
                      </button>

                      <button
                        className="approve-action"
                        onClick={() =>
                          approveOutpass(
                            selectedOutpass.outpassId
                          )
                        }
                        disabled={actionLoading}
                      >
                        <Icon name="check" size={17} />
                        {actionLoading
                          ? "Processing..."
                          : "Approve"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          <section
            className="history-section"
            id="gate-history"
          >
            <div className="section-header">
              <div>
                <span className="warden-eyebrow">
                  CAMPUS MOVEMENT
                </span>
                <h2>Gate History</h2>
                <p>
                  Student exit and entry records for your hostel.
                </p>
              </div>

              <span className="history-count">
                {gateHistory.length}
              </span>
            </div>

            {historyLoading ? (
              <div className="empty-card">
                <div className="empty-icon">
                  <Icon name="refresh" />
                </div>
                <h3>Loading gate history...</h3>
                <p>Fetching student movement records.</p>
              </div>
            ) : gateHistory.length === 0 ? (
              <div className="empty-card">
                <div className="empty-icon">
                  <Icon name="gate" />
                </div>
                <h3>No gate records yet</h3>
                <p>
                  Student movement records will appear here
                  after gate verification.
                </p>
              </div>
            ) : (
              <div className="gate-list">
                {gateHistory.slice(0, 8).map(log => {
                  const returned = log.status === "returned";

                  return (
                    <article
                      className="gate-row"
                      key={log._id}
                    >
                      <div className="mini-avatar">
                        {initials(log.student?.name)}
                      </div>

                      <div className="gate-student">
                        <strong>
                          {log.student?.name || "Unknown Student"}
                        </strong>
                        <span>
                          {log.student?.studentId || "—"}
                          <i>•</i>
                          {log.outpass?.placeOfVisit || "—"}
                        </span>
                      </div>

                      <div>
                        <span>OUT</span>
                        <strong>
                          {formatDateTime(log.exitTime)}
                        </strong>
                      </div>

                      <div>
                        <span>IN</span>
                        <strong>
                          {formatDateTime(log.entryTime)}
                        </strong>
                      </div>

                      <span
                        className={`gate-status ${
                          returned ? "returned" : "outside"
                        }`}
                      >
                        {returned
                          ? "✓ Returned"
                          : "↗ Outside"}
                      </span>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section
            className="students-directory-section"
            id="students-directory"
          >
            <div className="section-header">
              <div>
                <span className="warden-eyebrow">
                  HOSTEL STUDENTS
                </span>
                <h2>Students</h2>
                <p>
                  Students assigned to {hostelName}.
                </p>
              </div>

              <span className="history-count">
                {studentsLoading ? "—" : students.length}
              </span>
            </div>

            <div className="students-toolbar">
              <div className="student-search-wrap">
                <Icon name="students" size={17} />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={event =>
                    setStudentSearch(event.target.value)
                  }
                  placeholder="Search by name, student ID, course or room"
                />
              </div>

              <button
                className="student-refresh"
                onClick={fetchStudents}
                disabled={studentsLoading}
              >
                <Icon name="refresh" size={16} />
                Refresh
              </button>
            </div>

            {studentsLoading ? (
              <div className="empty-card">
                <div className="empty-icon">
                  <Icon name="refresh" />
                </div>
                <h3>Loading students...</h3>
                <p>
                  Fetching students from your assigned hostel.
                </p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="empty-card">
                <div className="empty-icon">
                  <Icon name="students" />
                </div>
                <h3>
                  {students.length === 0
                    ? "No students found"
                    : "No matching students"}
                </h3>
                <p>
                  {students.length === 0
                    ? "No students are currently assigned to this hostel."
                    : "Try a different search."}
                </p>
              </div>
            ) : (
              <div className="student-directory-list">
                {filteredStudents.map(student => (
                  <article
                    className="student-directory-row"
                    key={student.studentId}
                  >
                    <div className="mini-avatar">
                      {initials(student.name)}
                    </div>

                    <div className="directory-student">
                      <strong>{student.name}</strong>
                      <span>{student.studentId}</span>
                    </div>

                    <div className="directory-detail">
                      <span>Course</span>
                      <strong>
                        {student.course || "—"}
                      </strong>
                    </div>

                    <div className="directory-detail">
                      <span>Room</span>
                      <strong>
                        {student.roomNumber || "—"}
                      </strong>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <nav className="warden-mobile-nav">
        <button
          className="active"
          onClick={() =>
            window.scrollTo({ top: 0, behavior: "smooth" })
          }
        >
          <Icon name="grid" />
          <span>Home</span>
        </button>

        <button
          onClick={() =>
            document
              .getElementById("pending-request")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          <Icon name="request" />
          <span>Requests</span>
        </button>

        <button
          onClick={() =>
            document
              .getElementById("students-directory")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          <Icon name="students" />
          <span>Students</span>
        </button>

        <button>
          <Icon name="profile" />
          <span>Profile</span>
        </button>

        <button
          className="warden-mobile-logout"
          onClick={handleLogout}
        >
          <Icon name="logout" />
          <span>Logout</span>
        </button>
      </nav>

      {showRejectModal && (
        <div
          className="reject-modal-overlay"
          onClick={closeRejectModal}
        >
          <div
            className="reject-modal"
            onClick={event => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span>REJECT OUTPASS</span>
                <h2>Reject Request</h2>
              </div>

              <button
                className="close-modal"
                onClick={closeRejectModal}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <p className="modal-description">
              Please provide a reason for rejecting this
              outpass request.
            </p>

            <label className="modal-label">
              Rejection Reason
            </label>

            <textarea
              value={rejectionReason}
              onChange={event =>
                setRejectionReason(event.target.value)
              }
              placeholder="Enter the reason..."
            />

            <div className="modal-actions">
              <button
                className="cancel-reject"
                onClick={closeRejectModal}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                className="confirm-reject"
                onClick={rejectOutpass}
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Rejecting..."
                  : "Reject Outpass"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WardenDashboard;
