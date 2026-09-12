const express = require("express");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

// Test route for any logged-in user
router.get("/protected", protect, (req, res) => {
    res.json({
        message: "You are authenticated!",
        user: req.user
    });
});

// Test route for parents only
router.get(
    "/parent",
    protect,
    authorize("parent"),
    (req, res) => {
        res.json({
            message: "Welcome Parent!",
            user: req.user
        });
    }
);

// Test route for wardens only
router.get(
    "/warden",
    protect,
    authorize("warden"),
    (req, res) => {
        res.json({
            message: "Welcome Warden!",
            user: req.user
        });
    }
);

// Test route for security only
router.get(
    "/security",
    protect,
    authorize("security"),
    (req, res) => {
        res.json({
            message: "Welcome Security!",
            user: req.user
        });
    }
);

module.exports = router;