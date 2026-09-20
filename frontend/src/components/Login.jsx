import { useState } from "react";
import "./Login.css";

const API_URL = import.meta.env.VITE_API_URL;

function MailIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m4 7 8 6 8-6" />
        </svg>
    );
}

function LockIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="5" y="10" width="14" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
    );
}

function EyeIcon({ open }) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            {open ? (
                <>
                    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                    <circle cx="12" cy="12" r="2.5" />
                </>
            ) : (
                <>
                    <path d="M3 3l18 18" />
                    <path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a18 18 0 0 1-3.1 3.7" />
                    <path d="M6.1 6.8C3.8 8.2 2.5 12 2.5 12s3.5 6 9.5 6c1.1 0 2.1-.2 3-.5" />
                </>
            )}
        </svg>
    );
}

function RoleIcon({ type }) {
    const paths = {
        parents: "M7 20v-2.2A3.8 3.8 0 0 1 10.8 14h2.4a3.8 3.8 0 0 1 3.8 3.8V20M12 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM3 20v-1.5A3.5 3.5 0 0 1 6.5 15M18 15a3.5 3.5 0 0 1 3 3.5V20",
        wardens: "M12 3 20 6v5.2c0 4.8-3.3 8.2-8 9.8-4.7-1.6-8-5-8-9.8V6l8-3Z M8.5 12l2.2 2.2 4.8-5",
        students: "M3 9.5 12 4l9 5.5-9 5.5-9-5.5ZM6 12.5V17c3.5 2.4 8.5 2.4 12 0v-4.5M21 10v5",
        security: "M5 4h11v16H5zM16 8h3v12h-3M9 12h3M12 12l-1.8-1.8M12 12l-1.8 1.8"
    };

    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={paths[type]} />
        </svg>
    );
}

function CampusIllustration() {
    return (
        <div className="campus-illustration" aria-hidden="true">
            <div className="hill hill-a" />
            <div className="hill hill-b" />
            <div className="building building-a"><i/><i/><i/><i/></div>
            <div className="building building-b"><i/><i/><i/><i/><i/><i/></div>
            <div className="building building-c"><i/><i/><i/><i/></div>
            <div className="building building-d"><i/><i/><i/></div>
            <div className="tree tree-a" />
            <div className="tree tree-b" />
            <div className="tree tree-c" />
            <div className="tree tree-d" />
            <div className="tree tree-e" />
            <div className="walkway" />
            <div className="signboard">
                <strong>A SAFER</strong>
                <span>TOMORROW</span>
                <b />
            </div>
        </div>
    );
}

function Login({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage("");
        setIsError(false);

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.trim(),
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setIsError(true);
                setMessage(data.message || "Login failed");
                return;
            }

            if (!data.user) {
                setIsError(true);
                setMessage("Login successful, but user data is missing.");
                return;
            }

            const loggedInUser = {
                ...data.user,
                role: String(data.user.role).trim().toLowerCase()
            };

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(loggedInUser));
            onLogin(loggedInUser);
        } catch (error) {
            console.error("Login error:", error);
            setIsError(true);
            setMessage("Unable to connect to the server.");
        }
    };

    return (
        <main className="login-page">
            <section className="login-left">
                <header className="top-brand">
                    <div>
                        <strong>E Outpass</strong>
                        <small>Safer Campuses. Brighter Tomorrows.</small>
                    </div>
                </header>

                <div className="hero-copy">
                    <p className="eyebrow">HOSTEL OUTPASS MANAGEMENT SYSTEM</p>
                    <h1>
                        Safer
                        <br />
                        Campuses.
                        <br />
                        <em>Brighter</em>
                        <br />
                        <em>Tomorrows.</em>
                    </h1>

                    <p className="hero-description">
                        Connecting parents, students, wardens and security
                        for a safer, more secure campus.
                    </p>

                    <div className="roles">
                        <div>
                            <span><RoleIcon type="parents" /></span>
                            <label>For<br /><b>Parents</b></label>
                        </div>
                        <div>
                            <span><RoleIcon type="wardens" /></span>
                            <label>For<br /><b>Wardens</b></label>
                        </div>
                        <div>
                            <span><RoleIcon type="students" /></span>
                            <label>For<br /><b>Students</b></label>
                        </div>
                        <div>
                            <span><RoleIcon type="security" /></span>
                            <label>For<br /><b>Security</b></label>
                        </div>
                    </div>
                </div>

                <CampusIllustration />
            </section>

            <section className="login-right">
                <div className="login-card">
                    <div className="card-brand">
                        <div>
                            <strong>E Outpass</strong>
                            <small>Safer Campuses. Brighter Tomorrows.</small>
                        </div>
                    </div>

                    <div className="welcome">
                        <h2>Welcome back</h2>
                        <p>Sign in to continue to E Outpass</p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="field">
                            <label htmlFor="email">Email / Username</label>
                            <div className="input-box">
                                <MailIcon />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email or username"
                                    autoComplete="email"
                                    required
                                />
                            </div>
                        </div>

                        <div className="field">
                            <label htmlFor="password">Password</label>
                            <div className="input-box">
                                <LockIcon />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="eye-button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    <EyeIcon open={showPassword} />
                                </button>
                            </div>
                        </div>

                        <div className="form-options">
                            <label>
                                <input type="checkbox" />
                                <span>Remember me</span>
                            </label>
                            <button type="button" className="forgot">
                                Forgot password?
                            </button>
                        </div>

                        <button className="sign-in" type="submit">
                            <span>Sign In</span>
                            <b>→</b>
                        </button>
                    </form>

                    {message && (
                        <p className={isError ? "form-message error" : "form-message success"}>
                            {message}
                        </p>
                    )}

                    <div className="or-divider">
                        <span />
                        <b>OR</b>
                        <span />
                    </div>

                    <button
                        type="button"
                        className="college-login"
                        onClick={() => setMessage("College Login is not connected yet.")}
                    >
                        <span className="college-icon">▦</span>
                        Continue with College Login
                    </button>

                    <div className="trust">
                        <span>Secure</span>
                        <i>•</i>
                        <span>Simple</span>
                        <i>•</i>
                        <span>Trusted</span>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default Login;
