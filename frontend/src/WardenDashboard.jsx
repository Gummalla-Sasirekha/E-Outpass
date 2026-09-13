import { useEffect, useState } from "react";
import "./WardenDashboard.css";

const API_URL = import.meta.env.VITE_API_URL;

function WardenDashboard() {
    const [outpasses, setOutpasses] = useState([]);
    const [allOutpasses, setAllOutpasses] = useState([]);
    const [gateHistory, setGateHistory] = useState([]);

    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] =
        useState(true);
    const [historyDataLoading, setHistoryDataLoading] =
        useState(true);

    const [error, setError] = useState("");

    const [selectedStatus, setSelectedStatus] =
        useState("pending");

    const [showRejectModal, setShowRejectModal] =
        useState(false);

    const [selectedOutpass, setSelectedOutpass] =
        useState(null);

    const [rejectionReason, setRejectionReason] =
        useState("");

    const [actionLoading, setActionLoading] =
        useState(false);

    const token = localStorage.getItem("token");

    const user = JSON.parse(
        localStorage.getItem("user") || "null"
    );


    // ==========================================
    // FETCH PENDING OUTPASSES
    // ==========================================

    const fetchPendingOutpasses = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/api/outpass/pending`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to fetch pending requests."
                );
            }

            setOutpasses(
                data.outpasses || []
            );

        } catch (err) {
            console.error(
                "Fetch pending outpasses error:",
                err
            );

            setError(
                err.message ||
                "Unable to connect to server."
            );

        } finally {
            setLoading(false);
        }
    };


    // ==========================================
    // FETCH ALL WARDEN OUTPASS HISTORY
    // ==========================================

    const fetchAllOutpasses = async () => {
        try {
            setHistoryDataLoading(true);

            const response = await fetch(
                `${API_URL}/api/outpass/warden-history`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to fetch outpass history."
                );
            }

            setAllOutpasses(
                data.outpasses || []
            );

        } catch (err) {
            console.error(
                "Fetch warden history error:",
                err
            );

            setError(
                err.message ||
                "Unable to load outpass history."
            );

        } finally {
            setHistoryDataLoading(false);
        }
    };


    // ==========================================
    // FETCH GATE HISTORY
    // ==========================================

    const fetchGateHistory = async () => {
        try {
            setHistoryLoading(true);

            const response = await fetch(
                `${API_URL}/api/outpass/gate-history`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to fetch gate history."
                );
            }

            setGateHistory(
                data.gateLogs || []
            );

        } catch (err) {
            console.error(
                "Fetch gate history error:",
                err
            );

            setError(
                err.message ||
                "Unable to fetch gate history."
            );

        } finally {
            setHistoryLoading(false);
        }
    };


    // ==========================================
    // INITIAL LOAD
    // ==========================================

    useEffect(() => {
        fetchPendingOutpasses();
        fetchAllOutpasses();
        fetchGateHistory();
    }, []);


    // ==========================================
    // REFRESH EVERYTHING
    // ==========================================

    const refreshDashboard = () => {
        fetchPendingOutpasses();
        fetchAllOutpasses();
        fetchGateHistory();
    };


    // ==========================================
    // APPROVE OUTPASS
    // ==========================================

    const approveOutpass = async (outpassId) => {
        try {
            setActionLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/api/outpass/${outpassId}/approve`,
                {
                    method: "PATCH",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to approve outpass."
                );
            }


            // Remove from pending list
            setOutpasses((previous) =>
                previous.filter(
                    (outpass) =>
                        outpass.outpassId !==
                        outpassId
                )
            );


            // Refresh complete history
            await fetchAllOutpasses();

        } catch (err) {
            console.error(
                "Approve error:",
                err
            );

            setError(
                err.message ||
                "Unable to approve outpass."
            );

        } finally {
            setActionLoading(false);
        }
    };


    // ==========================================
    // OPEN REJECT MODAL
    // ==========================================

    const openRejectModal = (outpass) => {
        setSelectedOutpass(outpass);
        setRejectionReason("");
        setShowRejectModal(true);
        setError("");
    };


    // ==========================================
    // CLOSE REJECT MODAL
    // ==========================================

    const closeRejectModal = () => {
        if (actionLoading) return;

        setShowRejectModal(false);
        setSelectedOutpass(null);
        setRejectionReason("");
    };


    // ==========================================
    // REJECT OUTPASS
    // ==========================================

    const rejectOutpass = async () => {
        if (!selectedOutpass) {
            return;
        }

        if (!rejectionReason.trim()) {
            setError(
                "Please enter a rejection reason."
            );

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
                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        rejectionReason:
                            rejectionReason.trim()
                    })
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to reject outpass."
                );
            }


            // Remove from pending
            setOutpasses((previous) =>
                previous.filter(
                    (outpass) =>
                        outpass.outpassId !==
                        selectedOutpass.outpassId
                )
            );


            // Refresh history
            await fetchAllOutpasses();


            // Close modal
            setShowRejectModal(false);
            setSelectedOutpass(null);
            setRejectionReason("");

        } catch (err) {
            console.error(
                "Reject error:",
                err
            );

            setError(
                err.message ||
                "Unable to reject outpass."
            );

        } finally {
            setActionLoading(false);
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
    // FORMAT DATE
    // ==========================================

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date)
            .toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );
    };


    // ==========================================
    // FORMAT DATE + TIME
    // ==========================================

    const formatDateTime = (date) => {
        if (!date) return "-";

        return new Date(date)
            .toLocaleString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );
    };


    // ==========================================
    // GET STATUS COUNTS
    // ==========================================

    const pendingCount =
        allOutpasses.filter(
            (outpass) =>
                outpass.status === "pending"
        ).length;

    const approvedCount =
        allOutpasses.filter(
            (outpass) =>
                outpass.status === "approved"
        ).length;

    const rejectedCount =
        allOutpasses.filter(
            (outpass) =>
                outpass.status === "rejected"
        ).length;

    const completedCount =
        allOutpasses.filter(
            (outpass) =>
                outpass.status === "completed"
        ).length;


    // ==========================================
    // STATUS CARD CONFIGURATION
    // ==========================================

    const statusCards = [
        {
            status: "pending",
            title: "Pending",
            count: pendingCount,
            description:
                "Awaiting approval"
        },

        {
            status: "approved",
            title: "Approved",
            count: approvedCount,
            description:
                "Approved outpasses"
        },

        {
            status: "rejected",
            title: "Rejected",
            count: rejectedCount,
            description:
                "Rejected requests"
        },

        {
            status: "completed",
            title: "Completed",
            count: completedCount,
            description:
                "Returned students"
        }
    ];


    // ==========================================
    // FILTER OUTPASSES
    // ==========================================

    const filteredOutpasses =
        allOutpasses.filter(
            (outpass) =>
                outpass.status ===
                selectedStatus
        );


    // ==========================================
    // FIND GATE LOG
    // ==========================================

    const getGateLogForOutpass = (
        outpassId
    ) => {
        return gateHistory.find(
            (log) =>
                log.outpass?.outpassId ===
                outpassId
        );
    };


    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div className="warden-loading">

                <div className="warden-spinner"></div>

                <p>
                    Loading pending requests...
                </p>

            </div>
        );
    }


    // ==========================================
    // DASHBOARD
    // ==========================================

    return (
        <div className="warden-dashboard">


            {/* ======================================
                HEADER
            ====================================== */}

            <header className="warden-header">

                <div className="warden-brand">

                    <div className="warden-logo">
                        🏫
                    </div>

                    <div>

                        <h1>
                            E-Outpass
                        </h1>

                        <p>
                            Warden Portal
                        </p>

                    </div>

                </div>


                <button
                    onClick={handleLogout}
                    className="warden-logout"
                >
                    Logout
                </button>

            </header>


            {/* ======================================
                MAIN
            ====================================== */}

            <main className="warden-main">


                {/* ==================================
                    PAGE TITLE
                ================================== */}

                <section className="warden-title">

                    <div>

                        <p className="warden-label">
                            WARDEN DASHBOARD
                        </p>

                        <h2>
                            {user?.hostelName ||
                                "Hostel"}{" "}
                            Requests
                        </h2>

                        <p>
                            Review and manage student
                            outpass requests.
                        </p>

                    </div>


                    <button
                        onClick={
                            refreshDashboard
                        }
                        className="warden-refresh"
                    >
                        ↻ Refresh
                    </button>

                </section>


                {/* ==================================
                    ERROR
                ================================== */}

                {error && (
                    <div className="warden-error">
                        ⚠️ {error}
                    </div>
                )}


                {/* ==================================
                    STATUS CARDS
                ================================== */}

                <section className="warden-status-grid">

                    {statusCards.map(
                        (card) => (

                            <button
                                key={
                                    card.status
                                }
                                type="button"
                                className={`warden-status-card ${
                                    selectedStatus ===
                                    card.status
                                        ? "active"
                                        : ""
                                } status-${card.status}`}
                                onClick={() =>
                                    setSelectedStatus(
                                        card.status
                                    )
                                }
                            >

                                <div className="status-card-count">
                                    {historyDataLoading
                                        ? "—"
                                        : card.count}
                                </div>


                                <div className="status-card-title">
                                    {card.title}
                                </div>


                                <div className="status-card-description">
                                    {card.description}
                                </div>

                            </button>

                        )
                    )}

                </section>


                {/* ==================================
                    SELECTED STATUS OUTPASSES
                ================================== */}

                <section className="warden-requests">

                    <div className="warden-section-header">

                        <div>

                            <p className="warden-label">
                                OUTPASS MANAGEMENT
                            </p>

                            <h2>
                                {selectedStatus ===
                                    "pending" &&
                                    "Pending Outpasses"}

                                {selectedStatus ===
                                    "approved" &&
                                    "Approved Outpasses"}

                                {selectedStatus ===
                                    "rejected" &&
                                    "Rejected Outpasses"}

                                {selectedStatus ===
                                    "completed" &&
                                    "Completed Outpasses"}
                            </h2>

                            <p>
                                {selectedStatus ===
                                    "pending" &&
                                    "Requests awaiting your approval."}

                                {selectedStatus ===
                                    "approved" &&
                                    "Outpasses approved by you."}

                                {selectedStatus ===
                                    "rejected" &&
                                    "Outpasses rejected by you."}

                                {selectedStatus ===
                                    "completed" &&
                                    "Students who have completed their outing."}
                            </p>

                        </div>


                        <span className="request-count">
                            {filteredOutpasses.length}
                        </span>

                    </div>


                    {/* ==================================
                        HISTORY LOADING
                    ================================== */}

                    {historyDataLoading ? (

                        <div className="warden-empty">

                            <div>
                                🔄
                            </div>

                            <h3>
                                Loading outpasses...
                            </h3>

                            <p>
                                Fetching outpass records.
                            </p>

                        </div>

                    ) : filteredOutpasses.length ===
                      0 ? (

                        <div className="warden-empty">

                            <div>
                                {selectedStatus ===
                                "pending"
                                    ? "✅"
                                    : selectedStatus ===
                                      "approved"
                                    ? "✓"
                                    : selectedStatus ===
                                      "rejected"
                                    ? "✕"
                                    : "↩"}
                            </div>

                            <h3>
                                No{" "}
                                {selectedStatus}{" "}
                                outpasses
                            </h3>

                            <p>
                                There are no records in
                                this category.
                            </p>

                        </div>

                    ) : (

                        <div className="warden-request-list">

                            {filteredOutpasses.map(
                                (outpass) => {

                                    const gateLog =
                                        getGateLogForOutpass(
                                            outpass.outpassId
                                        );

                                    return (

                                        <article
                                            className={`warden-request-card status-record-${outpass.status}`}
                                            key={
                                                outpass.outpassId
                                            }
                                        >


                                            {/* ==================================
                                                CARD HEADER
                                            ================================== */}

                                            <div className="request-card-header">

                                                <div>

                                                    <span>
                                                        OUTPASS ID
                                                    </span>

                                                    <h3>
                                                        {
                                                            outpass.outpassId
                                                        }
                                                    </h3>

                                                </div>


                                                <span
                                                    className={`status-record-badge status-badge-${outpass.status}`}
                                                >

                                                    {outpass.status ===
                                                        "pending" &&
                                                        "PENDING"}

                                                    {outpass.status ===
                                                        "approved" &&
                                                        "✓ APPROVED"}

                                                    {outpass.status ===
                                                        "rejected" &&
                                                        "✕ REJECTED"}

                                                    {outpass.status ===
                                                        "completed" &&
                                                        "↩ COMPLETED"}

                                                </span>

                                            </div>


                                            {/* ==================================
                                                STUDENT
                                            ================================== */}

                                            <div className="request-student">

                                                <div className="student-avatar">
                                                    🎓
                                                </div>

                                                <div>

                                                    <span>
                                                        STUDENT
                                                    </span>

                                                    <h3>
                                                        {
                                                            outpass.student?.name ||
                                                            "Unknown Student"
                                                        }
                                                    </h3>

                                                    <p>
                                                        ID:{" "}
                                                        {
                                                            outpass.student?.studentId ||
                                                            "-"
                                                        }

                                                        {" • "}

                                                        {
                                                            outpass.student?.course ||
                                                            "-"
                                                        }
                                                    </p>

                                                </div>

                                            </div>


                                            {/* ==================================
                                                DETAILS
                                            ================================== */}

                                            <div className="request-details">

                                                <div>

                                                    <span>
                                                        📍 Place
                                                    </span>

                                                    <strong>
                                                        {
                                                            outpass.placeOfVisit ||
                                                            "-"
                                                        }
                                                    </strong>

                                                </div>


                                                <div>

                                                    <span>
                                                        📝 Reason
                                                    </span>

                                                    <strong>
                                                        {
                                                            outpass.reason ||
                                                            "-"
                                                        }
                                                    </strong>

                                                </div>


                                                <div>

                                                    <span>
                                                        📅 Date
                                                    </span>

                                                    <strong>
                                                        {formatDate(
                                                            outpass.dateRequestedFor
                                                        )}
                                                    </strong>

                                                </div>


                                                <div>

                                                    <span>
                                                        🚪 Leaving
                                                    </span>

                                                    <strong>
                                                        {
                                                            outpass.timeOfLeaving ||
                                                            "-"
                                                        }
                                                    </strong>

                                                </div>


                                                <div>

                                                    <span>
                                                        🏠 Expected In
                                                    </span>

                                                    <strong>
                                                        {
                                                            outpass.expectedInTime ||
                                                            "-"
                                                        }
                                                    </strong>

                                                </div>

                                            </div>


                                            {/* ==================================
                                                APPROVED DETAILS
                                            ================================== */}

                                            {outpass.status ===
                                                "approved" && (

                                                <div className="status-extra-info">

                                                    <div>

                                                        <span>
                                                            ✓ Approved On
                                                        </span>

                                                        <strong>
                                                            {formatDateTime(
                                                                outpass.approvedAt
                                                            )}
                                                        </strong>

                                                    </div>

                                                    <div>

                                                        <span>
                                                            🔐 QR Status
                                                        </span>

                                                        <strong>
                                                            {outpass.qrCode
                                                                ? "Generated"
                                                                : "Not Available"}
                                                        </strong>

                                                    </div>

                                                </div>

                                            )}


                                            {/* ==================================
                                                REJECTED DETAILS
                                            ================================== */}

                                            {outpass.status ===
                                                "rejected" && (

                                                <div className="rejection-info">

                                                    <span>
                                                        ⚠️ Rejection Reason
                                                    </span>

                                                    <p>
                                                        {
                                                            outpass.rejectionReason ||
                                                            "No reason provided."
                                                        }
                                                    </p>

                                                </div>

                                            )}


                                            {/* ==================================
                                                COMPLETED DETAILS
                                            ================================== */}

                                            {outpass.status ===
                                                "completed" && (

                                                <div className="status-extra-info">

                                                    <div>

                                                        <span>
                                                            🚪 Exit Time
                                                        </span>

                                                        <strong>
                                                            {formatDateTime(
                                                                gateLog?.exitTime
                                                            )}
                                                        </strong>

                                                    </div>


                                                    <div>

                                                        <span>
                                                            🏫 Entry Time
                                                        </span>

                                                        <strong>
                                                            {formatDateTime(
                                                                gateLog?.entryTime
                                                            )}
                                                        </strong>

                                                    </div>

                                                </div>

                                            )}


                                            {/* ==================================
                                                PENDING ACTIONS
                                            ================================== */}

                                            {outpass.status ===
                                                "pending" && (

                                                <div className="request-actions">

                                                    <button
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
                                                        ✓ Approve
                                                    </button>


                                                    <button
                                                        className="reject-button"
                                                        onClick={() =>
                                                            openRejectModal(
                                                                outpass
                                                            )
                                                        }
                                                        disabled={
                                                            actionLoading
                                                        }
                                                    >
                                                        ✕ Reject
                                                    </button>

                                                </div>

                                            )}

                                        </article>
                                    );
                                }
                            )}

                        </div>

                    )}

                </section>


                {/* ==================================
                    GATE HISTORY
                ================================== */}

                <section
                    className="warden-requests"
                    style={{
                        marginTop: "40px"
                    }}
                >

                    <div className="warden-section-header">

                        <div>

                            <h2>
                                Gate History
                            </h2>

                            <p>
                                Student exit and entry
                                records for your hostel.
                            </p>

                        </div>


                        <span className="request-count">
                            {gateHistory.length}
                        </span>

                    </div>


                    {historyLoading ? (

                        <div className="warden-empty">

                            <div>
                                🔄
                            </div>

                            <h3>
                                Loading gate history...
                            </h3>

                            <p>
                                Fetching student movement
                                records.
                            </p>

                        </div>

                    ) : gateHistory.length ===
                      0 ? (

                        <div className="warden-empty">

                            <div>
                                🚪
                            </div>

                            <h3>
                                No gate records yet
                            </h3>

                            <p>
                                Student movement records
                                will appear here after
                                gate verification.
                            </p>

                        </div>

                    ) : (

                        <div className="warden-request-list">

                            {gateHistory.map(
                                (log) => {

                                    const returned =
                                        log.status ===
                                        "returned";

                                    return (

                                        <article
                                            key={log._id}
                                            className="warden-request-card"
                                        >

                                            {/* HISTORY HEADER */}

                                            <div className="request-card-header">

                                                <div>

                                                    <span>
                                                        OUTPASS ID
                                                    </span>

                                                    <h3>
                                                        {
                                                            log.outpass?.outpassId ||
                                                            "-"
                                                        }
                                                    </h3>

                                                </div>


                                                <span className="pending-badge">

                                                    {returned
                                                        ? "✓ RETURNED"
                                                        : "↗ OUTSIDE"}

                                                </span>

                                            </div>


                                            {/* STUDENT */}

                                            <div className="request-student">

                                                <div className="student-avatar">
                                                    🎓
                                                </div>

                                                <div>

                                                    <span>
                                                        STUDENT
                                                    </span>

                                                    <h3>
                                                        {
                                                            log.student?.name ||
                                                            "Unknown Student"
                                                        }
                                                    </h3>

                                                    <p>
                                                        ID:{" "}
                                                        {
                                                            log.student?.studentId ||
                                                            "-"
                                                        }

                                                        {" • "}

                                                        {
                                                            log.student?.course ||
                                                            "-"
                                                        }
                                                    </p>

                                                </div>

                                            </div>


                                            {/* MOVEMENT DETAILS */}

                                            <div className="request-details">

                                                <div>

                                                    <span>
                                                        🏠 Room
                                                    </span>

                                                    <strong>
                                                        {
                                                            log.student?.roomNumber ||
                                                            "-"
                                                        }
                                                    </strong>

                                                </div>


                                                <div>

                                                    <span>
                                                        📍 Place
                                                    </span>

                                                    <strong>
                                                        {
                                                            log.outpass?.placeOfVisit ||
                                                            "-"
                                                        }
                                                    </strong>

                                                </div>


                                                <div>

                                                    <span>
                                                        🚪 Exit Time
                                                    </span>

                                                    <strong>
                                                        {formatDateTime(
                                                            log.exitTime
                                                        )}
                                                    </strong>

                                                </div>


                                                <div>

                                                    <span>
                                                        🏫 Entry Time
                                                    </span>

                                                    <strong>
                                                        {formatDateTime(
                                                            log.entryTime
                                                        )}
                                                    </strong>

                                                </div>

                                            </div>


                                            {/* SECURITY */}

                                            <div
                                                style={{
                                                    padding:
                                                        "14px 20px",

                                                    borderTop:
                                                        "1px solid #eef2f7",

                                                    display:
                                                        "flex",

                                                    justifyContent:
                                                        "space-between",

                                                    gap:
                                                        "10px",

                                                    fontSize:
                                                        "13px"
                                                }}
                                            >

                                                <span>
                                                    Verified by Security
                                                </span>

                                                <strong>
                                                    {
                                                        log.security?.name ||
                                                        "-"
                                                    }
                                                </strong>

                                            </div>

                                        </article>
                                    );
                                }
                            )}

                        </div>

                    )}

                </section>

            </main>


            {/* ======================================
                REJECTION MODAL
            ====================================== */}

            {showRejectModal && (

                <div
                    className="reject-modal-overlay"
                    onClick={
                        closeRejectModal
                    }
                >

                    <div
                        className="reject-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="reject-modal-header">

                            <div>

                                <span>
                                    REJECT OUTPASS
                                </span>

                                <h2>
                                    Reject Request
                                </h2>

                            </div>


                            <button
                                className="close-modal"
                                onClick={
                                    closeRejectModal
                                }
                            >
                                ×
                            </button>

                        </div>


                        <p className="reject-modal-description">

                            Please provide a reason for
                            rejecting this outpass request.

                        </p>


                        <div className="reject-input-group">

                            <label>
                                Rejection Reason
                            </label>

                            <textarea
                                value={
                                    rejectionReason
                                }
                                onChange={(e) =>
                                    setRejectionReason(
                                        e.target.value
                                    )
                                }
                                placeholder="Enter the reason..."
                            />

                        </div>


                        <div className="reject-modal-actions">

                            <button
                                className="cancel-reject"
                                onClick={
                                    closeRejectModal
                                }
                                disabled={
                                    actionLoading
                                }
                            >
                                Cancel
                            </button>


                            <button
                                className="confirm-reject"
                                onClick={
                                    rejectOutpass
                                }
                                disabled={
                                    actionLoading
                                }
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