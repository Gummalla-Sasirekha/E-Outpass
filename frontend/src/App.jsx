import { useState } from "react";

import Login from "./components/Login";

import ParentDashboard from "./ParentDashboard";
import WardenDashboard from "./WardenDashboard";
import SecurityDashboard from "./SecurityDashboard";
import StudentDashboard from "./StudentDashboard";
import GateConfirmation from "./GateConfirmation";
import HODDashboard from "./HODDashboard";

function normalizeRole(role) {
    const rawRole = String(role || "")
        .trim()
        .toLowerCase();

    const roleMap = {
        parent: "parent",
        student: "student",
        warden: "warden",
        security: "security",
        hod: "hod",

        "classadvisor": "classAdvisor",
        "class_advisor": "classAdvisor",
        "class-advisor": "classAdvisor"
    };

    return roleMap[rawRole] || rawRole;
}

function App() {

    const [user, setUser] = useState(() => {

        const savedUser =
            localStorage.getItem("user");

        if (!savedUser) {
            return null;
        }

        try {
            const parsedUser =
                JSON.parse(savedUser);

            return {
                ...parsedUser,
                role: normalizeRole(parsedUser.role)
            };

        } catch (error) {

            console.error(
                "Invalid saved user:",
                error
            );

            localStorage.removeItem("user");
            localStorage.removeItem("token");

            return null;
        }
    });


    // ==========================================
    // CURRENT PATH
    // ==========================================

    const currentPath =
        window.location.pathname;


    // ==========================================
    // QR GATE PAGE
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
                onLogin={(loggedInUser) => {

                    const normalizedUser = {
                        ...loggedInUser,
                        role: normalizeRole(
                            loggedInUser.role
                        )
                    };

                    console.log(
                        "APP RECEIVED USER:",
                        normalizedUser
                    );

                    console.log(
                        "APP RECEIVED ROLE:",
                        normalizedUser.role
                    );

                    setUser(normalizedUser);
                }}
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
                fontFamily: "Arial, sans-serif",
                gap: "10px"
            }}
        >

            <h2>
                Invalid user role
            </h2>

            <p>
                Role received:
                {" "}
                <strong>
                    {String(user.role)}
                </strong>
            </p>

            <button
                onClick={() => {

                    localStorage.removeItem(
                        "token"
                    );

                    localStorage.removeItem(
                        "user"
                    );

                    setUser(null);

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