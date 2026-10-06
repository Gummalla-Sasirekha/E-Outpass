const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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

// ======================================================
// EXPORT
// ======================================================

module.exports = {
    registerUser,
    loginUser
};