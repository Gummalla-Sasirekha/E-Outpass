import { useEffect, useMemo, useState } from "react";
import "./SecurityDashboard.css";

const API_URL = import.meta.env.VITE_API_URL;

function Icon({ name, size = 18 }) {
    const common = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round"
    };

    const paths = {
        grid: (
            <>
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
            </>
        ),

        document: (
            <>
                <path d="M6 3h8l4 4v14H6z" />
                <path d="M14 3v5h5" />
                <path d="M9 13h6M9 17h5" />
            </>
        ),

        user: (
            <>
                <circle cx="12" cy="8" r="3" />
                <path d="M5 21c.6-4.2 2.8-6 7-6s6.4 1.8 7 6" />
            </>
        ),

        logout: (
            <>
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
                <path d="M21 3v18" />
            </>
        ),

        shield: (
            <>
                <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />
                <path d="m9 12 2 2 4-4" />
            </>
        ),

        search: (
            <>
                <circle cx="11" cy="11" r="6" />
                <path d="m16 16 4 4" />
            </>
        ),

        qr: (
            <>
                <rect x="3" y="3" width="6" height="6" />
                <rect x="15" y="3" width="6" height="6" />
                <rect x="3" y="15" width="6" height="6" />
                <path d="M15 15h3v3h-3zM18 18h3v3h-3zM15 21h3M21 15v3" />
            </>
        ),

        clock: (
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
            </>
        ),

        check: (
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="m8 12 2.5 2.5L16 9" />
            </>
        ),

        refresh: (
            <>
                <path d="M20 11a8 8 0 0 0-14-5L4 8" />
                <path d="M4 4v4h4" />
                <path d="M4 13a8 8 0 0 0 14 5l2-2" />
                <path d="M20 20v-4h-4" />
            </>
        ),

        arrow: (
            <>
                <path d="M5 12h13" />
                <path d="m13 6 6 6-6 6" />
            </>
        ),

        info: (
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 10v6M12 7h.01" />
            </>
        )
    };

    return (
        <svg {...common}>
            {paths[name] || paths.document}
        </svg>
    );
}

function SecurityDashboard() {
    const [outpassId, setOutpassId] = useState("");
    const [outpass, setOutpass] = useState(null);
    const [loading, setLoading] = useState(false);
    const [approvedOutpasses, setApprovedOutpasses] = useState([]);
    const [approvedLoading, setApprovedLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [gateHistory, setGateHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const token = localStorage.getItem("token");

    const formatDate = (date) =>
        date
            ? new Date(date).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
              })
            : "-";

    const formatDateTime = (date) =>
        date
            ? new Date(date).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
              })
            : "-";

    const formatTime = (time) => time || "-";

    const fetchApprovedOutpasses = async () => {
        try {
            setApprovedLoading(true);

            const response = await fetch(
                `${API_URL}/api/outpass/security-approved`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Unable to fetch approved outpasses."
                );
            }

            setApprovedOutpasses(data.outpasses || []);
        } catch (err) {
            console.error("Approved outpasses error:", err);

            setError(
                err.message ||
                    "Unable to load approved outpasses."
            );
        } finally {
            setApprovedLoading(false);
        }
    };

    const fetchGateHistory = async () => {
        try {
            setHistoryLoading(true);

            const response = await fetch(
                `${API_URL}/api/outpass/gate-history`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Unable to fetch gate history."
                );
            }

            setGateHistory(data.gateLogs || []);
        } catch (err) {
            console.error("Gate history error:", err);

            setError(
                err.message ||
                    "Unable to load gate history."
            );
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchApprovedOutpasses();
        fetchGateHistory();
    }, []);

    const displayQR = async (selectedId) => {
        setOutpassId(selectedId);
        setError("");
        setSuccess("");
        setOutpass(null);

        try {
            setLoading(true);

            const response = await fetch(
                `${API_URL}/api/outpass/validate`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        outpassId: selectedId
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Unable to validate outpass."
                );
            }

            if (!data.outpass) {
                throw new Error(
                    "Outpass details were not returned."
                );
            }

            if (data.outpass.status !== "approved") {
                throw new Error(
                    `This outpass is ${data.outpass.status}. Only approved outpasses can be displayed at the gate.`
                );
            }

            if (!data.outpass.qrCode) {
                throw new Error(
                    "QR code is not available for this outpass."
                );
            }

            setOutpass(data.outpass);

            setSuccess(
                "Outpass verified. QR code is ready for the student to scan."
            );

            setTimeout(() => {
                document
                    .getElementById("verified-outpass-card")
                    ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
            }, 50);
        } catch (err) {
            console.error("Display QR error:", err);

            setError(
                err.message ||
                    "Unable to display QR."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDisplayQR = () => {
        const cleanId = outpassId.trim();

        if (!cleanId) {
            setError("Please enter an Outpass ID.");
            return;
        }

        displayQR(cleanId);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.reload();
    };

    const filteredOutpasses = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        if (!search) {
            return approvedOutpasses;
        }

        return approvedOutpasses.filter(
            (item) =>
                (item.student?.name || "")
                    .toLowerCase()
                    .includes(search) ||
                (item.outpassId || "")
                    .toLowerCase()
                    .includes(search)
        );
    }, [approvedOutpasses, searchTerm]);

    const stats = useMemo(
        () => ({
            approved: approvedOutpasses.length,

            ready: approvedOutpasses.filter(
                (x) => x.status === "approved"
            ).length,

            outside: gateHistory.filter(
                (x) => x.status === "outside"
            ).length,

            returned: gateHistory.filter(
                (x) => x.status === "returned"
            ).length
        }),
        [approvedOutpasses, gateHistory]
    );

    return (
        <div className="security-page">
            <aside className="security-sidebar">
                <div>
                    <div className="security-brand">
                        <strong>E Outpass</strong>
                    </div>

                    <nav className="security-nav">
                        <a
                            href="#top"
                            className="security-nav-link active"
                        >
                            <Icon name="grid" />
                            Dashboard
                        </a>

                        <a
                            href="#verification"
                            className="security-nav-link"
                        >
                            <Icon name="qr" />
                            Gate Verification
                        </a>

                        <a
                            href="#history"
                            className="security-nav-link"
                        >
                            <Icon name="clock" />
                            Outpass History
                        </a>

                        <a
                            href="#profile"
                            className="security-nav-link"
                        >
                            <Icon name="user" />
                            Profile
                        </a>
                    </nav>
                </div>

                <div className="security-sidebar-bottom">
                    <button onClick={handleLogout}>
                        <Icon name="logout" />
                        Logout
                    </button>
                </div>
            </aside>

            <main
                className="security-main"
                id="top"
            >
                <header className="security-topbar">
                    <div className="security-user">
                        <span>S</span>
                        <strong>Security</strong>
                        <small>⌄</small>
                    </div>
                </header>

                <div className="security-content">
                    <section className="security-hero">
                        <div>
                            <p className="security-eyebrow">
                                SECURITY PORTAL
                            </p>

                            <h1>
                                Main Gate Verification
                            </h1>

                            <p>
                                Verify approved outpasses and
                                record student movement at the
                                common main gate.
                            </p>
                        </div>

                        <div className="security-live">
                            <span />
                            Gate Active
                        </div>
                    </section>

                    <section
                        className="security-context-card"
                        id="profile"
                    >
                        <div className="security-context-icon">
                            <Icon
                                name="shield"
                                size={22}
                            />
                        </div>

                        <div className="security-context-info">
                            <span>YOUR STATION</span>

                            <h2>
                                Main Gate Security
                            </h2>

                            <p>
                                Common verification point{" "}
                                <b>•</b> All hostels
                            </p>
                        </div>

                        <div className="security-context-status">
                            <span>STATUS</span>
                            <strong>Active</strong>
                        </div>
                    </section>

                    <section className="security-activity-card">
                        <div className="security-activity-title">
                            Gate Activity{" "}
                            <span>(Current)</span>
                        </div>

                        <div className="security-stat-grid">
                            <div className="security-stat blue">
                                <div className="security-stat-icon">
                                    <Icon
                                        name="document"
                                        size={17}
                                    />
                                </div>

                                <div>
                                    <strong>
                                        {stats.approved}
                                    </strong>

                                    <span>
                                        Approved Passes
                                    </span>
                                </div>
                            </div>

                            <div className="security-stat yellow">
                                <div className="security-stat-icon">
                                    <Icon
                                        name="qr"
                                        size={17}
                                    />
                                </div>

                                <div>
                                    <strong>
                                        {stats.ready}
                                    </strong>

                                    <span>
                                        Ready to Verify
                                    </span>
                                </div>
                            </div>

                            <div className="security-stat orange">
                                <div className="security-stat-icon">
                                    <Icon
                                        name="clock"
                                        size={17}
                                    />
                                </div>

                                <div>
                                    <strong>
                                        {stats.outside}
                                    </strong>

                                    <span>
                                        Outside
                                    </span>
                                </div>
                            </div>

                            <div className="security-stat green">
                                <div className="security-stat-icon">
                                    <Icon
                                        name="check"
                                        size={17}
                                    />
                                </div>

                                <div>
                                    <strong>
                                        {stats.returned}
                                    </strong>

                                    <span>
                                        Returned
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {error && (
                        <div className="security-alert error">
                            <Icon name="info" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="security-alert success">
                            <Icon name="check" />
                            <span>{success}</span>
                        </div>
                    )}

                    <section className="security-action-grid">
                        <section
                            className="security-panel verification-panel"
                            id="verification"
                        >
                            <div className="security-panel-head">
                                <div>
                                    <p className="security-eyebrow">
                                        GATE VERIFICATION
                                    </p>

                                    <h2>
                                        Search Approved Outpass
                                    </h2>

                                    <p>
                                        Find a student by name or
                                        Outpass ID, then display
                                        the QR.
                                    </p>
                                </div>

                                <button
                                    className="security-refresh"
                                    onClick={
                                        fetchApprovedOutpasses
                                    }
                                    disabled={approvedLoading}
                                >
                                    <Icon
                                        name="refresh"
                                        size={15}
                                    />

                                    {approvedLoading
                                        ? "Refreshing..."
                                        : "Refresh"}
                                </button>
                            </div>

                            <div className="security-search">
                                <Icon
                                    name="search"
                                    size={21}
                                />

                                <input
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Search student name or Outpass ID..."
                                />
                            </div>

                            <div className="security-approved-list">
                                {approvedLoading ? (
                                    <div className="security-empty-small">
                                        <Icon name="clock" />

                                        <strong>
                                            Loading approved
                                            outpasses...
                                        </strong>
                                    </div>
                                ) : approvedOutpasses.length ===
                                  0 ? (
                                    <div className="security-empty-small">
                                        <Icon name="document" />

                                        <strong>
                                            No approved
                                            outpasses
                                        </strong>

                                        <span>
                                            Approved requests will
                                            appear here after
                                            warden approval.
                                        </span>
                                    </div>
                                ) : filteredOutpasses.length ===
                                  0 ? (
                                    <div className="security-empty-small">
                                        <Icon name="search" />

                                        <strong>
                                            No matching student
                                        </strong>

                                        <span>
                                            Try another student
                                            name or Outpass ID.
                                        </span>
                                    </div>
                                ) : (
                                    filteredOutpasses
                                        .slice(0, 6)
                                        .map((item) => (
                                            <div
                                                className="security-approved-item"
                                                key={item._id}
                                            >
                                                <div className="security-approved-student">
                                                    <div className="security-student-avatar">
                                                        {(
                                                            item
                                                                .student
                                                                ?.name ||
                                                            "S"
                                                        )
                                                            .charAt(
                                                                0
                                                            )
                                                            .toUpperCase()}
                                                    </div>

                                                    <div>
                                                        <h3>
                                                            {item
                                                                .student
                                                                ?.name ||
                                                                "Unknown Student"}
                                                        </h3>

                                                        <p>
                                                            {item
                                                                .student
                                                                ?.course ||
                                                                "-"}{" "}
                                                            • Room{" "}
                                                            {item
                                                                .student
                                                                ?.roomNumber ||
                                                                "-"}
                                                        </p>

                                                        <span>
                                                            {item
                                                                .hostel
                                                                ?.name ||
                                                                "-"}{" "}
                                                            •{" "}
                                                            {
                                                                item.outpassId
                                                            }
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="security-approved-meta">
                                                    <div>
                                                        <span>
                                                            DATE
                                                        </span>

                                                        <strong>
                                                            {formatDate(
                                                                item.dateRequestedFor
                                                            )}
                                                        </strong>
                                                    </div>

                                                    <div>
                                                        <span>
                                                            LEAVING
                                                        </span>

                                                        <strong>
                                                            {formatTime(
                                                                item.timeOfLeaving
                                                            )}
                                                        </strong>
                                                    </div>

                                                    <div>
                                                        <span>
                                                            RETURN
                                                        </span>

                                                        <strong>
                                                            {formatTime(
                                                                item.expectedInTime
                                                            )}
                                                        </strong>
                                                    </div>
                                                </div>

                                                <button
                                                    className="security-view-button"
                                                    onClick={() =>
                                                        displayQR(
                                                            item.outpassId
                                                        )
                                                    }
                                                    disabled={loading}
                                                >
                                                    {loading &&
                                                    outpassId ===
                                                        item.outpassId
                                                        ? "Loading..."
                                                        : "Display QR"}

                                                    <Icon
                                                        name="arrow"
                                                        size={14}
                                                    />
                                                </button>
                                            </div>
                                        ))
                                )}
                            </div>
                        </section>
                    </section>

                    <section className="security-manual-card">
                        <div className="security-manual-head">
                            <div>
                                <p className="security-eyebrow">
                                    MANUAL VERIFICATION
                                </p>

                                <h2>
                                    Display by Outpass ID
                                </h2>

                                <p>
                                    Use this only when you already
                                    know the approved Outpass ID.
                                </p>
                            </div>
                        </div>

                        <div className="security-manual-row">
                            <input
                                value={outpassId}
                                onChange={(e) =>
                                    setOutpassId(
                                        e.target.value
                                    )
                                }
                                onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    handleDisplayQR()
                                }
                                placeholder="Example: OP-1789044128762-464"
                            />

                            <button
                                onClick={handleDisplayQR}
                                disabled={loading}
                            >
                                <Icon
                                    name="qr"
                                    size={15}
                                />

                                {loading
                                    ? "Verifying..."
                                    : "Display QR"}
                            </button>
                        </div>
                    </section>

                    {outpass && (
                        <section
                            id="verified-outpass-card"
                            className="security-verified-card"
                        >
                            <div className="security-verified-head">
                                <div>
                                    <p className="security-eyebrow">
                                        APPROVED OUTPASS
                                    </p>

                                    <h2>
                                        {outpass.outpassId}
                                    </h2>
                                </div>

                                <span>
                                    ✓ APPROVED
                                </span>
                            </div>

                            <div className="security-verified-student">
                                <div className="security-student-avatar large">
                                    {(
                                        outpass.student?.name ||
                                        "S"
                                    )
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div>
                                    <span>STUDENT</span>

                                    <h3>
                                        {outpass.student?.name ||
                                            "Unknown Student"}
                                    </h3>

                                    <p>
                                        ID:{" "}
                                        {outpass.student
                                            ?.studentId || "-"}{" "}
                                        •{" "}
                                        {outpass.student?.course ||
                                            "-"}
                                    </p>
                                </div>
                            </div>

                            <div className="security-detail-grid">
                                <div>
                                    <span>
                                        PLACE OF VISIT
                                    </span>

                                    <strong>
                                        {outpass.placeOfVisit ||
                                            "-"}
                                    </strong>
                                </div>

                                <div>
                                    <span>REASON</span>

                                    <strong>
                                        {outpass.reason || "-"}
                                    </strong>
                                </div>

                                <div>
                                    <span>DATE</span>

                                    <strong>
                                        {formatDate(
                                            outpass.dateRequestedFor
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>LEAVING</span>

                                    <strong>
                                        {formatTime(
                                            outpass.timeOfLeaving
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>EXPECTED IN</span>

                                    <strong>
                                        {formatTime(
                                            outpass.expectedInTime
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>HOSTEL</span>

                                    <strong>
                                        {outpass.hostel?.name ||
                                            "-"}
                                    </strong>
                                </div>
                            </div>

                            <div className="security-qr-area">
                                <div>
                                    <p className="security-eyebrow">
                                        MAIN GATE QR
                                    </p>

                                    <h2>
                                        Student Scan Here
                                    </h2>

                                    <span>
                                        Display this QR and ask
                                        the student to scan it.
                                    </span>
                                </div>

                                <div className="security-qr-wrap">
                                    {outpass.qrCode ? (
                                        <img
                                            src={outpass.qrCode}
                                            alt="Main Gate QR Code"
                                        />
                                    ) : (
                                        <strong>
                                            QR code unavailable
                                        </strong>
                                    )}
                                </div>

                                <div className="security-scan-note">
                                    <Icon
                                        name="qr"
                                        size={17}
                                    />

                                    <div>
                                        <strong>
                                            Student Action
                                        </strong>

                                        <span>
                                            Scan the QR →
                                            confirm the action
                                            on the phone.
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="security-verified-flow">
                                <div className="active">
                                    <b>1</b>

                                    <div>
                                        <strong>
                                            Search & Display
                                        </strong>

                                        <span>
                                            Security displays the
                                            approved QR.
                                        </span>
                                    </div>
                                </div>

                                <i />

                                <div>
                                    <b>2</b>

                                    <div>
                                        <strong>
                                            Student Scans
                                        </strong>

                                        <span>
                                            Student scans the
                                            displayed QR.
                                        </span>
                                    </div>
                                </div>

                                <i />

                                <div>
                                    <b>3</b>

                                    <div>
                                        <strong>
                                            Confirm
                                        </strong>

                                        <span>
                                            Exit or Return is
                                            recorded.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    <section
                        className="security-history-card"
                        id="history"
                    >
                        <div className="security-panel-head">
                            <div>
                                <p className="security-eyebrow">
                                    GATE RECORDS
                                </p>

                                <h2>
                                    Gate History
                                </h2>

                                <p>
                                    Recent student exit and
                                    return activity across the
                                    main gate.
                                </p>
                            </div>

                            <button
                                className="security-refresh"
                                onClick={fetchGateHistory}
                                disabled={historyLoading}
                            >
                                <Icon
                                    name="refresh"
                                    size={15}
                                />

                                {historyLoading
                                    ? "Loading..."
                                    : "Refresh"}
                            </button>
                        </div>

                        {gateHistory.length === 0 &&
                        !historyLoading ? (
                            <div className="security-empty-history">
                                <Icon
                                    name="document"
                                    size={21}
                                />

                                <strong>
                                    No gate records yet
                                </strong>

                                <span>
                                    Exit and return records will
                                    appear here after students use
                                    their QR outpass.
                                </span>
                            </div>
                        ) : (
                            <div className="security-history-table-wrap">
                                <table className="security-history-table">
                                    <thead>
                                        <tr>
                                            <th>
                                                Student
                                            </th>

                                            <th>
                                                Outpass ID
                                            </th>

                                            <th>
                                                Exit Time
                                            </th>

                                            <th>
                                                Entry Time
                                            </th>

                                            <th>
                                                Status
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {gateHistory.map(
                                            (log) => (
                                                <tr
                                                    key={
                                                        log._id
                                                    }
                                                >
                                                    <td>
                                                        <strong>
                                                            {log
                                                                .student
                                                                ?.name ||
                                                                "-"}
                                                        </strong>

                                                        <span>
                                                            {log
                                                                .student
                                                                ?.studentId ||
                                                                "-"}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        {log
                                                            .outpass
                                                            ?.outpassId ||
                                                            "-"}
                                                    </td>

                                                    <td>
                                                        {formatDateTime(
                                                            log.exitTime
                                                        )}
                                                    </td>

                                                    <td>
                                                        {formatDateTime(
                                                            log.entryTime
                                                        )}
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`security-history-status ${
                                                                log.status ===
                                                                "returned"
                                                                    ? "returned"
                                                                    : "outside"
                                                            }`}
                                                        >
                                                            {log.status ===
                                                            "returned"
                                                                ? "✓ Returned"
                                                                : "Outside"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <div className="security-footer-note">
                        <Icon
                            name="shield"
                            size={14}
                        />

                        <span>
                            E-Outpass securely records main-gate
                            verification and student entry/exit
                            activity.
                        </span>
                    </div>
                </div>
            </main>

            <nav className="security-mobile-nav">
                <a
                    href="#top"
                    className="active"
                >
                    <Icon
                        name="grid"
                        size={19}
                    />
                    <span>Home</span>
                </a>

                <a href="#verification">
                    <Icon
                        name="qr"
                        size={19}
                    />
                    <span>Verify</span>
                </a>

                <a href="#history">
                    <Icon
                        name="clock"
                        size={19}
                    />
                    <span>History</span>
                </a>

                <a href="#profile">
                    <Icon
                        name="user"
                        size={19}
                    />
                    <span>Profile</span>
                </a>
            </nav>
        </div>
    );
}

export default SecurityDashboard;