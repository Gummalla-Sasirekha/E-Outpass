import { useEffect, useState } from "react";
import "./StudentDashboard.css";

const API_URL = import.meta.env.VITE_API_URL;

function StudentDashboard() {
    const [student, setStudent] = useState(null);
    const [outpasses, setOutpasses] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [gateOutpassId, setGateOutpassId] =
        useState(null);

    const [gateAction, setGateAction] =
        useState(null);

    const [gateLoading, setGateLoading] =
        useState(false);

    const [gateMessage, setGateMessage] =
        useState("");

    const [gateError, setGateError] =
        useState("");

    const token = localStorage.getItem("token");


    // ==========================================
    // GET OUTPASS ID FROM SECURITY QR URL
    // ==========================================

    const getGateOutpassId = () => {
        const path =
            window.location.pathname;

        const match =
            path.match(/^\/gate\/(.+)$/);

        if (!match) {
            return null;
        }

        try {
            return decodeURIComponent(
                match[1]
            );
        } catch {
            return match[1];
        }
    };


    // ==========================================
    // FETCH STUDENT DATA
    // ==========================================

    const fetchStudentData = async () => {
        try {
            setLoading(true);
            setError("");

            if (!token) {
                throw new Error(
                    "Please login again."
                );
            }


            // ------------------------------------------
            // GET STUDENT PROFILE
            // ------------------------------------------

            const profileResponse =
                await fetch(
                    `${API_URL}/api/student/me`,
                    {
                        method: "GET",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            const profileData =
                await profileResponse.json();

            if (!profileResponse.ok) {
                throw new Error(
                    profileData.message ||
                    "Failed to load student profile."
                );
            }


            // ------------------------------------------
            // GET STUDENT OUTPASSES
            // ------------------------------------------

            const outpassResponse =
                await fetch(
                    `${API_URL}/api/student/outpasses`,
                    {
                        method: "GET",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            const outpassData =
                await outpassResponse.json();

            if (!outpassResponse.ok) {
                throw new Error(
                    outpassData.message ||
                    "Failed to load outpasses."
                );
            }


            setStudent(
                profileData.student
            );

            setOutpasses(
                outpassData.outpasses || []
            );

        } catch (error) {

            console.error(
                "Student dashboard error:",
                error
            );

            setError(
                error.message ||
                "Unable to load student dashboard."
            );

        } finally {
            setLoading(false);
        }
    };


    // ==========================================
    // CHECK QR URL
    // ==========================================

    useEffect(() => {

        const scannedOutpassId =
            getGateOutpassId();

        if (scannedOutpassId) {
            setGateOutpassId(
                scannedOutpassId
            );
        }

    }, []);


    // ==========================================
    // LOAD DATA
    // ==========================================

    useEffect(() => {
        fetchStudentData();
    }, []);


    // ==========================================
    // DETERMINE GATE ACTION
    // ==========================================

    useEffect(() => {

        if (
            !gateOutpassId ||
            !token
        ) {
            return;
        }

        const determineGateAction =
            async () => {

                try {

                    setGateError("");
                    setGateMessage("");

                    /*
                     * We use the current student
                     * outpass information to
                     * identify the request.
                     *
                     * The backend decides whether
                     * the confirmation is EXIT or
                     * RETURN.
                     */

                    const matchingOutpass =
                        outpasses.find(
                            (outpass) =>
                                outpass.outpassId ===
                                gateOutpassId
                        );

                    if (
                        matchingOutpass &&
                        matchingOutpass.status ===
                            "completed"
                    ) {

                        setGateAction(
                            "completed"
                        );

                        return;
                    }

                    /*
                     * Approved outpass with no
                     * completed status starts with
                     * EXIT.
                     *
                     * After the first confirmation,
                     * the page is refreshed and the
                     * backend state determines the
                     * next action.
                     */

                    setGateAction("exit");

                } catch (error) {

                    console.error(
                        "Gate action error:",
                        error
                    );

                    setGateError(
                        "Unable to verify gate action."
                    );
                }
            };

        determineGateAction();

    }, [
        gateOutpassId,
        outpasses,
        token
    ]);


    // ==========================================
    // CONFIRM GATE ACTION
    // ==========================================

    const confirmGateAction =
        async () => {

            if (!gateOutpassId) {
                return;
            }

            try {

                setGateLoading(true);

                setGateError("");
                setGateMessage("");

                const response =
                    await fetch(
                        `${API_URL}/api/outpass/student-confirm`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`
                            },

                            body: JSON.stringify({
                                outpassId:
                                    gateOutpassId
                            })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Unable to confirm gate action."
                    );
                }


                // ----------------------------------
                // EXIT CONFIRMED
                // ----------------------------------

                if (
                    data.action ===
                    "exit"
                ) {

                    setGateAction(
                        "outside"
                    );

                    setGateMessage(
                        "Exit confirmed successfully. Have a safe trip! 🚪"
                    );

                    await fetchStudentData();

                    return;
                }


                // ----------------------------------
                // RETURN CONFIRMED
                // ----------------------------------

                if (
                    data.action ===
                    "return"
                ) {

                    setGateAction(
                        "completed"
                    );

                    setGateMessage(
                        "Return confirmed successfully. Welcome back! 🏠"
                    );

                    await fetchStudentData();

                    return;
                }


                setGateMessage(
                    data.message ||
                    "Gate action confirmed."
                );

            } catch (error) {

                console.error(
                    "Gate confirmation error:",
                    error
                );

                setGateError(
                    error.message ||
                    "Unable to confirm gate action."
                );

            } finally {

                setGateLoading(false);
            }
        };


    // ==========================================
    // CLOSE GATE VERIFICATION
    // ==========================================

    const closeGateVerification =
        () => {

            setGateOutpassId(null);

            setGateAction(null);

            setGateMessage("");

            setGateError("");

            /*
             * Return the browser to the normal
             * Student Dashboard URL.
             */

            window.history.replaceState(
                {},
                "",
                "/"
            );
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

        window.location.href = "/";
    };


    // ==========================================
    // STATUS CLASS
    // ==========================================

    const getStatusClass = (
        status
    ) => {

        return `status-badge status-${status}`;
    };


    // ==========================================
    // STATUS TEXT
    // ==========================================

    const getStatusText = (
        status
    ) => {

        switch (status) {

            case "pending":
                return "Pending";

            case "approved":
                return "Approved";

            case "rejected":
                return "Rejected";

            case "completed":
                return "Completed";

            case "expired":
                return "Expired";

            default:
                return status;
        }
    };


    // ==========================================
    // STATUS MESSAGE
    // ==========================================

    const getStatusMessage =
        (outpass) => {

            switch (outpass.status) {

                case "pending":

                    return {
                        icon: "⏳",

                        title:
                            "Waiting for Warden Approval",

                        text:
                            "Your parent has submitted this outpass request. Please wait for the warden to review it."
                    };


                case "approved":

                    return {
                        icon: "✅",

                        title:
                            "Outpass Approved",

                        text:
                            "Your outpass has been approved. Go to the main gate and scan the QR code displayed by Security."
                    };


                case "rejected":

                    return {
                        icon: "❌",

                        title:
                            "Outpass Rejected",

                        text:
                            outpass.rejectionReason ||
                            "Your outpass request was rejected by the warden."
                    };


                case "completed":

                    return {
                        icon: "🏠",

                        title:
                            "Returned Successfully",

                        text:
                            "Your return has been recorded at the main gate. This outpass is now completed."
                    };


                case "expired":

                    return {
                        icon: "⚠️",

                        title:
                            "Outpass Expired",

                        text:
                            "This outpass is no longer valid."
                    };


                default:

                    return {
                        icon: "ℹ️",

                        title:
                            "Outpass Status",

                        text:
                            "Please check your outpass details."
                    };
            }
        };


    // ==========================================
    // FORMAT DATE
    // ==========================================

    const formatDate = (
        date
    ) => {

        if (!date) {
            return "-";
        }

        return new Date(
            date
        ).toLocaleDateString(
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

    const formatDateTime = (
        date
    ) => {

        if (!date) {
            return "-";
        }

        return new Date(
            date
        ).toLocaleString(
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
    // STATISTICS
    // ==========================================

    const totalOutpasses =
        outpasses.length;

    const approvedOutpasses =
        outpasses.filter(
            (outpass) =>
                outpass.status ===
                "approved"
        ).length;

    const completedOutpasses =
        outpasses.filter(
            (outpass) =>
                outpass.status ===
                "completed"
        ).length;

    const pendingOutpasses =
        outpasses.filter(
            (outpass) =>
                outpass.status ===
                "pending"
        ).length;


    // ==========================================
    // LATEST OUTPASS
    // ==========================================

    const latestOutpass =
        outpasses.length > 0
            ? outpasses[0]
            : null;


    // ==========================================
    // GATE OUTPASS
    // ==========================================

    const gateOutpass =
        outpasses.find(
            (outpass) =>
                outpass.outpassId ===
                gateOutpassId
        );


    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {

        return (
            <div className="student-loading">

                <div className="loading-spinner"></div>

                <p>
                    Loading Student Portal...
                </p>

            </div>
        );
    }


    // ==========================================
    // ERROR
    // ==========================================

    if (error) {

        return (
            <div className="student-error-page">

                <div className="error-card">

                    <div className="error-icon">
                        ⚠️
                    </div>

                    <h2>
                        Something went wrong 😕
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        onClick={
                            fetchStudentData
                        }
                        className="retry-button"
                    >
                        Try Again
                    </button>

                    <button
                        onClick={
                            handleLogout
                        }
                        className="logout-error-button"
                    >
                        Logout
                    </button>

                </div>

            </div>
        );
    }


    return (
        <div className="student-dashboard">

            {/* =====================================
                HEADER
            ====================================== */}

            <header className="student-header">

                <div className="student-brand">

                    <div className="student-logo">
                        🏫
                    </div>

                    <div>

                        <h1>
                            E-Outpass
                        </h1>

                        <p>
                            Student Portal
                        </p>

                    </div>

                </div>


                <div className="student-header-actions">

                    <button
                        onClick={
                            fetchStudentData
                        }
                        className="refresh-button"
                    >
                        ↻ Refresh
                    </button>

                    <button
                        onClick={
                            handleLogout
                        }
                        className="logout-button"
                    >
                        Logout
                    </button>

                </div>

            </header>


            {/* =====================================
                MAIN
            ====================================== */}

            <main className="student-main">


                {/* =================================
                    WELCOME
                ================================= */}

                <section className="student-welcome">

                    <div>

                        <p className="welcome-label">
                            Welcome back 👋
                        </p>

                        <h2>
                            {student?.name}
                        </h2>

                        <p className="student-subtitle">

                            Student ID:{" "}

                            <strong>
                                {student?.studentId}
                            </strong>

                        </p>

                    </div>


                    <div className="student-profile-icon">
                        🎓
                    </div>

                </section>


                {/* =================================
                    STUDENT INFORMATION
                ================================= */}

                <section className="student-info-card">

                    <div className="info-item">

                        <span className="info-label">
                            Course
                        </span>

                        <strong>
                            {student?.course || "-"}
                        </strong>

                    </div>


                    <div className="info-item">

                        <span className="info-label">
                            Room
                        </span>

                        <strong>
                            {student?.roomNumber || "-"}
                        </strong>

                    </div>


                    <div className="info-item">

                        <span className="info-label">
                            Hostel
                        </span>

                        <strong>
                            {student?.hostel?.name || "-"}
                        </strong>

                    </div>

                </section>


                {/* =================================
                    STATISTICS
                ================================= */}

                <section className="student-stats">

                    <div className="stat-card">

                        <div className="stat-icon">
                            📋
                        </div>

                        <div>

                            <span>
                                Total Outpasses
                            </span>

                            <strong>
                                {totalOutpasses}
                            </strong>

                        </div>

                    </div>


                    <div className="stat-card">

                        <div className="stat-icon">
                            ⏳
                        </div>

                        <div>

                            <span>
                                Pending
                            </span>

                            <strong>
                                {pendingOutpasses}
                            </strong>

                        </div>

                    </div>


                    <div className="stat-card">

                        <div className="stat-icon">
                            ✅
                        </div>

                        <div>

                            <span>
                                Approved
                            </span>

                            <strong>
                                {approvedOutpasses}
                            </strong>

                        </div>

                    </div>


                    <div className="stat-card">

                        <div className="stat-icon">
                            🏠
                        </div>

                        <div>

                            <span>
                                Completed
                            </span>

                            <strong>
                                {completedOutpasses}
                            </strong>

                        </div>

                    </div>

                </section>


                {/* =================================
                    GATE VERIFICATION
                ================================= */}

                {gateOutpassId && (

                    <section className="gate-verification-card">

                        <div className="gate-verification-header">

                            <div className="gate-verification-icon">
                                🚪
                            </div>

                            <div>

                                <span>
                                    MAIN GATE
                                </span>

                                <h2>
                                    QR Gate Verification
                                </h2>

                                <p>
                                    Security has requested
                                    verification for this
                                    outpass.
                                </p>

                            </div>

                        </div>


                        {gateError && (

                            <div className="gate-error">
                                ⚠️ {gateError}
                            </div>

                        )}


                        {gateMessage && (

                            <div className="gate-success">
                                ✅ {gateMessage}
                            </div>

                        )}


                        {gateOutpass ? (

                            <div className="gate-outpass-details">

                                <div className="gate-student">

                                    <span>
                                        STUDENT
                                    </span>

                                    <strong>
                                        {gateOutpass.student?.name ||
                                            student?.name}
                                    </strong>

                                </div>


                                <div className="gate-outpass-id">

                                    <span>
                                        OUTPASS ID
                                    </span>

                                    <strong>
                                        {
                                            gateOutpass.outpassId
                                        }
                                    </strong>

                                </div>


                                <div className="gate-detail-grid">

                                    <div>

                                        <span>
                                            📍 Place
                                        </span>

                                        <strong>
                                            {
                                                gateOutpass.placeOfVisit ||
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
                                                gateOutpass.dateRequestedFor
                                            )}
                                        </strong>

                                    </div>

                                    <div>

                                        <span>
                                            🚪 Leaving
                                        </span>

                                        <strong>
                                            {
                                                gateOutpass.timeOfLeaving ||
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
                                                gateOutpass.expectedInTime ||
                                                "-"
                                            }
                                        </strong>

                                    </div>

                                </div>


                                {/* EXIT */}

                                {gateAction ===
                                    "exit" && (

                                    <div className="gate-action-box">

                                        <div className="gate-action-icon">
                                            🚪
                                        </div>

                                        <h3>
                                            Confirm Exit
                                        </h3>

                                        <p>
                                            You are about to
                                            leave the hostel.
                                            Confirm your exit
                                            to record your
                                            departure time.
                                        </p>

                                        <button
                                            className="confirm-exit-button"
                                            onClick={
                                                confirmGateAction
                                            }
                                            disabled={
                                                gateLoading
                                            }
                                        >
                                            {gateLoading
                                                ? "Confirming..."
                                                : "✓ CONFIRM EXIT"}
                                        </button>

                                    </div>

                                )}


                                {/* OUTSIDE */}

                                {gateAction ===
                                    "outside" && (

                                    <div className="gate-action-box outside-state">

                                        <div className="gate-action-icon">
                                            🚗
                                        </div>

                                        <h3>
                                            Exit Recorded
                                        </h3>

                                        <p>
                                            Your exit has
                                            been recorded.
                                            When you return
                                            to the hostel,
                                            scan Security's
                                            QR again.
                                        </p>

                                        <button
                                            className="gate-close-button"
                                            onClick={
                                                closeGateVerification
                                            }
                                        >
                                            Close
                                        </button>

                                    </div>

                                )}


                                {/* COMPLETED */}

                                {gateAction ===
                                    "completed" && (

                                    <div className="gate-action-box completed-state">

                                        <div className="gate-action-icon">
                                            🏠
                                        </div>

                                        <h3>
                                            Return Already Recorded
                                        </h3>

                                        <p>
                                            This outpass has
                                            already been
                                            completed.
                                        </p>

                                        <button
                                            className="gate-close-button"
                                            onClick={
                                                closeGateVerification
                                            }
                                        >
                                            Close
                                        </button>

                                    </div>

                                )}

                            </div>

                        ) : (

                            <div className="gate-error">
                                ⚠️ This QR code does not
                                belong to any of your
                                outpasses.
                            </div>

                        )}


                    </section>

                )}


                {/* =================================
                    NOTIFICATION
                ================================= */}

                {latestOutpass && (

                    <section className="student-notification">

                        <div className="notification-header">

                            <div>

                                <span className="notification-label">
                                    LATEST UPDATE
                                </span>

                                <h2>
                                    Outpass Notification
                                </h2>

                            </div>

                            <span
                                className={getStatusClass(
                                    latestOutpass.status
                                )}
                            >
                                {getStatusText(
                                    latestOutpass.status
                                )}
                            </span>

                        </div>


                        <div className="notification-content">

                            <div className="notification-icon">

                                {
                                    getStatusMessage(
                                        latestOutpass
                                    ).icon
                                }

                            </div>

                            <div>

                                <h3>
                                    {
                                        getStatusMessage(
                                            latestOutpass
                                        ).title
                                    }
                                </h3>

                                <p>
                                    {
                                        getStatusMessage(
                                            latestOutpass
                                        ).text
                                    }
                                </p>

                            </div>

                        </div>

                    </section>

                )}


                {/* =================================
                    MAIN GATE INSTRUCTIONS
                ================================= */}

                <section className="gate-section">

                    <div className="gate-section-header">

                        <div className="gate-icon">
                            🚪
                        </div>

                        <div>

                            <span>
                                MAIN GATE
                            </span>

                            <h2>
                                QR Gate Verification
                            </h2>

                        </div>

                    </div>


                    <div className="gate-instructions">

                        <div className="gate-step">

                            <div className="gate-step-number">
                                1
                            </div>

                            <div>

                                <strong>
                                    Go to the Main Gate
                                </strong>

                                <p>
                                    Carry your approved
                                    outpass information
                                    with you.
                                </p>

                            </div>

                        </div>


                        <div className="gate-step">

                            <div className="gate-step-number">
                                2
                            </div>

                            <div>

                                <strong>
                                    Scan Security's QR
                                </strong>

                                <p>
                                    Security will display
                                    a QR code on the gate
                                    screen. Scan it using
                                    your phone camera.
                                </p>

                            </div>

                        </div>


                        <div className="gate-step">

                            <div className="gate-step-number">
                                3
                            </div>

                            <div>

                                <strong>
                                    Confirm Exit
                                </strong>

                                <p>
                                    After scanning, review
                                    your outpass and confirm
                                    your exit.
                                </p>

                            </div>

                        </div>


                        <div className="gate-step">

                            <div className="gate-step-number">
                                4
                            </div>

                            <div>

                                <strong>
                                    Confirm Return
                                </strong>

                                <p>
                                    When you return, scan
                                    Security's QR again and
                                    confirm your return.
                                </p>

                            </div>

                        </div>

                    </div>


                    <div className="gate-note">

                        <span>
                            💡
                        </span>

                        <p>
                            The QR code is displayed by
                            Security at the main gate.
                            You do not need to display a
                            QR code from this dashboard.
                        </p>

                    </div>

                </section>


                {/* =================================
                    MY OUTPASSES
                ================================= */}

                <section className="outpass-section">

                    <div className="section-heading">

                        <div>

                            <h2>
                                My Outpasses
                            </h2>

                            <p>
                                View your outpass requests
                                and their current status.
                            </p>

                        </div>

                        <span className="outpass-count">
                            {totalOutpasses} Total
                        </span>

                    </div>


                    {outpasses.length === 0 ? (

                        <div className="empty-outpass">

                            <div className="empty-icon">
                                📭
                            </div>

                            <h3>
                                No outpasses yet
                            </h3>

                            <p>
                                Your outpass requests will
                                appear here once your parent
                                submits one.
                            </p>

                        </div>

                    ) : (

                        <div className="outpass-list">

                            {outpasses.map(
                                (outpass) => {

                                    const statusMessage =
                                        getStatusMessage(
                                            outpass
                                        );

                                    return (

                                        <article
                                            key={
                                                outpass._id
                                            }
                                            className="student-outpass-card"
                                        >

                                            <div className="outpass-card-header">

                                                <div>

                                                    <span className="outpass-label">
                                                        OUTPASS ID
                                                    </span>

                                                    <h3>
                                                        {
                                                            outpass.outpassId
                                                        }
                                                    </h3>

                                                </div>

                                                <span
                                                    className={getStatusClass(
                                                        outpass.status
                                                    )}
                                                >
                                                    {
                                                        getStatusText(
                                                            outpass.status
                                                        )
                                                    }
                                                </span>

                                            </div>


                                            <div className="outpass-details">

                                                <div className="detail-item">

                                                    <span>
                                                        📍 Place of Visit
                                                    </span>

                                                    <strong>
                                                        {
                                                            outpass.placeOfVisit ||
                                                            "-"
                                                        }
                                                    </strong>

                                                </div>


                                                <div className="detail-item">

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
                                                        {
                                                            outpass.timeOfLeaving ||
                                                            "-"
                                                        }
                                                    </strong>

                                                </div>


                                                <div className="detail-item">

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


                                                {outpass.approvedAt && (

                                                    <div className="detail-item">

                                                        <span>
                                                            ✅ Approved At
                                                        </span>

                                                        <strong>
                                                            {formatDateTime(
                                                                outpass.approvedAt
                                                            )}
                                                        </strong>

                                                    </div>

                                                )}

                                            </div>


                                            <div
                                                className={`outpass-status-message status-message-${outpass.status}`}
                                            >

                                                <div className="status-message-icon">
                                                    {
                                                        statusMessage.icon
                                                    }
                                                </div>

                                                <div>

                                                    <strong>
                                                        {
                                                            statusMessage.title
                                                        }
                                                    </strong>

                                                    <p>
                                                        {
                                                            statusMessage.text
                                                        }
                                                    </p>

                                                </div>

                                            </div>


                                            {outpass.status ===
                                                "rejected" &&
                                                outpass.rejectionReason && (

                                                    <div className="rejection-box">

                                                        <strong>
                                                            Rejection Reason
                                                        </strong>

                                                        <p>
                                                            {
                                                                outpass.rejectionReason
                                                            }
                                                        </p>

                                                    </div>

                                                )}


                                            {outpass.status ===
                                                "approved" && (

                                                    <div className="approved-gate-box">

                                                        <div className="approved-gate-icon">
                                                            📱
                                                        </div>

                                                        <div>

                                                            <strong>
                                                                Ready for Main Gate
                                                            </strong>

                                                            <p>
                                                                Go to the main gate
                                                                and scan the QR code
                                                                displayed by Security.
                                                            </p>

                                                        </div>

                                                    </div>

                                                )}


                                            {outpass.status ===
                                                "completed" && (

                                                    <div className="completed-box">

                                                        <span>
                                                            ✅
                                                        </span>

                                                        <div>

                                                            <strong>
                                                                Outpass Completed
                                                            </strong>

                                                            <p>
                                                                Your entry back into
                                                                the hostel has been
                                                                recorded successfully.
                                                            </p>

                                                        </div>

                                                    </div>

                                                )}

                                        </article>

                                    );
                                }
                            )}

                        </div>

                    )}

                </section>


                <div className="student-footer-note">

                    <span>
                        🔐
                    </span>

                    <p>
                        E-Outpass securely records your
                        outpass approval and main-gate
                        entry/exit activity.
                    </p>

                </div>

            </main>

        </div>
    );
}

export default StudentDashboard;