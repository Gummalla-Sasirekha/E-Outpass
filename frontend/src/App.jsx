import { useState } from "react";

import Login from "./components/Login";

import ParentDashboard from "./ParentDashboard";
import WardenDashboard from "./WardenDashboard";
import SecurityDashboard from "./SecurityDashboard";
import StudentDashboard from "./StudentDashboard";
import GateConfirmation from "./GateConfirmation";
import HODDashboard from "./HODDashboard";

function App() {

    const [user, setUser] = useState(() => {

        const savedUser =
            localStorage.getItem("user");

        return savedUser
            ? JSON.parse(savedUser)
            : null;
    });


    // ==========================================
    // CURRENT PATH
    // ==========================================

    const currentPath =
        window.location.pathname;


    // ==========================================
    // QR GATE PAGE
    // ==========================================
    //
    // This must be checked before login/user
    // role checks because a QR scan should be
    // able to open the gate page directly.
    //
    // ==========================================

    if (
        currentPath.startsWith("/gate/")
    ) {
        return (
            <GateConfirmation />
        );
    }


    // ==========================================
    // LOGIN
    // ==========================================

    if (!user) {
        return (
            <Login
                onLogin={setUser}
            />
        );
    }


    // ==========================================
    // PARENT
    // ==========================================

    if (user.role === "parent") {
        return (
            <ParentDashboard />
        );
    }


    // ==========================================
    // WARDEN
    // ==========================================

    if (user.role === "warden") {
        return (
            <WardenDashboard />
        );
    }


    // ==========================================
    // SECURITY
    // ==========================================

    if (user.role === "security") {
        return (
            <SecurityDashboard />
        );
    }


    // ==========================================
    // STUDENT
    // ==========================================

    if (user.role === "student") {
        return (
            <StudentDashboard />
        );
    }


    // ==========================================
    // HOD
    // CLASS ADVISOR
    // ==========================================
    //
    // Both HOD and Class Advisor use the
    // academic approval dashboard.
    //
    // ==========================================

    if (
        user.role === "hod" ||
        user.role === "classAdvisor"
    ) {
        return (
            <HODDashboard />
        );
    }


    // ==========================================
    // INVALID ROLE
    // ==========================================

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                fontFamily: "Arial, sans-serif"
            }}
        >

            <h2>
                Invalid user role
            </h2>

            <p>
                Role received: {user.role}
            </p>

            <button
                onClick={() => {

                    localStorage.clear();

                    window.location.reload();

                }}
                style={{
                    padding: "10px 18px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#2563eb",
                    color: "white",
                    cursor: "pointer"
                }}
            >
                Back to Login
            </button>

        </div>
    );
}


export default App;