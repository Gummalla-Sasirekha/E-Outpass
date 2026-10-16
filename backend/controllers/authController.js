const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

// ======================================================
// REGISTER USER
// ======================================================

const registerUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role
        } = req.body;

        // --------------------------------------------------
        // VALIDATE REQUIRED FIELDS
        // --------------------------------------------------

        if (
            !name ||
            !email ||
            !password ||
            !role
        ) {
            return res.status(400).json({
                message:
                    "Please provide all required fields."
            });
        }

        // --------------------------------------------------
        // VALIDATE ROLE
        // --------------------------------------------------

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

        // --------------------------------------------------
        // CHECK EXISTING USER
        // --------------------------------------------------

        const normalizedEmail =
            email.trim().toLowerCase();

        const existingUser =
            await User.findOne({
                email: normalizedEmail
            });

        if (existingUser) {
            return res.status(400).json({
                message:
                    "User with this email already exists."
            });
        }

        // --------------------------------------------------
        // HASH PASSWORD
        // --------------------------------------------------

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );

        // --------------------------------------------------
        // CREATE USER
        // --------------------------------------------------

        const user =
            await User.create({
                name: name.trim(),
                email: normalizedEmail,
                password: hashedPassword,
                role
            });

        return res.status(201).json({
            message:
                "User registered successfully.",
            userId: user._id,
            role: user.role
        });

    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        return res.status(500).json({
            message:
                "Registration failed.",
            error:
                error.message
        });
    }
};

// ======================================================
// LOGIN USER
// ======================================================

const loginUser = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        // --------------------------------------------------
        // VALIDATE INPUT
        // --------------------------------------------------

        if (
            !email ||
            !password
        ) {
            return res.status(400).json({
                message:
                    "Email and password are required."
            });
        }

        // --------------------------------------------------
        // FIND USER
        // --------------------------------------------------

        const normalizedEmail =
            email.trim().toLowerCase();

        const user =
            await User.findOne({
                email: normalizedEmail
            });

        if (!user) {
            return res.status(401).json({
                message:
                    "Invalid email or password."
            });
        }

        // --------------------------------------------------
        // VERIFY PASSWORD
        // --------------------------------------------------

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordMatch) {
            return res.status(401).json({
                message:
                    "Invalid email or password."
            });
        }

        // --------------------------------------------------
        // CREATE JWT
        // --------------------------------------------------

        const token =
            jwt.sign(
                {
                    userId:
                        user._id.toString(),
                    role:
                        user.role
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "1d"
                }
            );

        // --------------------------------------------------
        // RESPONSE
        // --------------------------------------------------

        return res.status(200).json({
            message:
                "Login successful.",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        return res.status(500).json({
            message:
                "Login failed.",
            error:
                error.message
        });
    }
};


/**
 * Google login: allow only existing E-Outpass users.
 */
const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body || {};

        if (!credential) {
            return res.status(400).json({
                message: "Google credential is required."
            });
        }

        if (!process.env.GOOGLE_CLIENT_ID || !process.env.JWT_SECRET) {
            return res.status(500).json({
                message: "Google login is not configured."
            });
        }

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

        const email = payload.email.trim().toLowerCase();

        // Never create a user through Google login.
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(403).json({
                message:
                    "No E-Outpass account exists for this Google email. Please contact the administrator."
            });
        }

        const token = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
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
        console.error("Google login error:", error.message);

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
