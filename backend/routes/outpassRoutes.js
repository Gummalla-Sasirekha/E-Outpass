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
    hodTakeOverAcademicApproval,


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


// Get pending academic approval requests
//
// Class Advisor:
//     Gets requests assigned to classAdvisor
//
// HOD:
//     Gets requests assigned to hod
//
router.get(
    "/academic-pending",
    protect,
    authorize("hod", "classAdvisor"),
    getAcademicPendingOutpasses
);


// Approve weekday outpass academically
//
// HOD / Class Advisor
//
router.patch(
    "/:outpassId/academic-approve",
    protect,
    authorize("hod", "classAdvisor"),
    approveAcademicOutpass
);


// Reject weekday outpass academically
//
// HOD / Class Advisor
//
router.patch(
    "/:outpassId/academic-reject",
    protect,
    authorize("hod", "classAdvisor"),
    rejectAcademicOutpass
);


// HOD fallback
//
// Used when Class Advisor accounts are unavailable.
//
router.patch(
    "/:outpassId/hod-takeover",
    protect,
    authorize("hod"),
    hodTakeOverAcademicApproval
);


// ======================================================
// WARDEN ROUTES
// ======================================================


// Get requests waiting for warden approval
//
// Includes:
//     Weekend requests
//     Weekday requests after academic approval
//
router.get(
    "/pending",
    protect,
    authorize("warden"),
    getPendingOutpasses
);


// Get complete outpass history for warden's hostel
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
// Filtering is handled by the controller.
//

router.get(
    "/gate-history",
    protect,
    authorize("security", "warden"),
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
// These routes are intentionally PUBLIC.
//
// Student scans the QR.
//
// First scan:
//     Confirm Exit → OUT
//
// Second scan:
//     Confirm Return → IN
//
// No student login required.
//

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