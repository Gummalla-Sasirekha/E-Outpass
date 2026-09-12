const express = require("express");

const {
    requestOutpass,
    getMyStudent,
    getMyOutpasses,

    getPendingOutpasses,
    approveOutpass,
    rejectOutpass,

    validateOutpass,
    scanOut,
    scanIn,
    getGateHistory,

    studentGateStatus,
    studentConfirmGateAction
} = require("../controllers/outpassController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();


// ==========================================
// PARENT ROUTES
// ==========================================

// Request a new outpass
router.post(
    "/request",
    protect,
    authorize("parent"),
    requestOutpass
);

// Get the student linked to this parent
router.get(
    "/my-student",
    protect,
    authorize("parent"),
    getMyStudent
);

// Get all outpasses requested by this parent
router.get(
    "/my",
    protect,
    authorize("parent"),
    getMyOutpasses
);


// ==========================================
// WARDEN ROUTES
// ==========================================

// Get pending requests for warden's hostel
router.get(
    "/pending",
    protect,
    authorize("warden"),
    getPendingOutpasses
);

// Approve an outpass
router.patch(
    "/:outpassId/approve",
    protect,
    authorize("warden"),
    approveOutpass
);

// Reject an outpass
router.patch(
    "/:outpassId/reject",
    protect,
    authorize("warden"),
    rejectOutpass
);


// ==========================================
// SECURITY ROUTES
// ==========================================

// Validate an outpass
router.post(
    "/validate",
    protect,
    authorize("security"),
    validateOutpass
);

// Record student OUT
router.post(
    "/scan-out",
    protect,
    authorize("security"),
    scanOut
);

// Record student IN
router.post(
    "/scan-in",
    protect,
    authorize("security"),
    scanIn
);

// Get gate history
router.get(
    "/gate-history",
    protect,
    authorize("security"),
    getGateHistory
);


// ==========================================
// QR GATE ROUTES
// ==========================================
//
// Student does NOT need an account/login.
//
// The QR contains the unique Outpass ID.
//
// First scan:
//     Confirm Exit → records OUT
//
// Second scan:
//     Confirm Return → records IN
//
// ==========================================

// Check whether the student should EXIT or RETURN
router.post(
    "/student-status",
    studentGateStatus
);

// Confirm EXIT / RETURN
router.post(
    "/student-confirm",
    studentConfirmGateAction
);


module.exports = router;