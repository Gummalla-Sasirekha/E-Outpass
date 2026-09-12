import { useEffect, useState } from "react";
import "./WardenDashboard.css";

const API_URL = import.meta.env.VITE_API_URL;

function WardenDashboard() {
    const [outpasses, setOutpasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedOutpass, setSelectedOutpass] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const token = localStorage.getItem("token");
    const user = JSON.parse(
        localStorage.getItem("user") || "null"
    );

    const fetchPendingOutpasses = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/api/outpass/pending`,
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

    useEffect(() => {
        fetchPendingOutpasses();
    }, []);

    const approveOutpass = async (outpassId) => {
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
                throw new Error(
                    data.message ||
                    "Unable to approve outpass."
                );
            }

            setOutpasses((previous) =>
                previous.filter(
                    (outpass) =>
                        outpass.outpassId !==
                        outpassId
                )
            );

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

    const openRejectModal = (outpass) => {
        setSelectedOutpass(outpass);
        setRejectionReason("");
        setShowRejectModal(true);
        setError("");
    };

    const closeRejectModal = () => {
        if (actionLoading) return;

        setShowRejectModal(false);
        setSelectedOutpass(null);
        setRejectionReason("");
    };

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
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        rejectionReason:
                            rejectionReason.trim()
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to reject outpass."
                );
            }

            setOutpasses((previous) =>
                previous.filter(
                    (outpass) =>
                        outpass.outpassId !==
                        selectedOutpass.outpassId
                )
            );

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

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.reload();
    };

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    };

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

    return (
        <div className="warden-dashboard">

            {/* HEADER */}

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
                    className="warden-logout"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </header>


            {/* MAIN */}

            <main className="warden-main">

                {/* TITLE */}

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
                        className="warden-refresh"
                        onClick={
                            fetchPendingOutpasses
                        }
                    >
                        ↻ Refresh
                    </button>

                </section>


                {/* ERROR */}

                {error && (
                    <div className="warden-error">
                        ⚠️ {error}
                    </div>
                )}


                {/* STAT */}

                <section className="warden-stat">

                    <div className="warden-stat-icon">
                        📋
                    </div>

                    <div>

                        <span>
                            Pending Requests
                        </span>

                        <strong>
                            {outpasses.length}
                        </strong>

                    </div>

                </section>


                {/* REQUESTS */}

                <section className="warden-requests">

                    <div className="warden-section-header">

                        <div>

                            <h2>
                                Pending Outpasses
                            </h2>

                            <p>
                                Requests awaiting
                                your approval.
                            </p>

                        </div>

                        <div className="request-count">
                            {outpasses.length}
                        </div>

                    </div>


                    {outpasses.length === 0 ? (

                        <div className="warden-empty">

                            <div>
                                ✅
                            </div>

                            <h3>
                                No pending requests
                            </h3>

                            <p>
                                You're all caught up!
                            </p>

                        </div>

                    ) : (

                        <div className="warden-request-list">

                            {outpasses.map(
                                (outpass) => (

                                    <article
                                        className="warden-request-card"
                                        key={
                                            outpass.outpassId
                                        }
                                    >

                                        {/* CARD HEADER */}

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

                                            <span className="pending-badge">
                                                PENDING
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


                                        {/* DETAILS */}

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


                                        {/* ACTIONS */}

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

                                    </article>

                                )
                            )}

                        </div>

                    )}

                </section>

            </main>


            {/* REJECTION MODAL */}

            {showRejectModal && (

                <div
                    className="reject-modal-overlay"
                    onClick={closeRejectModal}
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