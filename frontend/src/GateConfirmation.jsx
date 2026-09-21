import { useEffect, useState } from "react";
import "./GateConfirmation.css";

const API_URL = import.meta.env.VITE_API_URL;

function GateConfirmation() {
    const [outpassId, setOutpassId] = useState("");
    const [action, setAction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [success, setSuccess] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const pathParts = window.location.pathname.split("/").filter(Boolean);
        const gateIndex = pathParts.indexOf("gate");

        if (gateIndex === -1 || !pathParts[gateIndex + 1]) {
            setError("Invalid QR code.");
            setLoading(false);
            return;
        }

        const id = decodeURIComponent(pathParts[gateIndex + 1]);
        setOutpassId(id);
        checkGateStatus(id);
    }, []);

    const checkGateStatus = async (id) => {
        try {
            const response = await fetch(
                `${API_URL}/api/outpass/student-status`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ outpassId: id })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(
                    data.message ||
                    "Unable to verify this outpass."
                );
                setLoading(false);
                return;
            }

            setAction(data.action);
            setLoading(false);
        } catch (error) {
            console.error("Gate status error:", error);
            setError(
                "Unable to connect to the E-Outpass server."
            );
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        try {
            setConfirming(true);
            setError("");

            const response = await fetch(
                `${API_URL}/api/outpass/student-confirm`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ outpassId })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(
                    data.message ||
                    "Confirmation failed."
                );
                setConfirming(false);
                return;
            }

            setSuccess(true);
            setMessage(
                data.message ||
                "Gate action confirmed successfully."
            );
            setConfirming(false);
        } catch (error) {
            console.error("Gate confirmation error:", error);
            setError(
                "Unable to connect to the E-Outpass server."
            );
            setConfirming(false);
        }
    };

    const handleGoBack = () => {
        window.location.href = "/";
    };

    if (loading) {
        return (
            <div className="gate-page">
                <div className="gate-card state-card">
                    <div className="gate-icon">🔄</div>
                    <h1>Verifying Outpass</h1>
                    <p>
                        Please wait while we verify your outpass.
                    </p>
                </div>
            </div>
        );
    }

    if (error && !action && !success) {
        return (
            <div className="gate-page">
                <div className="gate-card state-card">
                    <div className="gate-icon error">❌</div>
                    <h1>Unable to Continue</h1>
                    <p className="gate-error">{error}</p>
                    <button
                        className="gate-button secondary"
                        onClick={handleGoBack}
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="gate-page">
                <div className="gate-card state-card">
                    <div className="gate-icon success">✓</div>

                    <h1>
                        {action === "exit"
                            ? "Exit Confirmed!"
                            : "Return Confirmed!"
                        }
                    </h1>

                    <p className="gate-success">
                        {message}
                    </p>

                    <div className="gate-info">
                        <strong>Outpass ID</strong>
                        <span>{outpassId}</span>
                    </div>

                    <p className="small-text">
                        Your gate record has been updated successfully.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="gate-page">
            <div className="gate-shell">

                <header className="gate-header">
                    <div className="gate-brand-copy">
                        <h1>E Outpass</h1>
                        <p>Safer Campuses. Brighter Tomorrows.</p>
                    </div>
                </header>

                <main className="gate-card confirmation-card">

                    {action === "exit" && (
                        <>
                            <div className="gate-icon">
                                🚪
                            </div>

                            <h2>Confirm Exit?</h2>

                            <p className="gate-description">
                                You are about to leave the campus.
                            </p>

                            <div className="gate-info">
                                <strong>Outpass ID</strong>
                                <span>{outpassId}</span>
                            </div>

                            <p className="warning-text">
                                <span className="warning-mark">!</span>
                                <span>
                                    By confirming, your campus exit will be recorded.
                                </span>
                            </p>
                        </>
                    )}

                    {action === "return" && (
                        <>
                            <div className="gate-icon return-icon">
                                🏫
                            </div>

                            <h2>Confirm Return?</h2>

                            <p className="gate-description">
                                You are confirming your return to campus.
                            </p>

                            <div className="gate-info">
                                <strong>Outpass ID</strong>
                                <span>{outpassId}</span>
                            </div>

                            <p className="warning-text">
                                <span className="warning-mark">!</span>
                                <span>
                                    By confirming, your campus return will be recorded
                                    and the outpass will be completed.
                                </span>
                            </p>
                        </>
                    )}

                    {error && (
                        <p className="gate-error">
                            {error}
                        </p>
                    )}

                    <div className="gate-actions">
                        <button
                            className="gate-button secondary"
                            onClick={handleGoBack}
                            disabled={confirming}
                        >
                            Cancel
                        </button>

                        <button
                            className="gate-button primary"
                            onClick={handleConfirm}
                            disabled={confirming}
                        >
                            {confirming ? "Confirming..." : "Confirm →"}
                        </button>
                    </div>

                </main>
            </div>
        </div>
    );
}

export default GateConfirmation;
