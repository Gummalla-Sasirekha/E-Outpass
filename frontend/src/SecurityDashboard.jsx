import { useState } from "react";
import "./SecurityDashboard.css";

const API_URL = import.meta.env.VITE_API_URL;

function SecurityDashboard() {

    const [outpassId, setOutpassId] = useState("");
    const [outpass, setOutpass] = useState(null);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Gate history
    const [gateHistory, setGateHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const token = localStorage.getItem("token");


    // ==========================================
    // DISPLAY QR
    // ==========================================

    const handleDisplayQR = async () => {

        const cleanId = outpassId.trim();

        setError("");
        setSuccess("");
        setOutpass(null);

        if (!cleanId) {

            setError(
                "Please enter an Outpass ID."
            );

            return;
        }


        try {

            setLoading(true);

            const response = await fetch(
                `${API_URL}/api/outpass/validate`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        outpassId: cleanId
                    })
                }
            );


            const data =
                await response.json();


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


            if (
                data.outpass.status !==
                "approved"
            ) {

                throw new Error(
                    `This outpass is ${data.outpass.status}. Only approved outpasses can be displayed at the gate.`
                );
            }


            if (!data.outpass.qrCode) {

                throw new Error(
                    "QR code is not available for this outpass."
                );
            }


            setOutpass(
                data.outpass
            );


            setSuccess(
                "Outpass verified. QR code is ready for the student to scan."
            );


        } catch (error) {

            console.error(
                "Display QR error:",
                error
            );

            setError(
                error.message ||
                "Unable to display QR."
            );

        } finally {

            setLoading(false);
        }
    };


    // ==========================================
    // GATE HISTORY
    // ==========================================

    const fetchGateHistory = async () => {

        try {

            setHistoryLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/api/outpass/gate-history`,
                {
                    method: "GET",

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


        } catch (error) {

            console.error(
                "Gate history error:",
                error
            );

            setError(
                error.message ||
                "Unable to load gate history."
            );

        } finally {

            setHistoryLoading(false);
        }
    };


    // ==========================================
    // LOGOUT
    // ==========================================

    const handleLogout = () => {

        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "user"
        );

        window.location.reload();
    };


    // ==========================================
    // DATE FORMAT
    // ==========================================

    const formatDate = (date) => {

        if (!date) {
            return "-";
        }


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
    // TIME FORMAT
    // ==========================================

    const formatTime = (time) => {

        if (!time) {
            return "-";
        }

        return time;
    };


    // ==========================================
    // GATE HISTORY DATE/TIME
    // ==========================================

    const formatDateTime = (date) => {

        if (!date) {
            return "-";
        }

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
    // UI
    // ==========================================

    return (

        <div className="security-dashboard">


            {/* ==================================
                HEADER
            ================================== */}

            <header className="security-header">

                <div className="security-brand">

                    <div className="security-logo">
                        🚪
                    </div>

                    <div>

                        <h1>
                            E-Outpass
                        </h1>

                        <p>
                            Main Gate Security
                        </p>

                    </div>

                </div>


                <div className="security-header-right">

                    <div className="gate-status">

                        <span className="status-dot"></span>

                        Gate Active

                    </div>


                    <button
                        className="security-logout"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                </div>

            </header>


            {/* ==================================
                MAIN
            ================================== */}

            <main className="security-main">


                {/* ==================================
                    TITLE
                ================================== */}

                <section className="security-title">

                    <div>

                        <p className="security-label">
                            SECURITY PORTAL
                        </p>

                        <h2>
                            Main Gate Verification
                        </h2>

                        <p>
                            Display the approved student's
                            QR code on the Security screen.
                        </p>

                    </div>

                </section>


                {/* ==================================
                    WORKFLOW BANNER
                ================================== */}

                <section className="workflow-banner">

                    <div className="workflow-icon">
                        📱
                    </div>

                    <div>

                        <strong>
                            Student scans the QR
                        </strong>

                        <p>
                            Security only displays the QR.
                            The student scans it using their
                            phone and confirms Exit or Return.
                        </p>

                    </div>

                </section>


                {/* ==================================
                    DISPLAY QR CARD
                ================================== */}

                <section className="display-card">

                    <div className="display-card-header">

                        <div className="display-card-icon">
                            🔐
                        </div>

                        <div>

                            <p className="card-label">
                                GATE VERIFICATION
                            </p>

                            <h2>
                                Display Student QR
                            </h2>

                            <p>
                                Enter the approved Outpass ID
                                to display its secure QR code.
                            </p>

                        </div>

                    </div>


                    {/* ==================================
                        SEARCH FORM
                    ================================== */}

                    <div className="outpass-form">

                        <label>
                            Outpass ID
                        </label>

                        <div className="input-row">

                            <input
                                type="text"
                                value={outpassId}
                                onChange={(e) =>
                                    setOutpassId(
                                        e.target.value
                                    )
                                }
                                onKeyDown={(e) => {

                                    if (
                                        e.key === "Enter"
                                    ) {

                                        handleDisplayQR();

                                    }

                                }}
                                placeholder="Example: OP-1789044128762-464"
                            />


                            <button
                                className="display-button"
                                onClick={
                                    handleDisplayQR
                                }
                                disabled={loading}
                            >

                                {loading
                                    ? "Verifying..."
                                    : "📱 Display QR"
                                }

                            </button>

                        </div>

                    </div>


                    {/* ==================================
                        ERROR
                    ================================== */}

                    {error && (

                        <div className="security-error">

                            <span>
                                ⚠️
                            </span>

                            <p>
                                {error}
                            </p>

                        </div>

                    )}


                    {/* ==================================
                        SUCCESS
                    ================================== */}

                    {success && (

                        <div className="security-success">

                            <span>
                                ✅
                            </span>

                            <p>
                                {success}
                            </p>

                        </div>

                    )}

                </section>


                {/* ==================================
                    VERIFIED OUTPASS
                ================================== */}

                {outpass && (

                    <section className="verified-card">


                        {/* HEADER */}

                        <div className="verified-header">

                            <div>

                                <p className="card-label">
                                    APPROVED OUTPASS
                                </p>

                                <h2>
                                    {outpass.outpassId}
                                </h2>

                            </div>


                            <span className="approved-badge">
                                ✓ APPROVED
                            </span>

                        </div>


                        {/* STUDENT */}

                        <div className="student-section">

                            <div className="student-avatar">
                                🎓
                            </div>

                            <div>

                                <span>
                                    STUDENT
                                </span>

                                <h3>
                                    {outpass.student?.name ||
                                        "Unknown Student"}
                                </h3>

                                <p>
                                    ID:{" "}
                                    {outpass.student?.studentId ||
                                        "-"}
                                    {" • "}
                                    {outpass.student?.course ||
                                        "-"}
                                </p>

                            </div>

                        </div>


                        {/* DETAILS */}

                        <div className="details-grid">

                            <div className="detail-item">

                                <span>
                                    📍 Place of Visit
                                </span>

                                <strong>
                                    {outpass.placeOfVisit ||
                                        "-"}
                                </strong>

                            </div>


                            <div className="detail-item">

                                <span>
                                    📝 Reason
                                </span>

                                <strong>
                                    {outpass.reason ||
                                        "-"}
                                </strong>

                            </div>


                            <div className="detail-item">

                                <span>
                                    📅 Date
                                </span>

                                <strong>
                                    {formatDate(
                                        outpass.dateRequestedFor
                                    )}
                                </strong>

                            </div>


                            <div className="detail-item">

                                <span>
                                    🚪 Leaving Time
                                </span>

                                <strong>
                                    {formatTime(
                                        outpass.timeOfLeaving
                                    )}
                                </strong>

                            </div>


                            <div className="detail-item">

                                <span>
                                    🏠 Expected In
                                </span>

                                <strong>
                                    {formatTime(
                                        outpass.expectedInTime
                                    )}
                                </strong>

                            </div>


                            <div className="detail-item">

                                <span>
                                    📊 Status
                                </span>

                                <strong className="approved-text">
                                    APPROVED
                                </strong>

                            </div>

                        </div>


                        {/* ==================================
                            LARGE QR
                        ================================== */}

                        <div className="gate-qr-section">

                            <div className="qr-heading">

                                <p>
                                    MAIN GATE QR
                                </p>

                                <h2>
                                    Student Scan Here
                                </h2>

                                <span>
                                    Ask the student to scan
                                    this QR using their phone.
                                </span>

                            </div>


                            <div className="qr-wrapper">

                                <img
                                    src={
                                        outpass.qrCode
                                    }
                                    alt="Main Gate QR Code"
                                    className="gate-qr"
                                />

                            </div>


                            <div className="scan-instruction">

                                <span className="instruction-icon">
                                    📱
                                </span>

                                <div>

                                    <strong>
                                        Student Action
                                    </strong>

                                    <p>
                                        Scan this QR → confirm
                                        the action on your phone.
                                    </p>

                                </div>

                            </div>

                        </div>


                        {/* ==================================
                            GATE FLOW
                        ================================== */}

                        <div className="gate-flow">

                            <div className="flow-step active">

                                <div className="flow-number">
                                    1
                                </div>

                                <div>

                                    <strong>
                                        Display QR
                                    </strong>

                                    <p>
                                        Security displays
                                        this QR.
                                    </p>

                                </div>

                            </div>


                            <div className="flow-line"></div>


                            <div className="flow-step">

                                <div className="flow-number">
                                    2
                                </div>

                                <div>

                                    <strong>
                                        Student Scans
                                    </strong>

                                    <p>
                                        Student scans
                                        the QR.
                                    </p>

                                </div>

                            </div>


                            <div className="flow-line"></div>


                            <div className="flow-step">

                                <div className="flow-number">
                                    3
                                </div>

                                <div>

                                    <strong>
                                        Confirm
                                    </strong>

                                    <p>
                                        Student confirms
                                        Exit or Return.
                                    </p>

                                </div>

                            </div>

                        </div>


                    </section>

                )}


                {/* ==================================
                    GATE HISTORY
                ================================== */}

                <section className="gate-history-card">

                    <div className="history-header">

                        <div>

                            <p className="card-label">
                                GATE RECORDS
                            </p>

                            <h2>
                                Gate History
                            </h2>

                            <p>
                                View student exit and return
                                records.
                            </p>

                        </div>


                        <button
                            className="history-refresh-button"
                            onClick={fetchGateHistory}
                            disabled={historyLoading}
                        >

                            {historyLoading
                                ? "Loading..."
                                : "🔄 Refresh"
                            }

                        </button>

                    </div>


                    {/* EMPTY HISTORY */}

                    {gateHistory.length === 0 &&
                        !historyLoading && (

                            <div className="history-empty">

                                <div className="empty-icon">
                                    📋
                                </div>

                                <h3>
                                    No gate records yet
                                </h3>

                                <p>
                                    Exit and return records
                                    will appear here after
                                    students use their QR
                                    outpass.
                                </p>

                            </div>

                        )}


                    {/* HISTORY TABLE */}

                    {gateHistory.length > 0 && (

                        <div className="history-table-wrapper">

                            <table className="history-table">

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

                                                {/* STUDENT */}

                                                <td>

                                                    <strong>
                                                        {
                                                            log.student?.name ||
                                                            "-"
                                                        }
                                                    </strong>

                                                    <span className="history-subtext">
                                                        {
                                                            log.student?.studentId ||
                                                            "-"
                                                        }
                                                    </span>

                                                </td>


                                                {/* OUTPASS */}

                                                <td>
                                                    {
                                                        log.outpass?.outpassId ||
                                                        "-"
                                                    }
                                                </td>


                                                {/* EXIT */}

                                                <td>
                                                    {
                                                        formatDateTime(
                                                            log.exitTime
                                                        )
                                                    }
                                                </td>


                                                {/* ENTRY */}

                                                <td>
                                                    {
                                                        formatDateTime(
                                                            log.entryTime
                                                        )
                                                    }
                                                </td>


                                                {/* STATUS */}

                                                <td>

                                                    <span
                                                        className={
                                                            log.status ===
                                                            "returned"
                                                                ? "history-status returned"
                                                                : "history-status outside"
                                                        }
                                                    >

                                                        {log.status ===
                                                        "returned"
                                                            ? "✓ Returned"
                                                            : "🚪 Outside"
                                                        }

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


                {/* ==================================
                    EMPTY STATE
                ================================== */}

                {!outpass && !error && (

                    <section className="security-empty">

                        <div className="empty-icon">
                            📱
                        </div>

                        <h3>
                            Waiting for an approved outpass
                        </h3>

                        <p>
                            Enter the Outpass ID above to
                            display the student's QR code.
                        </p>

                    </section>

                )}


                {/* ==================================
                    INSTRUCTIONS
                ================================== */}

                <section className="security-instructions">

                    <div className="instructions-header">

                        <div className="instructions-icon">
                            ℹ️
                        </div>

                        <div>

                            <p>
                                MAIN GATE WORKFLOW
                            </p>

                            <h2>
                                How QR Verification Works
                            </h2>

                        </div>

                    </div>


                    <div className="instruction-grid">


                        <div className="instruction-card">

                            <div className="instruction-number">
                                1
                            </div>

                            <div>

                                <strong>
                                    Verify Outpass
                                </strong>

                                <p>
                                    Enter the approved
                                    Outpass ID.
                                </p>

                            </div>

                        </div>


                        <div className="instruction-card">

                            <div className="instruction-number">
                                2
                            </div>

                            <div>

                                <strong>
                                    Display QR
                                </strong>

                                <p>
                                    Display the QR on
                                    the Security screen.
                                </p>

                            </div>

                        </div>


                        <div className="instruction-card">

                            <div className="instruction-number">
                                3
                            </div>

                            <div>

                                <strong>
                                    Student Scans
                                </strong>

                                <p>
                                    Student scans the
                                    displayed QR.
                                </p>

                            </div>

                        </div>


                        <div className="instruction-card">

                            <div className="instruction-number">
                                4
                            </div>

                            <div>

                                <strong>
                                    Student Confirms
                                </strong>

                                <p>
                                    Student confirms
                                    Exit or Return.
                                </p>

                            </div>

                        </div>


                    </div>

                </section>


            </main>

        </div>
    );
}

export default SecurityDashboard;