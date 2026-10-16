
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

// ======================================================
// REGISTER USER
// ======================================================

const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                message: "Please provide all required fields."
            });
        }

        const allowedRoles = [
            "parent",
            "student",
            "warden",
            "security",
            "hod",
            "classAdvisor"
        ];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                message: "Invalid role."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(400).json({
                message: "User with this email already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role
        });

        return res.status(201).json({
            message: "User registered successfully.",
            userId: user._id,
            role: user.role
        });
    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            message: "Registration failed."
        });
    }
};

// ======================================================
// LOGIN USER
// ======================================================

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not configured.");

            return res.status(500).json({
                message: "Authentication is not configured."
            });
        }

        const token = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        return res.status(200).json({
            message: "Login successful.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Login failed."
        });
    }
};

// ======================================================
// GOOGLE LOGIN — EXISTING DATABASE USERS ONLY
// ======================================================

const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body || {};

        if (!credential) {
            return res.status(400).json({
                message: "Google credential is required."
            });
        }

        if (!process.env.GOOGLE_CLIENT_ID) {
            console.error("GOOGLE_CLIENT_ID is not configured.");

            return res.status(500).json({
                message: "Google login is not configured."
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not configured.");

            return res.status(500).json({
                message: "Authentication is not configured."
            });
        }

        // Verify the Google ID token on the backend.
        const googleClient = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID
        );

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        if (
            !payload ||
            !payload.email ||
            payload.email_verified !== true
        ) {
            return res.status(401).json({
                message: "Google account email could not be verified."
            });
        }

        const normalizedEmail = payload.email
            .trim()
            .toLowerCase();

        // Only an existing E-Outpass database account can sign in.
        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.status(403).json({
                message:
                    "No authorized E-Outpass account exists for this Google email. Contact the administrator."
            });
        }

        // Do not create a user or change their existing role.
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        return res.status(200).json({
            message: "Google login successful.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        // Invalid Google tokens should be rejected.
        if (
            error.name === "Error" ||
            error.name === "OAuth2ClientError" ||
            error.name === "GaxiosError"
        ) {
            console.error("Google verification/login error:", error.message);
        } else {
            console.error("Google login error:", error);
        }

        return res.status(401).json({
            message: "Google sign-in failed. Please try again."
        });
    }
};

// ======================================================
// EXPORT
// ======================================================

module.exports = {
    registerUser,
    loginUser,
    googleLogin
};
