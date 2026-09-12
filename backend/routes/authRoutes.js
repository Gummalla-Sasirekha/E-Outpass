const express = require("express");

const {
    registerUser,
    loginUser
} = require("../controllers/authController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected Warden-only test route
router.get(
    "/protected",
    protect,
    authorize("warden"),
    (req, res) => {
        res.status(200).json({
            message: "You accessed a Warden-only protected route!",
            user: req.user
        });
    }
);

module.exports = router;