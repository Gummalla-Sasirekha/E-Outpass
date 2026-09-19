import { useEffect, useState } from "react";
import "./ParentDashboard.css";

function ParentDashboard() {
  const [showForm, setShowForm] = useState(false);

  const [placeOfVisit, setPlaceOfVisit] = useState("");
  const [reason, setReason] = useState("");
  const [dateRequestedFor, setDateRequestedFor] = useState("");
  const [timeOfLeaving, setTimeOfLeaving] = useState("");
  const [expectedInTime, setExpectedInTime] = useState("");

  const [outpasses, setOutpasses] = useState([]);

  // Linked student
  const [student, setStudent] = useState(null);
  const [studentLoading, setStudentLoading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ==========================================
  // BACKEND URL
  // ==========================================

  const API_URL = import.meta.env.VITE_API_URL;

  // ==========================================
  // FETCH LINKED STUDENT
  // ==========================================

  const fetchStudent = async () => {
    try {
      setStudentLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/outpass/my-student`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch linked student"
        );
      }

      setStudent(data.student);
    } catch (error) {
      console.error("Fetch student error:", error);
      setError(error.message);
      setStudent(null);
    } finally {
      setStudentLoading(false);
    }
  };

  // ==========================================
  // FETCH MY OUTPASSES
  // ==========================================

  const fetchOutpasses = async () => {
    try {
      setFetching(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/outpass/my`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch outpasses"
        );
      }

      setOutpasses(data.outpasses || []);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setFetching(false);
    }
  };

  // ==========================================
  // LOAD DASHBOARD DATA
  // ==========================================

  useEffect(() => {
    fetchStudent();
    fetchOutpasses();
  }, []);

  // ==========================================
  // SUBMIT OUTPASS
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!student) {
      setError(
        "No student is linked to this parent account."
      );
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/outpass/request`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            studentId: student.studentId,
            placeOfVisit,
            reason,
            dateRequestedFor,
            timeOfLeaving,
            expectedInTime,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to submit request"
        );
      }

      setMessage(
        `Outpass request submitted successfully! ID: ${data.outpass?.outpassId}`
      );

      // Clear form
      setPlaceOfVisit("");
      setReason("");
      setDateRequestedFor("");
      setTimeOfLeaving("");
      setExpectedInTime("");

      setShowForm(false);

      // Refresh request history
      fetchOutpasses();
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.reload();
  };

  // ==========================================
  // STATUS CLASS
  // ==========================================

  const getStatusClass = (status) => {
    return `status-badge status-${status}`;
  };

  // ==========================================
  // REFRESH
  // ==========================================

  const handleRefresh = () => {
    setError("");
    fetchStudent();
    fetchOutpasses();
  };

  // ==========================================
  // DASHBOARD STATISTICS
  // ==========================================

  const totalRequests = outpasses.length;

  const pendingRequests = outpasses.filter(
    (outpass) => outpass.status === "pending"
  ).length;

  const approvedRequests = outpasses.filter(
    (outpass) => outpass.status === "approved"
  ).length;

  const rejectedRequests = outpasses.filter(
    (outpass) => outpass.status === "rejected"
  ).length;

  // ==========================================
  // RECENT REQUESTS
  // ==========================================

  const recentOutpasses = outpasses.slice(0, 3);

  return (
    <div className="parent-page">

      {/* ======================================
          HEADER
      ====================================== */}

      <header className="parent-header">

        <div className="brand-area">

          <div className="brand-mark">
            E
          </div>

          <div className="brand-text">
            <h1>E-Outpass</h1>
            <p>Parent Portal</p>
          </div>

        </div>

        <div className="header-actions">

          <button
            className="header-icon-button"
            aria-label="Notifications"
          >
            🔔
          </button>

          <button
            className="parent-logout"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </header>


      {/* ======================================
          MAIN
      ====================================== */}

      <main className="parent-content">


        {/* ====================================
            WELCOME
        ==================================== */}

        <section className="parent-welcome">

          <div className="welcome-content">

            <span className="welcome-label">
              PARENT PORTAL
            </span>

            <h2>
              Good morning 👋
            </h2>

            <p>
              Manage your child's outpass requests
              with ease.
            </p>

          </div>

          <div className="welcome-accent">
            ✦
          </div>

        </section>


        {/* ====================================
            SUCCESS / ERROR
        ==================================== */}

        {message && (
          <div className="success-box">
            <span className="message-icon">✓</span>
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="parent-error-box">
            <span className="message-icon">!</span>
            <span>{error}</span>
          </div>
        )}


        {/* ====================================
            LINKED STUDENT
        ==================================== */}

        <section className="student-card">

          <div className="student-avatar">
            {student?.name
              ? student.name.charAt(0).toUpperCase()
              : "S"}
          </div>

          <div className="student-details">

            <span className="card-eyebrow">
              YOUR CHILD
            </span>

            {studentLoading ? (

              <>
                <h2>Loading student...</h2>
                <p>Please wait...</p>
              </>

            ) : student ? (

              <>
                <h2>
                  {student.name}
                </h2>

                <p>
                  {student.course}
                  {" • "}
                  Room {student.roomNumber}
                  {" • "}
                  {student.hostel?.name || "Hostel"}
                </p>
              </>

            ) : (

              <>
                <h2>
                  No Student Linked
                </h2>

                <p>
                  Please contact the administrator.
                </p>
              </>

            )}

          </div>

          <div className="student-arrow">
            →
          </div>

        </section>


        {/* ====================================
            STATISTICS
        ==================================== */}

        <section className="stats-section">

          <div className="section-heading">

            <div>
              <span className="section-eyebrow">
                OVERVIEW
              </span>

              <h2>
                Outpass activity
              </h2>
            </div>

          </div>


          <div className="stats-grid">

            <div className="stat-card">

              <div className="stat-icon stat-total">
                ↗
              </div>

              <div className="stat-content">
                <strong>{totalRequests}</strong>
                <span>Total</span>
              </div>

            </div>


            <div className="stat-card">

              <div className="stat-icon stat-pending">
                ◷
              </div>

              <div className="stat-content">
                <strong>{pendingRequests}</strong>
                <span>Pending</span>
              </div>

            </div>


            <div className="stat-card">

              <div className="stat-icon stat-approved">
                ✓
              </div>

              <div className="stat-content">
                <strong>{approvedRequests}</strong>
                <span>Approved</span>
              </div>

            </div>


            <div className="stat-card">

              <div className="stat-icon stat-rejected">
                ×
              </div>

              <div className="stat-content">
                <strong>{rejectedRequests}</strong>
                <span>Rejected</span>
              </div>

            </div>

          </div>

        </section>


        {/* ====================================
            REQUEST ACTION
        ==================================== */}

        <section className="parent-action">

          <div className="action-content">

            <span className="action-label">
              QUICK ACTION
            </span>

            <h2>
              Need an outpass?
            </h2>

            <p>
              Submit a request for your child
              to leave the campus.
            </p>

          </div>


          <button
            className="request-button"
            onClick={() => {
              setShowForm(!showForm);
              setMessage("");
              setError("");
            }}
            disabled={!student || studentLoading}
          >

            <span className="request-button-icon">
              +
            </span>

            <span>
              Request Outpass
            </span>

            <span className="request-arrow">
              →
            </span>

          </button>

        </section>


        {/* ====================================
            REQUEST FORM
        ==================================== */}

        {showForm && student && (

          <section className="outpass-form-card">

            <div className="form-header">

              <div>

                <span className="section-eyebrow">
                  NEW REQUEST
                </span>

                <h2>
                  Request an Outpass
                </h2>

                <p>
                  Requesting for{" "}
                  <strong>{student.name}</strong>
                </p>

              </div>

              <button
                className="close-form"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
              >
                ×
              </button>

            </div>


            <form
              className="outpass-form"
              onSubmit={handleSubmit}
            >


              {/* PLACE */}

              <div className="form-group">

                <label>
                  Place of Visit
                </label>

                <input
                  type="text"
                  placeholder="Example: Kochi"
                  value={placeOfVisit}
                  onChange={(e) =>
                    setPlaceOfVisit(e.target.value)
                  }
                  required
                />

              </div>


              {/* REASON */}

              <div className="form-group">

                <label>
                  Reason
                </label>

                <textarea
                  placeholder="Enter reason for the outpass"
                  value={reason}
                  onChange={(e) =>
                    setReason(e.target.value)
                  }
                  rows="3"
                  required
                />

              </div>


              {/* DATE */}

              <div className="form-group">

                <label>
                  Date
                </label>

                <input
                  type="date"
                  value={dateRequestedFor}
                  onChange={(e) =>
                    setDateRequestedFor(e.target.value)
                  }
                  required
                />

              </div>


              {/* TIME ROW */}

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Leaving Time
                  </label>

                  <input
                    type="time"
                    value={timeOfLeaving}
                    onChange={(e) =>
                      setTimeOfLeaving(e.target.value)
                    }
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Expected Return
                  </label>

                  <input
                    type="time"
                    value={expectedInTime}
                    onChange={(e) =>
                      setExpectedInTime(e.target.value)
                    }
                    required
                  />

                </div>

              </div>


              <button
                type="submit"
                className="submit-outpass-button"
                disabled={loading}
              >

                {loading
                  ? "Submitting..."
                  : "Submit Outpass Request →"}

              </button>

            </form>

          </section>

        )}


        {/* ====================================
            RECENT OUTPASSES
        ==================================== */}

        <section className="history-section">

          <div className="history-header">

            <div>

              <span className="section-eyebrow">
                ACTIVITY
              </span>

              <h2>
                Recent Outpasses
              </h2>

              <p>
                Track your child's latest requests.
              </p>

            </div>


            <button
              className="refresh-history"
              onClick={handleRefresh}
            >
              ↻ Refresh
            </button>

          </div>


          {/* LOADING */}

          {fetching && (

            <div className="empty-history loading-state">
              Loading requests...
            </div>

          )}


          {/* NO REQUESTS */}

          {!fetching &&
            outpasses.length === 0 && (

              <div className="empty-history">

                <div className="history-icon">
                  +
                </div>

                <h3>
                  No Requests Yet
                </h3>

                <p>
                  Your submitted outpass requests
                  will appear here.
                </p>

              </div>

            )}


          {/* RECENT REQUEST LIST */}

          {!fetching &&
            recentOutpasses.length > 0 && (

              <div className="parent-request-list">

                {recentOutpasses.map((outpass) => (

                  <div
                    className="parent-request-card"
                    key={outpass._id}
                  >

                    <div className="request-card-main">

                      <div className="request-location-icon">
                        ↗
                      </div>

                      <div className="request-summary">

                        <div className="request-title-row">

                          <h3>
                            {outpass.placeOfVisit}
                          </h3>

                          <span
                            className={getStatusClass(
                              outpass.status
                            )}
                          >
                            {outpass.status}
                          </span>

                        </div>

                        <p>
                          {outpass.reason}
                        </p>

                        <div className="request-meta">

                          <span>
                            {new Date(
                              outpass.dateRequestedFor
                            ).toLocaleDateString()}
                          </span>

                          <span className="meta-dot">
                            •
                          </span>

                          <span>
                            {outpass.timeOfLeaving}
                          </span>

                          <span className="meta-dot">
                            •
                          </span>

                          <span>
                            ID: {outpass.outpassId}
                          </span>

                        </div>

                      </div>

                      <div className="request-card-arrow">
                        →
                      </div>

                    </div>


                    {/* REJECTION */}

                    {outpass.status === "rejected" &&
                      outpass.rejectionReason && (

                        <div className="rejection-box">

                          <strong>
                            Rejection reason
                          </strong>

                          <span>
                            {outpass.rejectionReason}
                          </span>

                        </div>

                      )}


                    {/* APPROVED */}

                    {outpass.status === "approved" && (

                      <div className="approved-box">

                        <span className="approved-check">
                          ✓
                        </span>

                        <span>
                          Your outpass has been approved.
                        </span>

                      </div>

                    )}

                  </div>

                ))}

              </div>

            )}


          {/* VIEW ALL */}

          {!fetching &&
            outpasses.length > 3 && (

              <button
                className="view-all-button"
                onClick={() => {
                  window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: "smooth",
                  });
                }}
              >
                View all requests →
              </button>

            )}

        </section>

      </main>


      {/* ======================================
          MOBILE BOTTOM NAV
      ====================================== */}

      <nav className="mobile-bottom-nav">

        <button className="bottom-nav-item active">

          <span>
            ⌂
          </span>

          <small>
            Home
          </small>

        </button>

        <button
          className="bottom-nav-item"
          onClick={() => setShowForm(true)}
          disabled={!student || studentLoading}
        >

          <span>
            +
          </span>

          <small>
            Request
          </small>

        </button>

        <button className="bottom-nav-item">

          <span>
            ◷
          </span>

          <small>
            Activity
          </small>

        </button>

      </nav>

    </div>
  );
}

export default ParentDashboard;