import { useEffect, useMemo, useState } from "react";
import "./ParentDashboard.css";

const API_URL = import.meta.env.VITE_API_URL;

/* =========================================================
   ICONS
   ========================================================= */

const Icon = ({ name, size = 20 }) => {
  const paths = {
    dashboard: (
      <>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </>
    ),

    request: (
      <>
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v5h5" />
        <path d="M10 13h6M13 10v6" />
      </>
    ),

    child: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </>
    ),

    history: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v5l3 2" />
        <path d="M4 5v4h4" />
      </>
    ),

    logout: (
      <>
        <path d="M10 4H5v16h5" />
        <path d="M13 8l4 4-4 4M9 12h8" />
      </>
    ),

    arrow: (
      <>
        <path d="M5 12h13" />
        <path d="m13 7 5 5-5 5" />
      </>
    ),

    total: (
      <>
        <path d="M6 3h9l4 4v14H6z" />
        <path d="M15 3v5h4" />
        <path d="M9 13h6M9 17h4" />
      </>
    ),

    pending: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v5l3 2" />
      </>
    ),

    approved: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="m8.5 12 2.3 2.3 4.8-5" />
      </>
    ),

    rejected: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="m9 9 6 6M15 9l-6 6" />
      </>
    ),

    location: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),

    refresh: (
      <>
        <path d="M20 11a8 8 0 0 0-14.8-4L4 9" />
        <path d="M4 4v5h5" />
        <path d="M4 13a8 8 0 0 0 14.8 4L20 15" />
        <path d="M20 20v-5h-5" />
      </>
    ),
  };

  return (
    <svg
      className="ui-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
};

/* =========================================================
   PARENT DASHBOARD
   ========================================================= */

function ParentDashboard() {
  const [outpasses, setOutpasses] = useState([]);
  const [student, setStudent] = useState(null);

  const [studentLoading, setStudentLoading] = useState(true);
  const [fetching, setFetching] = useState(true);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [parentUser, setParentUser] = useState(null);

  /* REQUEST OUTPASS FORM */
  const [showForm, setShowForm] = useState(false);
  const [placeOfVisit, setPlaceOfVisit] = useState("");
  const [reason, setReason] = useState("");
  const [dateRequestedFor, setDateRequestedFor] = useState("");
  const [timeOfLeaving, setTimeOfLeaving] = useState("");
  const [expectedInTime, setExpectedInTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* =========================================================
     FETCH LINKED STUDENT
     ========================================================= */

  const fetchStudent = async () => {
    try {
      setStudentLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/outpass/my-student`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      console.log("Outpass request response:", data);

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch linked student"
        );
      }

      setStudent(data.student);
    } catch (err) {
      console.error("Fetch student error:", err);

      setError(err.message);
      setStudent(null);
    } finally {
      setStudentLoading(false);
    }
  };

  /* =========================================================
     FETCH MY OUTPASSES
     ========================================================= */

  const fetchOutpasses = async () => {
    try {
      setFetching(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/outpass/my`,
        {
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
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setFetching(false);
    }
  };

  /* =========================================================
     LOAD DASHBOARD
     ========================================================= */

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("user") || "null"
      );

      setParentUser(saved);
    } catch {
      setParentUser(null);
    }

    fetchStudent();
    fetchOutpasses();
  }, []);

  /* =========================================================
     LOGOUT
     ========================================================= */

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.reload();
  };

  /* =========================================================
     REQUEST OUTPASS
     ========================================================= */

  const openRequestPage = () => {
    setMessage("");
    setError("");
    setShowForm(true);

    setTimeout(() => {
      document
        .getElementById("request-outpass-form")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  };

  const handleRequestSubmit = async (event) => {
    event.preventDefault();

    if (!student) {
      setError("No linked student found.");
      return;
    }

    if (!student.studentId) {
      console.error(
        "Linked student is missing studentId:",
        student
      );

      setError(
        "Student ID is missing. Please check the linked student record."
      );

      return;
    }

    if (
      !placeOfVisit.trim() ||
      !reason.trim() ||
      !dateRequestedFor ||
      !timeOfLeaving ||
      !expectedInTime
    ) {
      setError("Please fill in all the required fields.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");
      setError("");

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
            placeOfVisit: placeOfVisit.trim(),
            reason: reason.trim(),
            dateRequestedFor,
            timeOfLeaving,
            expectedInTime,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to submit outpass request"
        );
      }

      setMessage(
        data.message ||
          "Outpass request submitted successfully."
      );

      setPlaceOfVisit("");
      setReason("");
      setDateRequestedFor("");
      setTimeOfLeaving("");
      setExpectedInTime("");

      setShowForm(false);

      await fetchOutpasses();
    } catch (err) {
      console.error("Request outpass error:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================================================
     REFRESH
     ========================================================= */

  const handleRefresh = () => {
    setError("");

    fetchStudent();
    fetchOutpasses();
  };

  /* =========================================================
     STATISTICS
     ========================================================= */

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

  const recentOutpasses = outpasses.slice(0, 4);

  /* =========================================================
     PARENT INITIAL
     ========================================================= */

  const parentInitial = useMemo(
    () =>
      (
        parentUser?.name ||
        parentUser?.email ||
        "P"
      )
        .charAt(0)
        .toUpperCase(),
    [parentUser]
  );

  /* =========================================================
     FORMAT DATE
     ========================================================= */

  const formatDate = (value) => {
    if (!value) return "—";

    return new Date(value).toLocaleDateString(
      undefined,
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /* =========================================================
     STATUS CLASS
     ========================================================= */

  const statusClass = (status) =>
    `status-badge status-${String(
      status || ""
    ).toLowerCase()}`;

  /* =========================================================
     NAVIGATION
     ========================================================= */

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const goToDashboard = () => {
    scrollToSection("parent-dashboard-top");
  };

  const goToChild = () => {
    scrollToSection("my-child-section");
  };

  const goToHistory = () => {
    scrollToSection("outpass-history-section");
  };

  /* =========================================================
     UI
     ========================================================= */

  return (
    <div className="parent-page">

      {/* =====================================================
          DESKTOP SIDEBAR
          ===================================================== */}

      <aside className="parent-sidebar">

        <div>

          <div className="sidebar-brand">
            <strong>E Outpass</strong>

            <span>
              Safer Campuses. Brighter Tomorrows.
            </span>
          </div>

          <nav className="sidebar-nav">

            <button
              className="sidebar-link active"
              onClick={goToDashboard}
            >
              <Icon name="dashboard" />
              Dashboard
            </button>

            <button
              className="sidebar-link"
              onClick={goToChild}
            >
              <Icon name="child" />
              My Child
            </button>

            <button
              className="sidebar-link"
              onClick={goToHistory}
            >
              <Icon name="history" />
              Outpass History
            </button>

          </nav>

        </div>

        <div className="sidebar-bottom">

          <button
            className="sidebar-link"
            onClick={handleLogout}
          >
            <Icon name="logout" />
            Logout
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN
          ===================================================== */}

      <main
        className="parent-main"
        id="parent-dashboard-top"
      >

        {/* ===================================================
            MOBILE TOPBAR
            =================================================== */}

        <header className="parent-topbar">

          <div className="mobile-brand">
            <strong>E Outpass</strong>

            <span>
              Safer Campuses. Brighter Tomorrows.
            </span>
          </div>

          <div className="topbar-actions">

            <div className="profile-chip">

              <span className="profile-avatar">
                {parentInitial}
              </span>

              <span className="profile-role">
                Parent
              </span>

              <span className="profile-chevron">
                ⌄
              </span>

            </div>

          </div>

        </header>

        {/* ===================================================
            CONTENT
            =================================================== */}

        <div className="parent-content">

          {/* =================================================
              HERO
              ================================================= */}

          <section className="parent-hero">

            <div>

              <span className="hero-eyebrow">
                PARENT PORTAL
              </span>

              <h1>
                Good morning, Parent!
              </h1>

              <p>
                Manage your child's outpasses
                easily and stay informed.
              </p>

            </div>

          </section>

          {/* =================================================
              SUCCESS MESSAGE
              ================================================= */}

          {message && (
            <div className="alert success-alert">

              <span className="alert-check">
                ✓
              </span>

              <span>
                {message}
              </span>

            </div>
          )}

          {/* =================================================
              ERROR MESSAGE
              ================================================= */}

          {error && (
            <div className="alert error-alert">

              <span className="alert-check">
                !
              </span>

              <span>
                {error}
              </span>

            </div>
          )}

          {/* =================================================
              CHILD CARD
              ================================================= */}

          <section
            className="child-card"
            id="my-child-section"
          >

            <div className="card-heading-row">

              <h2>
                Your Child
              </h2>

            </div>

            <div className="child-main">

              <div className="child-avatar">
                {student?.name
                  ?.charAt(0)
                  .toUpperCase() || "S"}
              </div>

              <div className="child-info">

                {studentLoading ? (
                  <>
                    <h3>
                      Loading student...
                    </h3>

                    <p>
                      Please wait...
                    </p>
                  </>
                ) : student ? (
                  <>
                    <h3>
                      {student.name}
                    </h3>

                    <p>
                      {student.course || "Student"}

                      <span>|</span>

                      Room{" "}
                      {student.roomNumber || "—"}

                      <span>|</span>

                      {student.hostel?.name ||
                        "Hostel"}
                    </p>
                  </>
                ) : (
                  <>
                    <h3>
                      No Student Linked
                    </h3>

                    <p>
                      Please contact the administrator.
                    </p>
                  </>
                )}

              </div>

            </div>

          </section>

          {/* =================================================
              ACTIVITY
              ================================================= */}

          <section className="activity-section">

            <div className="section-title-row">

              <h2>
                Outpass Activity
              </h2>

            </div>

            <div className="stats-grid">

              <div className="stat-card stat-blue">

                <div className="stat-icon">
                  <Icon name="total" />
                </div>

                <div>
                  <strong>
                    {totalRequests}
                  </strong>

                  <span>
                    Total Requests
                  </span>
                </div>

              </div>

              <div className="stat-card stat-yellow">

                <div className="stat-icon">
                  <Icon name="pending" />
                </div>

                <div>
                  <strong>
                    {pendingRequests}
                  </strong>

                  <span>
                    Pending
                  </span>
                </div>

              </div>

              <div className="stat-card stat-green">

                <div className="stat-icon">
                  <Icon name="approved" />
                </div>

                <div>
                  <strong>
                    {approvedRequests}
                  </strong>

                  <span>
                    Approved
                  </span>
                </div>

              </div>

              <div className="stat-card stat-red">

                <div className="stat-icon">
                  <Icon name="rejected" />
                </div>

                <div>
                  <strong>
                    {rejectedRequests}
                  </strong>

                  <span>
                    Rejected
                  </span>
                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              REQUEST BANNER
              ================================================= */}

          <section className="request-banner">

            <div className="request-banner-icon">
              <Icon
                name="request"
                size={28}
              />
            </div>

            <div className="request-banner-copy">

              <h2>
                Need an outpass?
              </h2>

              <p>
                Request an outpass for your child.
              </p>

            </div>

            <button
              className="primary-button"
              onClick={openRequestPage}
              disabled={
                !student ||
                studentLoading
              }
            >
              <span>
                Request Outpass
              </span>

              <Icon
                name="arrow"
                size={18}
              />
            </button>

          </section>

          {/* =================================================
              REQUEST FORM
              ================================================= */}

          {showForm && (
            <section
              className="form-card"
              id="request-outpass-form"
            >

              <div className="form-card-header">

                <div>

                  <span className="hero-eyebrow">
                    NEW REQUEST
                  </span>

                  <h2>
                    Request an Outpass
                  </h2>

                  <p>
                    Submit an outpass request for your child.
                  </p>

                </div>

                <button
                  type="button"
                  className="outline-action"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

              </div>

              <form
                className="outpass-form"
                onSubmit={handleRequestSubmit}
              >

                <div className="form-row">

                  <div className="form-group">

                    <label htmlFor="placeOfVisit">
                      Place of Visit
                    </label>

                    <input
                      id="placeOfVisit"
                      type="text"
                      value={placeOfVisit}
                      onChange={(e) =>
                        setPlaceOfVisit(e.target.value)
                      }
                      placeholder="Enter destination"
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label htmlFor="dateRequestedFor">
                      Date
                    </label>

                    <input
                      id="dateRequestedFor"
                      type="date"
                      value={dateRequestedFor}
                      onChange={(e) =>
                        setDateRequestedFor(e.target.value)
                      }
                      required
                    />

                  </div>

                </div>

                <div className="form-group">

                  <label htmlFor="reason">
                    Reason
                  </label>

                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) =>
                      setReason(e.target.value)
                    }
                    placeholder="Enter the reason for the outpass"
                    rows="3"
                    required
                  />

                </div>

                <div className="form-row">

                  <div className="form-group">

                    <label htmlFor="timeOfLeaving">
                      Time of Leaving
                    </label>

                    <input
                      id="timeOfLeaving"
                      type="time"
                      value={timeOfLeaving}
                      onChange={(e) =>
                        setTimeOfLeaving(e.target.value)
                      }
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label htmlFor="expectedInTime">
                      Expected Return Time
                    </label>

                    <input
                      id="expectedInTime"
                      type="time"
                      value={expectedInTime}
                      onChange={(e) =>
                        setExpectedInTime(e.target.value)
                      }
                      required
                    />

                  </div>

                </div>

                <div className="form-actions">

                  <button
                    type="button"
                    className="outline-action"
                    onClick={() => setShowForm(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="submit-button"
                    disabled={
                      submitting ||
                      !student
                    }
                  >
                    {submitting
                      ? "Submitting..."
                      : "Submit Request"}
                  </button>

                </div>

              </form>

            </section>
          )}

          {/* =================================================
              RECENT OUTPASSES
              ================================================= */}

          <section
            className="recent-section"
            id="outpass-history-section"
          >

            <div className="recent-heading">

              <div>
                <h2>
                  Recent Outpasses
                </h2>
              </div>

              <button
                className="view-all-link"
                onClick={handleRefresh}
              >
                Refresh

                <Icon
                  name="refresh"
                  size={15}
                />
              </button>

            </div>

            {/* LOADING */}

            {fetching ? (
              <div className="empty-state">
                Loading requests...
              </div>
            ) : recentOutpasses.length === 0 ? (

              /* EMPTY */

              <div className="empty-state">

                <div className="empty-icon">
                  <Icon name="request" />
                </div>

                <h3>
                  No Requests Yet
                </h3>

                <p>
                  Your submitted outpass
                  requests will appear here.
                </p>

              </div>

            ) : (

              /* REQUEST TABLE */

              <div className="recent-table-wrap">

                <div className="recent-table-head">

                  <span>
                    Destination
                  </span>

                  <span>
                    Purpose
                  </span>

                  <span>
                    Out Date
                  </span>

                  <span>
                    In Date
                  </span>

                  <span>
                    Status
                  </span>

                  <span />

                </div>

                {recentOutpasses.map(
                  (outpass) => (
                    <div
                      className="recent-row"
                      key={outpass._id}
                    >

                      <div className="destination-cell">

                        <span className="location-icon">
                          <Icon
                            name="location"
                            size={16}
                          />
                        </span>

                        <strong>
                          {outpass.placeOfVisit}
                        </strong>

                      </div>

                      <span className="purpose-cell">
                        {outpass.reason}
                      </span>

                      <span>
                        {formatDate(
                          outpass.dateRequestedFor
                        )}

                        <small>
                          {outpass.timeOfLeaving || "—"}
                        </small>
                      </span>

                      <span>
                        {outpass.expectedInTime
                          ? formatDate(
                              outpass.dateRequestedFor
                            )
                          : "—"}

                        <small>
                          {outpass.expectedInTime || "—"}
                        </small>
                      </span>

                      <span
                        className={statusClass(
                          outpass.status
                        )}
                      >
                        {outpass.status}
                      </span>

                      <span className="row-arrow">
                        <Icon
                          name="arrow"
                          size={16}
                        />
                      </span>

                      {/* REJECTION */}

                      {outpass.status ===
                        "rejected" &&
                        outpass.rejectionReason && (
                          <div className="row-note rejected-note">

                            <strong>
                              Rejection reason
                            </strong>

                            <span>
                              {outpass.rejectionReason}
                            </span>

                          </div>
                        )}

                      {/* APPROVED */}

                      {outpass.status ===
                        "approved" && (
                          <div className="row-note approved-note">

                            <span className="approved-dot">
                              ✓
                            </span>

                            Your outpass has been
                            approved.

                          </div>
                        )}

                    </div>
                  )
                )}

              </div>
            )}

            {/* VIEW ALL */}

            {!fetching &&
              outpasses.length > 4 && (
                <button
                  className="view-all-button"
                  onClick={() =>
                    window.scrollTo({
                      top: document.body.scrollHeight,
                      behavior: "smooth",
                    })
                  }
                >
                  View all requests
                </button>
              )}

          </section>

        </div>

      </main>

      {/* =====================================================
          MOBILE BOTTOM NAVIGATION
          ===================================================== */}

      <nav
        className="mobile-bottom-nav"
        aria-label="Parent navigation"
      >

        <button
          type="button"
          className="mobile-nav-item active"
          onClick={goToDashboard}
        >
          <Icon
            name="dashboard"
            size={20}
          />

          <span>
            Home
          </span>
        </button>

        <button
          type="button"
          className="mobile-nav-item"
          onClick={goToHistory}
        >
          <Icon
            name="history"
            size={20}
          />

          <span>
            History
          </span>
        </button>

        <button
          type="button"
          className="mobile-nav-item mobile-nav-logout"
          onClick={handleLogout}
        >
          <Icon
            name="logout"
            size={19}
          />

          <span>
            Logout
          </span>
        </button>

      </nav>

    </div>
  );
}

export default ParentDashboard;