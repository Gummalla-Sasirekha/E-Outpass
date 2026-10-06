const express = require("express");

const {
    // ==========================================
    // PARENT
    // ==========================================

    requestOutpass,
    getMyStudent,
    getMyOutpasses,


    // ==========================================
    // WARDEN
    // ==========================================

    getPendingOutpasses,
    getWardenOutpassHistory,
    approveOutpass,
    rejectOutpass,


    // ==========================================
    // ACADEMIC
    // ==========================================

    getAcademicPendingOutpasses,
    approveAcademicOutpass,
    rejectAcademicOutpass,


    // ==========================================
    // SECURITY
    // ==========================================

    validateOutpass,
    getSecurityApprovedOutpasses,
    scanOut,
    scanIn,
    getGateHistory,


    // ==========================================
    // QR GATE
    // ==========================================

    studentGateStatus,
    studentConfirmGateAction

} = require("../controllers/outpassController");


const {
    protect,
    authorize
} = require("../middleware/authMiddleware");


const router = express.Router();


// ======================================================
// PARENT ROUTES
// ======================================================


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


// ======================================================
// ACADEMIC APPROVAL ROUTES
// HOD / CLASS ADVISOR
// ======================================================
//
// WEEKDAY FLOW:
//
// Parent
//    ↓
// Class Advisor
//    ↓
// Warden
//
// If Class Advisor is unavailable:
//
// Parent
//    ↓
// HOD
//    ↓
// Warden
//
// The controller decides the actual assignment.
// These routes only allow the assigned academic
// authority to act.
// ======================================================


// Get academic requests assigned to the
// currently logged-in HOD / Class Advisor
router.get(
    "/academic-pending",
    protect,
    authorize(
        "hod",
        "classAdvisor"
    ),
    getAcademicPendingOutpasses
);


// Approve assigned academic request
router.patch(
    "/:outpassId/academic-approve",
    protect,
    authorize(
        "hod",
        "classAdvisor"
    ),
    approveAcademicOutpass
);


// Reject assigned academic request
router.patch(
    "/:outpassId/academic-reject",
    protect,
    authorize(
        "hod",
        "classAdvisor"
    ),
    rejectAcademicOutpass
);


// ======================================================
// WARDEN ROUTES
// ======================================================
//
// Warden receives:
//
// 1. Weekend requests directly
//
// 2. Weekday requests only AFTER
//    academic approval
//
// ======================================================


// Get requests waiting for warden approval
router.get(
    "/pending",
    protect,
    authorize("warden"),
    getPendingOutpasses
);


// Get complete outpass history
// for warden's hostel
router.get(
    "/warden-history",
    protect,
    authorize("warden"),
    getWardenOutpassHistory
);


// Approve outpass
router.patch(
    "/:outpassId/approve",
    protect,
    authorize("warden"),
    approveOutpass
);


// Reject outpass
router.patch(
    "/:outpassId/reject",
    protect,
    authorize("warden"),
    rejectOutpass
);


// ======================================================
// GATE HISTORY
// ======================================================
//
// SECURITY → All hostel gate records
//
// WARDEN → Only their hostel records
//
// ======================================================

router.get(
    "/gate-history",
    protect,
    authorize(
        "security",
        "warden"
    ),
    getGateHistory
);


// ======================================================
// SECURITY ROUTES
// ======================================================


// Get all approved outpasses
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


// ======================================================
// QR GATE ROUTES
// ======================================================
//
// These routes are PUBLIC.
//
// First scan:
//     Confirm Exit → OUT
//
// Second scan:
//     Confirm Return → IN
//
// No student login required.
// ======================================================

router.post(
    "/student-status",
    studentGateStatus
);


router.post(
    "/student-confirm",
    studentConfirmGateAction
);


// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;