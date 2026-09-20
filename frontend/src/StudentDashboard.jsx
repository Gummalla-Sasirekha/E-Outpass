import { useEffect, useMemo, useState } from "react";
import "./StudentDashboard.css";

const API_URL = import.meta.env.VITE_API_URL;

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
        profile: (
            <>
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 20a7 7 0 0 1 14 0" />
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
        completed: (
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
        mail: (
            <>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
            </>
        ),
        phone: (
            <path d="M7 4h3l1.5 4-2 1.5a14 14 0 0 0 5 5l1.5-2 4 1.5v3c0 1-1 1.9-2 1.9C10.5 18.1 5.9 13.5 4.1 6.9 3.8 5.4 5.1 4 7 4Z" />
        ),
        shield: (
            <>
                <path d="M12 3 19 6v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
                <path d="m9 12 2 2 4-4" />
            </>
        ),
        calendar: (
            <>
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4M8 3v4M3 10h18" />
            </>
        ),
        clock: (
            <>
                <circle cx="12" cy="12" r="8" />
                <path d="M12 8v5l3 2" />
            </>
        ),
        x: (
            <>
                <circle cx="12" cy="12" r="8" />
                <path d="m9 9 6 6M15 9l-6 6" />
            </>
        )
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

function StudentDashboard() {
    const [student, setStudent] = useState(null);
    const [outpasses, setOutpasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [gateOutpassId, setGateOutpassId] = useState(null);
    const [gateAction, setGateAction] = useState(null);
    const [gateLoading, setGateLoading] = useState(false);
    const [gateMessage, setGateMessage] = useState("");
    const [gateError, setGateError] = useState("");

    const token = localStorage.getItem("token");

    const fetchStudentData = async () => {
        try {
            setLoading(true);
            setError("");

            if (!token) {
                throw new Error("Please login again.");
            }

            const headers = {
                Authorization: `Bearer ${token}`
            };

            const [profileResponse, outpassResponse] = await Promise.all([
                fetch(`${API_URL}/api/student/me`, { headers }),
                fetch(`${API_URL}/api/student/outpasses`, { headers })
            ]);

            const profileData = await profileResponse.json();
            const outpassData = await outpassResponse.json();

            if (!profileResponse.ok) {
                throw new Error(
                    profileData.message || "Failed to load student profile."
                );
            }

            if (!outpassResponse.ok) {
                throw new Error(
                    outpassData.message || "Failed to load outpasses."
                );
            }

            setStudent(profileData.student);
            setOutpasses(outpassData.outpasses || []);
        } catch (err) {
            console.error("Student dashboard error:", err);
            setError(err.message || "Unable to load student dashboard.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const match = window.location.pathname.match(/^\/gate\/(.+)$/);

        if (!match) {
            return;
        }

        try {
            setGateOutpassId(decodeURIComponent(match[1]));
        } catch {
            setGateOutpassId(match[1]);
        }
    }, []);

    useEffect(() => {
        fetchStudentData();
    }, []);

    useEffect(() => {
        if (!gateOutpassId || !token) {
            return;
        }

        const matching = outpasses.find(
            (item) => item.outpassId === gateOutpassId
        );

        setGateAction(
            matching?.status === "completed" ? "completed" : "exit"
        );
    }, [gateOutpassId, outpasses, token]);

    const confirmGateAction = async () => {
        if (!gateOutpassId) {
            return;
        }

        try {
            setGateLoading(true);
            setGateError("");
            setGateMessage("");

            const response = await fetch(
                `${API_URL}/api/outpass/student-confirm`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        outpassId: gateOutpassId
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to confirm gate action."
                );
            }

            if (data.action === "exit") {
                setGateAction("outside");
                setGateMessage(
                    "Exit confirmed successfully. Have a safe trip!"
                );
            } else if (data.action === "return") {
                setGateAction("completed");
                setGateMessage(
                    "Return confirmed successfully. Welcome back!"
                );
            } else {
                setGateMessage(
                    data.message || "Gate action confirmed."
                );
            }

            await fetchStudentData();
        } catch (err) {
            setGateError(
                err.message || "Unable to confirm gate action."
            );
        } finally {
            setGateLoading(false);
        }
    };

    const closeGateVerification = () => {
        setGateOutpassId(null);
        setGateAction(null);
        setGateMessage("");
        setGateError("");
        window.history.replaceState({}, "", "/");
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
    };

    const scrollToSection = (id) => {
        document.getElementById(id)?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    };

    const goToDashboard = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const goToHistory = () => {
        scrollToSection("outpass-history-section");
    };

    const goToProfile = () => {
        scrollToSection("student-profile-section");
    };

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const formatDateTime = (date) => {
        if (!date) {
            return "-";
        }

        return new Date(date).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getStatusText = (status) => ({
        pending: "Pending",
        approved: "Approved",
        rejected: "Rejected",
        completed: "Completed",
        expired: "Expired"
    }[status] || status);

    const statusClass = (status) => `status-badge status-${status}`;

    const latestOutpass = outpasses[0] || null;
    const gateOutpass = outpasses.find(
        (item) => item.outpassId === gateOutpassId
    );

    const stats = useMemo(() => ({
        total: outpasses.length,
        pending: outpasses.filter(
            (item) => item.status === "pending"
        ).length,
        approved: outpasses.filter(
            (item) => item.status === "approved"
        ).length,
        completed: outpasses.filter(
            (item) => item.status === "completed"
        ).length
    }), [outpasses]);

    const statusMessage = latestOutpass
        ? ({
            pending: {
                title: "Waiting for Warden Approval",
                text: "Your request has been submitted and is waiting for warden approval.",
                icon: "clock"
            },
            approved: {
                title: "Outpass Approved",
                text: "Go to the main gate and scan the QR code displayed by Security.",
                icon: "approved"
            },
            rejected: {
                title: "Outpass Rejected",
                text:
                    latestOutpass.rejectionReason ||
                    "Your outpass request was rejected by the warden.",
                icon: "x"
            },
            completed: {
                title: "Returned Successfully",
                text: "Your return has been recorded at the main gate. This outpass is now completed.",
                icon: "completed"
            },
            expired: {
                title: "Outpass Expired",
                text: "This outpass is no longer valid.",
                icon: "clock"
            }
        }[latestOutpass.status] || {
            title: "Outpass Status",
            text: "Please check your outpass details.",
            icon: "request"
        })
        : null;

    if (loading) {
        return (
            <div className="student-loading">
                <div className="student-spinner" />
                <p>Loading Student Portal...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="student-error-page">
                <div className="student-error-card">
                    <div className="student-error-icon">!</div>
                    <h2>Something went wrong</h2>
                    <p>{error}</p>
                    <button onClick={fetchStudentData}>Try Again</button>
                    <button
                        className="error-logout"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="parent-page student-page">
            <aside className="parent-sidebar">
                <div>
                    <div className="sidebar-brand">
                        <strong>E Outpass</strong>
                        <span>Safer Campuses. Brighter Tomorrows.</span>
                    </div>

                    <nav className="sidebar-nav">
                        <button
                            className="sidebar-link active"
                            type="button"
                            onClick={goToDashboard}
                        >
                            <Icon name="dashboard" />
                            Dashboard
                        </button>

                        <button
                            className="sidebar-link"
                            type="button"
                            onClick={goToHistory}
                        >
                            <Icon name="history" />
                            My Outpasses
                        </button>

                        <button
                            className="sidebar-link"
                            type="button"
                            onClick={goToProfile}
                        >
                            <Icon name="profile" />
                            Profile
                        </button>
                    </nav>
                </div>

                <div className="sidebar-bottom">
                    <button
                        className="sidebar-link"
                        type="button"
                        onClick={handleLogout}
                    >
                        <Icon name="logout" />
                        Logout
                    </button>
                </div>
            </aside>

            <main className="parent-main" id="student-dashboard-top">
                <header className="parent-topbar">
                    <div className="mobile-brand">
                        <strong>E Outpass</strong>
                        <span>Safer Campuses. Brighter Tomorrows.</span>
                    </div>
                    <div className="topbar-actions">
                        <div className="profile-chip">
                            <span className="profile-avatar">
                                {(student?.name || "S")
                                    .charAt(0)
                                    .toUpperCase()}
                            </span>
                        </div>

                    </div>
                </header>

                <div className="parent-content">
                    <section className="parent-hero">
                        <div>
                            <span className="hero-eyebrow">
                                STUDENT PORTAL
                            </span>

                            <h1>
                                Good morning, {student?.name?.split(" ")[0] || "Student"}!
                            </h1>

                            <p>
                                Track your outpass requests and campus entry activity.
                            </p>
                        </div>

                    </section>

                    <section
                        className="child-card"
                        id="student-profile-section"
                    >
                        <div className="card-heading-row">
                            <h2>Student Profile</h2>
                        </div>

                        <div className="child-main">
                            <div className="child-avatar">
                                {(student?.name || "S")
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>

                            <div className="child-info">
                                <h3>{student?.name || "Student"}</h3>
                                <p>
                                    {student?.course || "Student"}
                                    <span>|</span>
                                    ID {student?.studentId || "—"}
                                    <span>|</span>
                                    Room {student?.roomNumber || "—"}
                                    <span>|</span>
                                    {student?.hostel?.name || "Hostel"}
                                </p>
                            </div>

                        </div>
                    </section>

                    <section className="activity-section">
                        <div className="section-title-row">
                            <h2>Outpass Activity</h2>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card stat-blue">
                                <div className="stat-icon">
                                    <Icon name="total" />
                                </div>
                                <div>
                                    <strong>{stats.total}</strong>
                                    <span>Total Requests</span>
                                </div>
                            </div>

                            <div className="stat-card stat-yellow">
                                <div className="stat-icon">
                                    <Icon name="pending" />
                                </div>
                                <div>
                                    <strong>{stats.pending}</strong>
                                    <span>Pending</span>
                                </div>
                            </div>

                            <div className="stat-card stat-green">
                                <div className="stat-icon">
                                    <Icon name="approved" />
                                </div>
                                <div>
                                    <strong>{stats.approved}</strong>
                                    <span>Approved</span>
                                </div>
                            </div>

                            <div className="stat-card stat-red">
                                <div className="stat-icon">
                                    <Icon name="completed" />
                                </div>
                                <div>
                                    <strong>{stats.completed}</strong>
                                    <span>Completed</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="request-banner" id="latest-update">
                        <div className="request-banner-icon">
                            <Icon
                                name={statusMessage?.icon || "request"}
                                size={22}
                            />
                        </div>

                        <div className="request-banner-copy">
                            <h2>
                                {statusMessage?.title || "No Outpass Activity Yet"}
                            </h2>
                            <p>
                                {statusMessage?.text ||
                                    "Your latest outpass status will appear here once a request is submitted."}
                            </p>
                        </div>

                        <button
                            className="primary-button"
                            type="button"
                            onClick={goToHistory}
                        >
                            My Outpasses
                            <Icon name="arrow" size={15} />
                        </button>
                    </section>

                    <section
                        className="recent-section"
                        id="outpass-history-section"
                    >
                        <div className="recent-heading">
                            <div>
                                <h2>My Outpasses</h2>
                            </div>

                            <button
                                className="view-all-link"
                                type="button"
                                onClick={fetchStudentData}
                                title="Refresh"
                                aria-label="Refresh outpasses"
                            >
                                <Icon name="refresh" size={15} />
                            </button>
                        </div>

                        {outpasses.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <Icon name="request" />
                                </div>
                                <h3>No Outpasses Yet</h3>
                                <p>
                                    Your outpass requests will appear here once your parent submits one.
                                </p>
                            </div>
                        ) : (
                            <div className="recent-table-wrap">
                                <div className="recent-table-head">
                                    <span>Destination</span>
                                    <span>Purpose</span>
                                    <span>Out Date</span>
                                    <span>In Date</span>
                                    <span>Status</span>
                                    <span />
                                </div>

                                {outpasses.slice(0, 5).map((outpass) => (
                                    <div
                                        className="recent-row"
                                        key={outpass._id || outpass.outpassId}
                                    >
                                        <div className="destination-cell">
                                            <span className="location-icon">
                                                <Icon name="location" size={16} />
                                            </span>
                                            <strong>
                                                {outpass.placeOfVisit || "—"}
                                            </strong>
                                        </div>

                                        <span className="purpose-cell">
                                            {outpass.reason || "—"}
                                        </span>

                                        <span>
                                            {formatDate(outpass.dateRequestedFor)}
                                            <small>
                                                {outpass.timeOfLeaving || "—"}
                                            </small>
                                        </span>

                                        <span>
                                            {outpass.expectedInTime
                                                ? formatDate(outpass.dateRequestedFor)
                                                : "—"}
                                            <small>
                                                {outpass.expectedInTime || "—"}
                                            </small>
                                        </span>

                                        <span className={statusClass(outpass.status)}>
                                            {getStatusText(outpass.status)}
                                        </span>

                                        <span className="row-arrow">
                                            <Icon name="arrow" size={16} />
                                        </span>

                                        {outpass.status === "rejected" &&
                                            outpass.rejectionReason && (
                                                <div className="row-note rejected-note">
                                                    <strong>Rejection reason</strong>
                                                    <span>
                                                        {outpass.rejectionReason}
                                                    </span>
                                                </div>
                                            )}

                                        {outpass.status === "approved" && (
                                            <div className="row-note approved-note">
                                                <span className="approved-dot">✓</span>
                                                Approved — go to the main gate and scan the QR displayed by Security.
                                            </div>
                                        )}

                                        {outpass.status === "completed" && (
                                            <div className="row-note approved-note">
                                                <span className="approved-dot">✓</span>
                                                Return has been recorded successfully.
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>


                </div>
            </main>

            <nav className="mobile-bottom-nav">
                <button
                    className="mobile-nav-item active"
                    type="button"
                    onClick={goToDashboard}
                >
                    <Icon name="dashboard" size={20} />
                    <span>Home</span>
                </button>

                <button
                    className="mobile-nav-item"
                    type="button"
                    onClick={goToHistory}
                >
                    <Icon name="history" size={20} />
                    <span>Outpasses</span>
                </button>

                <button
                    className="mobile-nav-item mobile-nav-logout"
                    type="button"
                    onClick={handleLogout}
                >
                    <Icon name="logout" size={19} />
                    <span>Logout</span>
                </button>
            </nav>

            {gateOutpassId && (
                <div className="gate-modal-backdrop">
                    <div className="gate-modal">
                        <div className="gate-modal-head">
                            <div>
                                <p className="student-eyebrow">MAIN GATE</p>
                                <h2>Outpass Verification</h2>
                            </div>

                            <button
                                type="button"
                                onClick={closeGateVerification}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        {gateOutpass ? (
                            <>
                                <div className="gate-pass-summary">
                                    <strong>{gateOutpass.outpassId}</strong>
                                    <span>
                                        {gateOutpass.placeOfVisit} • {formatDate(gateOutpass.dateRequestedFor)}
                                    </span>
                                </div>

                                {gateError && (
                                    <div className="gate-alert error">
                                        {gateError}
                                    </div>
                                )}

                                {gateMessage && (
                                    <div className="gate-alert success">
                                        {gateMessage}
                                    </div>
                                )}

                                {gateAction === "exit" && (
                                    <div className="gate-action">
                                        <div className="gate-action-icon">
                                            <Icon name="arrow" size={24} />
                                        </div>
                                        <h3>Confirm Exit</h3>
                                        <p>
                                            Confirm your exit to record your departure time.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={confirmGateAction}
                                            disabled={gateLoading}
                                        >
                                            {gateLoading
                                                ? "Confirming..."
                                                : "Confirm Exit"}
                                        </button>
                                    </div>
                                )}

                                {gateAction === "outside" && (
                                    <div className="gate-action outside">
                                        <div className="gate-action-icon">
                                            <Icon name="location" size={24} />
                                        </div>
                                        <h3>Exit Recorded</h3>
                                        <p>
                                            Your exit has been recorded. When you return, scan Security's QR again.
                                        </p>
                                        <button
                                            className="secondary"
                                            type="button"
                                            onClick={closeGateVerification}
                                        >
                                            Close
                                        </button>
                                    </div>
                                )}

                                {gateAction === "completed" && (
                                    <div className="gate-action completed">
                                        <div className="gate-action-icon">
                                            <Icon name="completed" size={24} />
                                        </div>
                                        <h3>Return Already Recorded</h3>
                                        <p>
                                            This outpass has already been completed.
                                        </p>
                                        <button
                                            className="secondary"
                                            type="button"
                                            onClick={closeGateVerification}
                                        >
                                            Close
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="gate-alert error">
                                This QR code does not belong to any of your outpasses.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default StudentDashboard;
