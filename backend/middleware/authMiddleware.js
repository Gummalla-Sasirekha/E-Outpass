const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ======================================================
// PROTECT ROUTES
// ======================================================

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // --------------------------------------------------
        // CHECK AUTHORIZATION HEADER
        // --------------------------------------------------

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                message: "Not authorized. No token provided."
            });
        }

        // --------------------------------------------------
        // GET TOKEN
        // --------------------------------------------------

        const token =
            authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Not authorized. Invalid token."
            });
        }

        // --------------------------------------------------
        // VERIFY TOKEN
        // --------------------------------------------------

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        // --------------------------------------------------
        // FIND USER
        // --------------------------------------------------

        const user =
            await User.findById(
                decoded.userId
            ).select("-password");

        if (!user) {
            return res.status(401).json({
                message: "User no longer exists."
            });
        }

        // --------------------------------------------------
        // ATTACH USER TO REQUEST
        // --------------------------------------------------

        req.user = {
            userId: user._id.toString(),
            role: user.role,
            name: user.name,
            email: user.email
        };

        next();

    } catch (error) {

        console.error(
            "Authentication error:",
            error
        );

        if (
            error.name ===
            "TokenExpiredError"
        ) {
            return res.status(401).json({
                message: "Token has expired. Please login again."
            });
        }

        if (
            error.name ===
            "JsonWebTokenError"
        ) {
            return res.status(401).json({
                message: "Invalid authentication token."
            });
        }

        return res.status(401).json({
            message: "Not authorized."
        });
    }
};

// ======================================================
// AUTHORIZE ROLES
// ======================================================

const authorize = (...allowedRoles) => {

    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                message: "Not authorized."
            });
        }

        if (
            !allowedRoles.includes(
                req.user.role
            )
        ) {
            return res.status(403).json({
                message:
                    "You are not authorized to access this resource."
            });
        }

        next();
    };
};

// ======================================================
// EXPORT
// ======================================================

module.exports = {
    protect,
    authorize
};