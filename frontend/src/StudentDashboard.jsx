
import { useEffect, useMemo, useState } from "react";
import "./StudentDashboard.css";

const API_URL = import.meta.env.VITE_API_URL;

const Icon = ({ name, size = 20 }) => {
    const shapes = {
        menu: <path d="M4 6h16M4 12h16M4 18h16" />,
        bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
        home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
        history: <><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2M4 5v4h4" /></>,
        profile: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
        logout: <><path d="M10 4H5v16h5M13 8l4 4-4 4M9 12h8" /></>,
        search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></>,
        calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
        clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /></>,
        check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
        close: <path d="m6 6 12 12M18 6 6 18" />,
        arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
        total: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
        rejected: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m0-6-6 6" /></>,
        location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>
    };

    return (
        <svg width={size} height={size} viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {shapes[name] || shapes.total}
        </svg>
    );
};

const formatDate = (value) => value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric"
    })
    : "Date unavailable";

const formatDateTime = (value) => value
    ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    })
    : "Time not recorded";

const statusLabel = (status = "") =>
    status.charAt(0).toUpperCase() + status.slice(1);

function StudentDashboard() {
    const [student, setStudent] = useState(null);
    const [outpasses, setOutpasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState("home");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [selected, setSelected] = useState(null);
    const [timelineExpanded, setTimelineExpanded] = useState(0);
    const [gateMessage, setGateMessage] = useState("");
    const [gateError, setGateError] = useState("");
    const [gateLoading, setGateLoading] = useState(false);

    const token = localStorage.getItem("token");

    const fetchStudentData = async () => {
        try {
            setLoading(true);
            setError("");
            if (!token) throw new Error("Please log in again.");

            const headers = { Authorization: `Bearer ${token}` };
            const [profileResponse, outpassResponse] = await Promise.all([
                fetch(`${API_URL}/api/student/me`, { headers }),
                fetch(`${API_URL}/api/student/outpasses`, { headers })
            ]);

            const profileData = await profileResponse.json();
            const outpassData = await outpassResponse.json();

            if (!profileResponse.ok) {
                throw new Error(profileData.message || "Unable to load student profile.");
            }
            if (!outpassResponse.ok) {
                throw new Error(outpassData.message || "Unable to load outpasses.");
            }

            setStudent(profileData.student);
            setOutpasses(outpassData.outpasses || []);
        } catch (err) {
            setError(err.message || "Unable to load Student Portal.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudentData();
    }, []);

    useEffect(() => {
        const match = window.location.pathname.match(/^\/gate\/(.+)$/);
        if (!match) return;

        const id = decodeURIComponent(match[1]);
        const findGatePass = async () => {
            try {
                const response = await fetch(`${API_URL}/api/student/outpasses`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await response.json();
                const pass = (data.outpasses || []).find(
                    (item) => item.outpassId === id
                );
                if (pass) {
                    setSelected(pass);
                    setPage("gate");
                } else {
                    setGateError("This QR code does not match one of your outpasses.");
                    setPage("gate");
                }
            } catch {
                setGateError("Unable to verify this outpass. Please try again.");
                setPage("gate");
            }
        };
        if (token) findGatePass();
    }, []);

    const stats = useMemo(() => ({
        total: outpasses.length,
        pending: outpasses.filter((p) => p.status === "pending").length,
        approved: outpasses.filter((p) => p.status === "approved").length,
        rejected: outpasses.filter((p) => p.status === "rejected").length
    }), [outpasses]);

    const sortedOutpasses = useMemo(() => [...outpasses].sort((a, b) => {
        const priority = { pending: 0, approved: 1, rejected: 2, completed: 3, expired: 4 };
        const statusDiff = (priority[a.status] ?? 5) - (priority[b.status] ?? 5);
        if (statusDiff) return statusDiff;
        return new Date(b.createdAt || b.dateRequestedFor || 0)
            - new Date(a.createdAt || a.dateRequestedFor || 0);
    }), [outpasses]);

    const visibleOutpasses = sortedOutpasses.filter((item) =>
        (filter === "all" || item.status === filter) &&
        (item.placeOfVisit || "").toLowerCase().includes(search.toLowerCase())
    );

    const latest = sortedOutpasses[0];
    const name = student?.name || "Student";
    const initial = name.trim().charAt(0).toUpperCase() || "S";

    const openPage = (nextPage) => {
        setPage(nextPage);
        setDrawerOpen(false);
        setNotificationsOpen(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
    };

    const confirmGateAction = async () => {
        if (!selected?.outpassId) return;
        try {
            setGateLoading(true);
            setGateError("");
            setGateMessage("");
            const response = await fetch(`${API_URL}/api/outpass/student-confirm`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ outpassId: selected.outpassId })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Unable to confirm gate action.");
            setGateMessage(data.action === "exit"
                ? "Exit confirmed successfully. Have a safe trip!"
                : data.action === "return"
                    ? "Return confirmed successfully. Welcome back!"
                    : data.message || "Gate action confirmed.");
            await fetchStudentData();
        } catch (err) {
            setGateError(err.message || "Unable to confirm gate action.");
        } finally {
            setGateLoading(false);
        }
    };

    const timeline = (item) => [
        { title: "Request Submitted", detail: "Your parent submitted the request.", date: item.createdAt || item.requestedAt },
        { title: "Academic Approval", detail: "Academic review, when required by the workflow.", date: item.classAdvisorApprovedAt || item.hodApprovedAt },
        { title: "Warden Approval", detail: "The warden reviews the request.", date: item.wardenApprovedAt || item.approvedAt },
        { title: "Ready for Departure", detail: "Pass and QR details are available when approved and valid.", date: item.approvedAt }
    ];

    if (loading) return <div className="sr-loading"><div className="sr-spinner" /><p>Loading Student Portal…</p></div>;

    if (error) return (
        <div className="sr-error">
            <h2>Unable to load Student Portal</h2>
            <p>{error}</p>
            <button type="button" onClick={fetchStudentData}>Try again</button>
            <button type="button" onClick={logout}>Logout</button>
        </div>
    );

    return (
        <div className="sr-app">
            <header className="sr-topbar">
                <button className="sr-icon-button" type="button" onClick={() => setDrawerOpen(true)} aria-label="Open menu"><Icon name="menu" /></button>
                <strong>{page === "home" ? "E Outpass" : page === "outpasses" ? "My Outpasses" : page === "profile" ? "Profile" : page === "details" ? "Outpass Details" : "Gate Verification"}</strong>
                <button className="sr-icon-button sr-bell" type="button" onClick={() => setNotificationsOpen(!notificationsOpen)} aria-label="Notifications">
                    <Icon name="bell" />
                    {stats.pending > 0 && <span className="sr-dot" />}
                </button>
            </header>

            {notificationsOpen && (
                <section className="sr-notifications">
                    <div className="sr-heading"><h3>Request updates</h3><button type="button" onClick={() => setNotificationsOpen(false)}>Close</button></div>
                    {sortedOutpasses.slice(0, 4).map((item) => (
                        <button type="button" className="sr-notification" key={item._id || item.outpassId} onClick={() => { setSelected(item); openPage("details"); }}>
                            <span className={`sr-status ${item.status}`}>{statusLabel(item.status)}</span>
                            <span>{item.placeOfVisit || "Outpass request"}</span>
                        </button>
                    ))}
                    {!outpasses.length && <p>No updates yet.</p>}
                </section>
            )}

            {drawerOpen && <button type="button" className="sr-backdrop" aria-label="Close menu" onClick={() => setDrawerOpen(false)} />}
            <aside className={`sr-drawer ${drawerOpen ? "open" : ""}`}>
                <div className="sr-drawer-header">
                    <button className="sr-close-drawer" type="button" onClick={() => setDrawerOpen(false)} aria-label="Close menu">×</button>
                    <div className="sr-avatar">{initial}</div>
                    <strong>{name}</strong>
                    <span>{student?.course || "Student"}{student?.department ? ` · ${student.department}` : ""}</span>
                </div>
                <nav className="sr-drawer-links">
                    <button className={page === "home" ? "active" : ""} type="button" onClick={() => openPage("home")}><Icon name="home" />Home</button>
                    <button className={page === "outpasses" || page === "details" ? "active" : ""} type="button" onClick={() => openPage("outpasses")}><Icon name="history" />My Outpasses</button>
                    <button className={page === "profile" ? "active" : ""} type="button" onClick={() => openPage("profile")}><Icon name="profile" />Profile</button>
                </nav>
                <button className="sr-logout" type="button" onClick={logout}><Icon name="logout" />Logout</button>
            </aside>

            <main className="sr-main">
                {page === "home" && (
                    <div className="sr-content">
                        <section className="sr-welcome">
                            <p>Good morning,</p><h1>{name.split(" ")[0]}! 👋</h1>
                            <p>Here's your outpass overview.</p>
                        </section>

                        <section className="sr-stats">
                            {[
                                { key: "total", label: "Total", icon: "total", color: "mint" },
                                { key: "pending", label: "Pending", icon: "clock", color: "amber" },
                                { key: "approved", label: "Approved", icon: "check", color: "blue" },
                                { key: "rejected", label: "Rejected", icon: "rejected", color: "rose" }
                            ].map((item) => (
                                <button type="button" key={item.key} className={`sr-stat ${item.color}`} onClick={() => { setFilter(item.key === "total" ? "all" : item.key); openPage("outpasses"); }}>
                                    <Icon name={item.icon} size={20} /><strong>{stats[item.key]}</strong><span>{item.label}</span>
                                </button>
                            ))}
                        </section>

                        <section className="sr-card">
                            <div className="sr-heading"><h2>Latest Outpass</h2><button className="sr-link" type="button" onClick={() => openPage("outpasses")}>View all</button></div>
                            {latest ? (
                                <button type="button" className="sr-latest" onClick={() => { setSelected(latest); openPage("details"); }}>
                                    <div className="sr-card-title"><strong>{latest.placeOfVisit || "Destination not provided"}</strong><span className={`sr-status ${latest.status}`}>{statusLabel(latest.status)}</span></div>
                                    <p>{latest.reason || "Outpass request"}</p>
                                    <span className="sr-meta"><Icon name="calendar" size={16} />{formatDate(latest.dateRequestedFor)}</span>
                                    <span className="sr-meta"><Icon name="clock" size={16} />{latest.timeOfLeaving || "—"} – {latest.expectedInTime || "—"}</span>
                                    <span className="sr-link">View details <Icon name="arrow" size={16} /></span>
                                </button>
                            ) : <div className="sr-empty"><Icon name="history" size={28} /><strong>No outpasses yet</strong><p>Your parent's requests will appear here.</p></div>}
                        </section>

                        <section className="sr-card">
                            <div className="sr-heading"><h2>Approval Timeline</h2>{latest && <button className="sr-link" type="button" onClick={() => { setSelected(latest); openPage("details"); }}>View details</button>}</div>
                            {!latest ? <p className="sr-muted">Your approval journey will appear when a request is submitted.</p> : (
                                <div className="sr-timeline">
                                    {timeline(latest).map((stage, index) => (
                                        <button type="button" className={`sr-stage ${timelineExpanded === index ? "expanded" : ""}`} key={stage.title} onClick={() => setTimelineExpanded(timelineExpanded === index ? -1 : index)}>
                                            <span className={`sr-marker ${latest.status === "rejected" ? "rejected" : index === 0 || (latest.status === "approved" && index < 4) || (latest.status === "pending" && index === 0) ? "complete" : ""}`}>{latest.status === "rejected" && index === 1 ? "!" : index === 0 || (latest.status === "approved" && index < 4) ? "✓" : index + 1}</span>
                                            <span className="sr-stage-copy"><strong>{stage.title}</strong>{timelineExpanded === index && <small>{stage.detail}<br />{stage.date ? formatDateTime(stage.date) : "Awaiting this stage"}</small>}</span>
                                        </button>
                                    ))}
                                    {latest.status === "rejected" && <p className="sr-rejection">Rejected: {latest.rejectionReason || "See request details."}</p>}
                                </div>
                            )}
                        </section>

                        <section className="sr-card">
                            <div className="sr-heading"><h2>Recent Activity</h2><button className="sr-link" type="button" onClick={() => openPage("outpasses")}>View all</button></div>
                            {sortedOutpasses.slice(0, 3).map((item) => (
                                <button className="sr-activity" type="button" key={item._id || item.outpassId} onClick={() => { setSelected(item); openPage("details"); }}>
                                    <span className="sr-activity-icon"><Icon name="history" /></span>
                                    <span><strong>{statusLabel(item.status)}</strong><small>{item.placeOfVisit || "Outpass request"} · {formatDate(item.dateRequestedFor)}</small></span><Icon name="arrow" size={16} />
                                </button>
                            ))}
                            {!outpasses.length && <p className="sr-muted">Recent updates will appear here.</p>}
                        </section>
                    </div>
                )}

                {page === "outpasses" && (
                    <div className="sr-content">
                        <section className="sr-page-intro"><h1>My Outpasses</h1><p>Track your requests and approval status.</p></section>
                        <label className="sr-search"><Icon name="search" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search destination..." /></label>
                        <div className="sr-filters">
                            {[
                                { key: "all", label: "All", count: stats.total },
                                { key: "pending", label: "Pending", count: stats.pending },
                                { key: "approved", label: "Approved", count: stats.approved },
                                { key: "rejected", label: "Rejected", count: stats.rejected }
                            ].map((item) => (
                                <button type="button" key={item.key} className={filter === item.key ? "active" : ""} onClick={() => setFilter(item.key)}>
                                    <strong>{item.count.toString().padStart(2, "0")}</strong><span>{item.label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="sr-request-list">
                            {visibleOutpasses.map((item) => (
                                <button type="button" className="sr-request-card" key={item._id || item.outpassId} onClick={() => { setSelected(item); openPage("details"); }}>
                                    <div className="sr-card-title"><span><strong>{item.placeOfVisit || "Destination not provided"}</strong><small>{item.passType || item.type || "Outpass"}</small></span><span className={`sr-status ${item.status}`}>{statusLabel(item.status)}</span></div>
                                    <span className="sr-meta"><Icon name="calendar" size={16} />{formatDate(item.dateRequestedFor)}</span>
                                    <span className="sr-meta"><Icon name="clock" size={16} />{item.timeOfLeaving || "—"} – {item.expectedInTime || "—"}</span>
                                    {item.status === "rejected" && item.rejectionReason && <p className="sr-rejection">Reason: {item.rejectionReason}</p>}
                                    <span className="sr-link">View details <Icon name="arrow" size={16} /></span

                                </button>
                            ))}
                            {visibleOutpasses.length === 0 && (
                                <div className="sr-empty">
                                    <Icon name="history" size={28} />
                                    <strong>No outpasses found</strong>
                                    <p>Try another filter or search destination.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {page === "details" && selected && (
                    <div className="sr-content">
                        <button
                            type="button"
                            className="sr-link"
                            onClick={() => openPage("outpasses")}
                        >
                            ← Back to My Outpasses
                        </button>

                        <section className="sr-card">
                            <div className="sr-heading">
                                <h2>Outpass Details</h2>
                                <span className={`sr-status ${selected.status}`}>
                                    {statusLabel(selected.status)}
                                </span>
                            </div>

                            <h3>{selected.placeOfVisit || "Destination not provided"}</h3>

                            <p>{selected.reason || "No reason provided"}</p>

                            <span className="sr-meta">
                                <Icon name="calendar" size={16} />
                                {formatDate(selected.dateRequestedFor)}
                            </span>

                            <span className="sr-meta">
                                <Icon name="clock" size={16} />
                                Leaving: {selected.timeOfLeaving || "—"}
                            </span>

                            <span className="sr-meta">
                                <Icon name="clock" size={16} />
                                Expected return: {selected.expectedInTime || "—"}
                            </span>

                            <span className="sr-meta">
                                Pass type: {selected.passType || selected.type || "Outpass"}
                            </span>

                            {selected.status === "rejected" && (
                                <p className="sr-rejection">
                                    Rejection reason: {selected.rejectionReason || "No reason provided."}
                                </p>
                            )}

                            <h3>Approval Timeline</h3>

                            <div className="sr-timeline">
                                {timeline(selected).map((stage, index) => (
                                    <div className="sr-stage" key={stage.title}>
                                        <span className="sr-marker">
                                            {index + 1}
                                        </span>
                                        <span className="sr-stage-copy">
                                            <strong>{stage.title}</strong>
                                            <small>{stage.detail}</small>
                                            <small>
                                                {stage.date
                                                    ? formatDateTime(stage.date)
                                                    : "Awaiting this stage"}
                                            </small>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {page === "profile" && (
                    <div className="sr-content">
                        <section className="sr-page-intro">
                            <h1>My Profile</h1>
                            <p>View your student information.</p>
                        </section>

                        <section className="sr-card sr-profile">
                            <div className="sr-avatar">
                                {initial}
                            </div>

                            <h2>{name}</h2>
                            <p>{student?.course || "Course not available"}</p>

                            <div className="sr-profile-fields">
                                <div>
                                    <span>Student ID</span>
                                    <strong>{student?.studentId || "Not available"}</strong>
                                </div>

                                <div>
                                    <span>Department</span>
                                    <strong>{student?.department || "Not available"}</strong>
                                </div>

                                <div>
                                    <span>Hostel</span>
                                    <strong>
                                        {student?.hostel?.name ||
                                            student?.hostelName ||
                                            "Not available"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Room</span>
                                    <strong>{student?.roomNumber || "Not available"}</strong>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="sr-logout"
                                onClick={logout}
                            >
                                <Icon name="logout" />
                                Logout
                            </button>
                        </section>
                    </div>
                )}

                {page === "gate" && (
                    <div className="sr-content">
                        <section className="sr-card">
                            <div className="sr-heading">
                                <h2>Gate Verification</h2>
                                <button
                                    type="button"
                                    className="sr-link"
                                    onClick={() => openPage("home")}
                                >
                                    Close
                                </button>
                            </div>

                            {gateError && (
                                <p className="sr-rejection">{gateError}</p>
                            )}

                            {selected ? (
                                <>
                                    <h3>{selected.placeOfVisit || "Outpass"}</h3>
                                    <p>
                                        Status: {statusLabel(selected.status)}
                                    </p>

                                    {gateMessage && (
                                        <p className="sr-success">{gateMessage}</p>
                                    )}

                                    {selected.status === "approved" && (
                                        <button
                                            type="button"
                                            className="sr-primary-button"
                                            onClick={confirmGateAction}
                                            disabled={gateLoading}
                                        >
                                            {gateLoading
                                                ? "Confirming..."
                                                : "Confirm Exit / Return"}
                                        </button>
                                    )}

                                    {selected.status !== "approved" && (
                                        <p>
                                            This outpass is not currently approved.
                                            Please contact the campus authorities if you need help.
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p>Unable to find this outpass.</p>
                            )}
                        </section>
                    </div>
                )}
            </main>

            <nav className="sr-bottom-nav">
                <button
                    type="button"
                    className={page === "home" ? "active" : ""}
                    onClick={() => openPage("home")}
                >
                    <Icon name="home" />
                    <span>Home</span>
                </button>

                <button
                    type="button"
                    className={page === "outpasses" || page === "details" ? "active" : ""}
                    onClick={() => openPage("outpasses")}
                >
                    <Icon name="history" />
                    <span>My Outpasses</span>
                </button>

                <button
                    type="button"
                    className={page === "profile" ? "active" : ""}
                    onClick={() => openPage("profile")}
                >
                    <Icon name="profile" />
                    <span>Profile</span>
                </button>
            </nav>
        </div>
    );
}

export default StudentDashboard;