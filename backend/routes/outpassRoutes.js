const express = require("express");

const {
    requestOutpass,
    getMyStudent,
    getMyOutpasses,

    getPendingOutpasses,
    getWardenOutpassHistory,
    approveOutpass,
    rejectOutpass,

    validateOutpass,
    getSecurityApprovedOutpasses,
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


// Get all outpasses for warden's hostel
// Used for Pending / Approved / Rejected / Completed
router.get(
    "/warden-history",
    protect,
    authorize("warden"),
    getWardenOutpassHistory
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
// GATE HISTORY
// ==========================================
//
// SECURITY → Can see ALL hostel gate records
// WARDEN   → Can see ONLY their own hostel records
//
// The controller performs the hostel filtering.
// ==========================================

router.get(
    "/gate-history",
    protect,
    authorize("security", "warden"),
    getGateHistory
);


// ==========================================
// SECURITY ROUTES
// ==========================================


// Get all approved outpasses for Security
router.get(
    "/security-approved",
    protect,
    authorize("security"),
    getSecurityApprovedOutpasses
);

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


// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;