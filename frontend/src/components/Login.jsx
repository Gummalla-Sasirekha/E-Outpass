import { useState } from "react";
import "./Login.css";

const API_URL = import.meta.env.VITE_API_URL;

function Login({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        setMessage("");
        setIsError(false);

        try {
            const response = await fetch(
                `${API_URL}/api/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: email.trim(),
                        password
                    })
                }
            );

            const data = await response.json();

            console.log("Login response:", data);

            if (!response.ok) {
                setIsError(true);
                setMessage(data.message || "Login failed");
                return;
            }

            // Make sure a user object was returned
            if (!data.user) {
                setIsError(true);
                setMessage(
                    "Login successful, but user data is missing."
                );
                return;
            }

            // Normalize the role
            const loggedInUser = {
                ...data.user,
                role: String(data.user.role)
                    .trim()
                    .toLowerCase()
            };

            console.log("Logged in user:", loggedInUser);
            console.log("User role:", loggedInUser.role);

            // Store JWT
            localStorage.setItem(
                "token",
                data.token
            );

            // Store normalized user
            localStorage.setItem(
                "user",
                JSON.stringify(loggedInUser)
            );

            // Send user to App.jsx
            onLogin(loggedInUser);

        } catch (error) {
            console.error("Login error:", error);

            setIsError(true);

            setMessage(
                "Unable to connect to the server."
            );
        }
    };

    return (
        <div className="login-page">

            <div className="login-card">

                <div className="logo-section">
                    <h1>E-OUTPASS</h1>
                    <p>Hostel Management System</p>
                </div>

                <h2>Welcome Back 👋</h2>

                <form onSubmit={handleLogin}>

                    <div className="form-group">

                        <label>Email</label>

                        <input
                            type="email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            placeholder="Enter your email"
                            required
                        />

                    </div>

                    <div className="form-group">

                        <label>Password</label>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            placeholder="Enter your password"
                            required
                        />

                    </div>

                    <button
                        type="submit"
                        className="login-button"
                    >
                        LOGIN
                    </button>

                </form>

                {message && (
                    <p
                        className={
                            isError
                                ? "error-message"
                                : "success-message"
                        }
                    >
                        {message}
                    </p>
                )}

            </div>

        </div>
    );
}

export default Login;