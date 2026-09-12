const express = require("express");

const {
    getMyProfile,
    getMyOutpasses
} = require("../controllers/studentController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();


// ==========================================
// STUDENT PROFILE
// ==========================================

router.get(
    "/me",
    protect,
    authorize("student"),
    getMyProfile
);


// ==========================================
// STUDENT OUTPASSES
// ==========================================

router.get(
    "/outpasses",
    protect,
    authorize("student"),
    getMyOutpasses
);


module.exports = router;