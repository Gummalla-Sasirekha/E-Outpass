import { useEffect, useMemo, useState } from "react";
import "./HODDashboard.css";

const API_URL = import.meta.env.VITE_API_URL;

/* =========================================================
   ICONS
========================================================= */

const Icon = ({ name, size = 20 }) => {
    const shapes = {
        grid: (
            <>
                <rect x="4" y="4" width="6" height="6" rx="1" />
                <rect x="14" y="4" width="6" height="6" rx="1" />
                <rect x="4" y="14" width="6" height="6" rx="1" />
                <rect x="14" y="14" width="6" height="6" rx="1" />
            </>
        ),

        academic: (
            <>
                <path d="M4 10l8-5 8 5-8 5-8-5Z" />
                <path d="M7 12v5c3 2 7 2 10 0v-5" />
                <path d="M20 10v6" />
            </>
        ),

        document: (
            <>
                <path d="M6 3h9l4 4v14H6z" />
                <path d="M15 3v5h4" />
                <path d="M9 13h6" />
                <path d="M9 17h4" />
            </>
        ),

        clock: (
            <>
                <circle cx="12" cy="12" r="8" />
                <path d="M12 8v5l3 2" />
            </>
        ),

        check: (
            <>
                <circle cx="12" cy="12" r="8" />
                <path d="m8.5 12 2.4 2.4 4.7-5" />
            </>
        ),

        close: (
            <>
                <circle cx="12" cy="12" r="8" />
                <path d="m9 9 6 6" />
                <path d="m15 9-6 6" />
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

        logout: (
            <>
                <path d="M10 4H5v16h5" />
                <path d="m13 8 4 4-4 4" />
                <path d="M9 12h8" />
            </>
        )
    };

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ui-icon"
            aria-hidden="true"
        >
            {shapes[name]}
        </svg>
    );
};


/* =========================================================
   HOD DASHBOARD
========================================================= */

function HODDashboard() {

    const [outpasses, setOutpasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const token = localStorage.getItem("token");


    /* =====================================================
       FETCH PENDING ACADEMIC REQUESTS
    ===================================================== */

    const fetchPendingOutpasses = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/api/outpass/academic-pending`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to fetch academic approval requests."
                );
            }

            setOutpasses(
                Array.isArray(data)
                    ? data
                    : data.outpasses || []
            );

        } catch (err) {

            console.error(
                "Academic requests error:",
                err
            );

            setError(
                err.message ||
                "Unable to load academic approval requests."
            );

        } finally {

            setLoading(false);

        }

    };


    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    useEffect(() => {
        fetchPendingOutpasses();
    }, []);


    /* =====================================================
       APPROVE
    ===================================================== */

    const approveOutpass = async (outpassId) => {

        try {

            setActionLoading(true);
            setError("");
            setMessage("");

            const response = await fetch(
                `${API_URL}/api/outpass/${encodeURIComponent(
                    outpassId
                )}/academic-approve`,
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
                throw new Error(
                    data.message ||
                    "Unable to approve the academic request."
                );
            }

            setMessage(
                "Academic approval granted. The request has been sent to the warden."
            );

            await fetchPendingOutpasses();

        } catch (err) {

            console.error(
                "Approval error:",
                err
            );

            setError(
                err.message ||
                "Unable to approve the request."
            );

        } finally {

            setActionLoading(false);

        }

    };


    /* =====================================================
       REJECT
    ===================================================== */

    const rejectOutpass = async (outpassId) => {

        const reason = window.prompt(
            "Enter rejection reason:"
        );

        if (!reason || !reason.trim()) {
            return;
        }

        try {

            setActionLoading(true);
            setError("");
            setMessage("");

            const response = await fetch(
                `${API_URL}/api/outpass/${encodeURIComponent(
                    outpassId
                )}/academic-reject`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        rejectionReason: reason.trim()
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to reject the academic request."
                );
            }

            setMessage(
                "Academic approval rejected."
            );

            await fetchPendingOutpasses();

        } catch (err) {

            console.error(
                "Rejection error:",
                err
            );

            setError(
                err.message ||
                "Unable to reject the request."
            );

        } finally {

            setActionLoading(false);

        }

    };


    /* =====================================================
       LOGOUT
    ===================================================== */

    const handleLogout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.reload();

    };


    /* =====================================================
       DATE FORMAT
    ===================================================== */

    const formatDate = (value) => {

        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    };


    /* =====================================================
       COUNTS
    ===================================================== */

    const pendingCount = outpasses.length;

    const awaitingCount = outpasses.filter(
        (item) =>
            item.academicApprovalStatus === "pending" ||
            item.status === "academic_pending"
    ).length;


    /* =====================================================
       USER INITIAL
    ===================================================== */

    const hodInitial = useMemo(() => {

        try {

            const user = JSON.parse(
                localStorage.getItem("user") || "null"
            );

            return (
                user?.name ||
                user?.email ||
                "H"
            )
                .charAt(0)
                .toUpperCase();

        } catch {

            return "H";

        }

    }, []);


    /* =====================================================
       UI
    ===================================================== */

    return (

        <div className="hod-page">


            {/* =================================================
               SIDEBAR
            ================================================= */}

            <aside className="hod-sidebar">

                <div>

                    <div className="sidebar-brand">

                        <strong>
                            E Outpass
                        </strong>

                        <span>
                            Safer Campuses. Brighter
                            <br />
                            Tomorrows.
                        </span>

                    </div>


                    <nav className="sidebar-nav">

                        <button
                            type="button"
                            className="sidebar-link active"
                            onClick={() =>
                                window.scrollTo({
                                    top: 0,
                                    behavior: "smooth"
                                })
                            }
                        >

                            <Icon
                                name="grid"
                                size={19}
                            />

                            Dashboard

                        </button>


                        <button
                            type="button"
                            className="sidebar-link"
                            onClick={() =>
                                document
                                    .getElementById(
                                        "academic-requests"
                                    )
                                    ?.scrollIntoView({
                                        behavior: "smooth"
                                    })
                            }
                        >

                            <Icon
                                name="academic"
                                size={19}
                            />

                            Academic Approvals

                        </button>

                    </nav>

                </div>


                <div className="sidebar-bottom">

                    <button
                        type="button"
                        className="sidebar-link"
                        onClick={handleLogout}
                    >

                        <Icon
                            name="logout"
                            size={19}
                        />

                        Logout

                    </button>

                </div>

            </aside>


            {/* =================================================
               MAIN
            ================================================= */}

            <main className="hod-main">


                {/* MOBILE TOPBAR */}

                <header className="hod-topbar">

                    <div className="mobile-brand">

                        <strong>
                            E Outpass
                        </strong>

                        <span>
                            Safer Campuses. Brighter Tomorrows.
                        </span>

                    </div>


                    <div className="hod-profile">
                        {hodInitial}
                    </div>

                </header>


                <div className="hod-content">


                    {/* =================================================
                       HERO
                    ================================================= */}

                    <section className="hod-hero">

                        <div>

                            <span className="hero-eyebrow">
                                HOD PORTAL
                            </span>

                            <h1>
                                Academic Approvals
                            </h1>

                            <p>
                                Review and manage weekday
                                outpass requests from students.
                            </p>

                        </div>

                    </section>


                    {/* =================================================
                       ALERTS
                    ================================================= */}

                    {message && (

                        <div className="alert success-alert">

                            <span className="alert-icon">

                                <Icon
                                    name="check"
                                    size={15}
                                />

                            </span>

                            <span>
                                {message}
                            </span>

                        </div>

                    )}


                    {error && (

                        <div className="alert error-alert">

                            <span className="alert-icon">

                                <Icon
                                    name="close"
                                    size={15}
                                />

                            </span>

                            <span>
                                {error}
                            </span>

                        </div>

                    )}


                    {/* =================================================
                       ACTIVITY
                    ================================================= */}

                    <section className="activity-section">

                        <div className="section-title-row">

                            <h2>
                                Academic Approval Activity
                            </h2>

                        </div>


                        <div className="stats-grid">


                            {/* PENDING */}

                            <div className="stat-card stat-blue">

                                <div className="stat-icon">

                                    <Icon
                                        name="document"
                                        size={19}
                                    />

                                </div>

                                <div>

                                    <strong>
                                        {loading
                                            ? "—"
                                            : pendingCount}
                                    </strong>

                                    <span>
                                        Pending Requests
                                    </span>

                                </div>

                            </div>


                            {/* AWAITING */}

                            <div className="stat-card stat-yellow">

                                <div className="stat-icon">

                                    <Icon
                                        name="clock"
                                        size={19}
                                    />

                                </div>

                                <div>

                                    <strong>
                                        {loading
                                            ? "—"
                                            : awaitingCount}
                                    </strong>

                                    <span>
                                        Awaiting Review
                                    </span>

                                </div>

                            </div>


                            {/* APPROVED */}

                            <div className="stat-card stat-green">

                                <div className="stat-icon">

                                    <Icon
                                        name="check"
                                        size={19}
                                    />

                                </div>

                                <div>

                                    <strong>
                                        —
                                    </strong>

                                    <span>
                                        Approved Today
                                    </span>

                                </div>

                            </div>


                            {/* REJECTED */}

                            <div className="stat-card stat-red">

                                <div className="stat-icon">

                                    <Icon
                                        name="close"
                                        size={19}
                                    />

                                </div>

                                <div>

                                    <strong>
                                        —
                                    </strong>

                                    <span>
                                        Rejected Today
                                    </span>

                                </div>

                            </div>

                        </div>

                    </section>


                    {/* =================================================
                       ACADEMIC REQUESTS
                    ================================================= */}

                    <section
                        className="academic-request-section"
                        id="academic-requests"
                    >

                        <div className="section-header">

                            <div>

                                <span className="hero-eyebrow">
                                    WEEKDAY APPROVALS
                                </span>

                                <h2>
                                    Academic Approval Requests
                                </h2>

                                <p>
                                    Weekday outpass requests
                                    requiring your academic approval.
                                </p>

                            </div>


                            <button
                                type="button"
                                className="refresh-button"
                                onClick={fetchPendingOutpasses}
                                disabled={loading}
                            >

                                <Icon
                                    name="refresh"
                                    size={16}
                                />

                                Refresh

                            </button>

                        </div>


                        {/* =================================================
                           LOADING
                        ================================================= */}

                        {loading ? (

                            <div className="empty-card">

                                <div className="loading-spinner" />

                                <h3>
                                    Loading requests...
                                </h3>

                                <p>
                                    Please wait while we fetch
                                    pending academic approvals.
                                </p>

                            </div>

                        ) : outpasses.length === 0 ? (


                            /* =================================================
                               EMPTY
                            ================================================= */

                            <div className="empty-card">

                                <div className="empty-icon">

                                    <Icon
                                        name="check"
                                        size={22}
                                    />

                                </div>

                                <h3>
                                    No pending requests
                                </h3>

                                <p>
                                    There are currently no weekday
                                    outpasses waiting for academic approval.
                                </p>

                            </div>


                        ) : (


                            /* =================================================
                               REQUESTS
                            ================================================= */

                            <div className="academic-request-list">

                                {outpasses.map(
                                    (outpass) => (

                                        <article
                                            key={outpass._id}
                                            className="academic-request-card"
                                        >


                                            {/* HEADER */}

                                            <div className="request-card-header">

                                                <div className="student-heading">

                                                    <div className="student-avatar">

                                                        {(
                                                            outpass.student?.name ||
                                                            "S"
                                                        )
                                                            .charAt(0)
                                                            .toUpperCase()}

                                                    </div>


                                                    <div>

                                                        <h3>
                                                            {
                                                                outpass.student?.name ||
                                                                "Student"
                                                            }
                                                        </h3>

                                                        <span>
                                                            {
                                                                outpass.student?.studentId ||
                                                                outpass.outpassId ||
                                                                "Outpass Request"
                                                            }
                                                        </span>

                                                    </div>

                                                </div>


                                                <span className="pending-badge">
                                                    Academic Approval Pending
                                                </span>

                                            </div>


                                            {/* DETAILS */}

                                            <div className="request-details">


                                                <div className="detail-item">

                                                    <span>
                                                        Course
                                                    </span>

                                                    <strong>
                                                        {
                                                            outpass.student?.course ||
                                                            "—"
                                                        }
                                                    </strong>

                                                </div>


                                                <div className="detail-item">

                                                    <span>
                                                        Hostel
                                                    </span>

                                                    <strong>
                                                        {
                                                            outpass.hostel?.name ||
                                                            "—"
                                                        }
                                                    </strong>

                                                </div>


                                                <div className="detail-item">

                                                    <span>
                                                        Room
                                                    </span>

                                                    <strong>
                                                        {
                                                            outpass.student?.roomNumber ||
                                                            "—"
                                                        }
                                                    </strong>

                                                </div>


                                                <div className="detail-item">

                                                    <span>
                                                        Date
                                                    </span>

                                                    <strong>
                                                        {formatDate(
                                                            outpass.dateRequestedFor
                                                        )}
                                                    </strong>

                                                </div>


                                                <div className="detail-item">

                                                    <span>
                                                        Leaving
                                                    </span>

                                                    <strong>
                                                        {
                                                            outpass.timeOfLeaving ||
                                                            "—"
                                                        }
                                                    </strong>

                                                </div>


                                                <div className="detail-item">

                                                    <span>
                                                        Expected Return
                                                    </span>

                                                    <strong>
                                                        {
                                                            outpass.expectedInTime ||
                                                            "—"
                                                        }
                                                    </strong>

                                                </div>


                                                <div className="detail-item">

                                                    <span>
                                                        Place of Visit
                                                    </span>

                                                    <strong>
                                                        {
                                                            outpass.placeOfVisit ||
                                                            "—"
                                                        }
                                                    </strong>

                                                </div>

                                            </div>


                                            {/* REASON */}

                                            <div className="reason-box">

                                                <span>
                                                    Reason
                                                </span>

                                                <p>
                                                    {
                                                        outpass.reason ||
                                                        "No reason provided."
                                                    }
                                                </p>

                                            </div>


                                            {/* FOOTER */}

                                            <div className="request-card-footer">

                                                <span className="outpass-id">

                                                    Outpass ID:{" "}

                                                    {
                                                        outpass.outpassId ||
                                                        "—"
                                                    }

                                                </span>


                                                <div className="request-actions">


                                                    {/* REJECT */}

                                                    <button
                                                        type="button"
                                                        className="reject-button"
                                                        onClick={() =>
                                                            rejectOutpass(
                                                                outpass.outpassId
                                                            )
                                                        }
                                                        disabled={
                                                            actionLoading
                                                        }
                                                    >

                                                        <Icon
                                                            name="close"
                                                            size={15}
                                                        />

                                                        Reject

                                                    </button>


                                                    {/* APPROVE */}

                                                    <button
                                                        type="button"
                                                        className="approve-button"
                                                        onClick={() =>
                                                            approveOutpass(
                                                                outpass.outpassId
                                                            )
                                                        }
                                                        disabled={
                                                            actionLoading
                                                        }
                                                    >

                                                        <Icon
                                                            name="check"
                                                            size={15}
                                                        />

                                                        Approve

                                                    </button>

                                                </div>

                                            </div>

                                        </article>

                                    )
                                )}

                            </div>

                        )}

                    </section>

                </div>

            </main>


            {/* =================================================
               MOBILE NAV
            ================================================= */}

            <nav className="hod-mobile-nav">

                <button
                    type="button"
                    className="active"
                    onClick={() =>
                        window.scrollTo({
                            top: 0,
                            behavior: "smooth"
                        })
                    }
                >

                    <Icon
                        name="grid"
                        size={20}
                    />

                    <span>
                        Home
                    </span>

                </button>


                <button
                    type="button"
                    onClick={() =>
                        document
                            .getElementById(
                                "academic-requests"
                            )
                            ?.scrollIntoView({
                                behavior: "smooth"
                            })
                    }
                >

                    <Icon
                        name="academic"
                        size={20}
                    />

                    <span>
                        Approvals
                    </span>

                </button>


                <button
                    type="button"
                    onClick={handleLogout}
                >

                    <Icon
                        name="logout"
                        size={20}
                    />

                    <span>
                        Logout
                    </span>

                </button>

            </nav>

        </div>

    );
}


export default HODDashboard;