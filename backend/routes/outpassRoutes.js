const express = require("express");

const router = express.Router();

const {
    requestOutpass,
    getMyStudent,
    getMyOutpasses,

    getPendingOutpasses,
    getWardenOutpassHistory,
    approveOutpass,
    rejectOutpass,

    getAcademicPendingOutpasses,
    approveAcademicOutpass,
    rejectAcademicOutpass,

    validateOutpass,
    getSecurityApprovedOutpasses,
    scanOut,
    scanIn,

    studentGateStatus,
    studentConfirmGateAction,

    publicGateStatus,
    publicGateConfirm,

    getGateHistory
} = require("../controllers/outpassController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");


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

// Get linked student
router.get(
    "/my-student",
    protect,
    authorize("parent"),
    getMyStudent
);

// Get parent's outpasses
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

// Get academic approval requests
router.get(
    "/academic-pending",
    protect,
    authorize("hod", "classAdvisor"),
    getAcademicPendingOutpasses
);

// Approve academic request
router.patch(
    "/:outpassId/academic-approve",
    protect,
    authorize("hod", "classAdvisor"),
    approveAcademicOutpass
);

// Reject academic request
router.patch(
    "/:outpassId/academic-reject",
    protect,
    authorize("hod", "classAdvisor"),
    rejectAcademicOutpass
);


// ======================================================
// WARDEN ROUTES
// ======================================================

// Pending requests
router.get(
    "/pending",
    protect,
    authorize("warden"),
    getPendingOutpasses
);

// Current frontend route
router.get(
    "/history",
    protect,
    authorize("warden"),
    getWardenOutpassHistory
);

// Legacy frontend route
router.get(
    "/warden-history",
    protect,
    authorize("warden"),
    getWardenOutpassHistory
);

// Approve
router.patch(
    "/:outpassId/approve",
    protect,
    authorize("warden"),
    approveOutpass
);

// Reject
router.patch(
    "/:outpassId/reject",
    protect,
    authorize("warden"),
    rejectOutpass
);


// ======================================================
// SECURITY ROUTES
// ======================================================

// Current frontend route
router.get(
    "/approved",
    protect,
    authorize("security"),
    getSecurityApprovedOutpasses
);

// Legacy frontend route
router.get(
    "/security-approved",
    protect,
    authorize("security"),
    getSecurityApprovedOutpasses
);


// ------------------------------------------------------
// VALIDATE OUTPASS
// ------------------------------------------------------

// Current route
router.get(
    "/validate/:outpassId",
    protect,
    authorize("security"),
    validateOutpass
);

// Additional compatible route
router.get(
    "/:outpassId/validate",
    protect,
    authorize("security"),
    validateOutpass
);

// Legacy route
// Frontend sends outpassId in request body
router.post(
    "/validate",
    protect,
    authorize("security"),
    (req, res, next) => {

        if (!req.body || !req.body.outpassId) {
            return res.status(400).json({
                valid: false,
                message: "Outpass ID is required."
            });
        }

        req.params.outpassId =
            req.body.outpassId;

        next();
    },
    validateOutpass
);


// ------------------------------------------------------
// SCAN OUT
// ------------------------------------------------------

// Current route
router.post(
    "/:outpassId/scan-out",
    protect,
    authorize("security"),
    scanOut
);

// Legacy route
// Frontend sends outpassId in request body
router.post(
    "/scan-out",
    protect,
    authorize("security"),
    (req, res, next) => {

        if (!req.body || !req.body.outpassId) {
            return res.status(400).json({
                message: "Outpass ID is required."
            });
        }

        req.params.outpassId =
            req.body.outpassId;

        next();
    },
    scanOut
);


// ------------------------------------------------------
// SCAN IN
// ------------------------------------------------------

// Current route
router.post(
    "/:outpassId/scan-in",
    protect,
    authorize("security"),
    scanIn
);

// Legacy route
// Frontend sends outpassId in request body
router.post(
    "/scan-in",
    protect,
    authorize("security"),
    (req, res, next) => {

        if (!req.body || !req.body.outpassId) {
            return res.status(400).json({
                message: "Outpass ID is required."
            });
        }

        req.params.outpassId =
            req.body.outpassId;

        next();
    },
    scanIn
);


// ======================================================
// PUBLIC QR GATE ROUTES
// NO LOGIN REQUIRED
// ======================================================

// QR scan checks whether the outpass can exit or return
router.get(
    "/public-gate-status/:outpassId",
    publicGateStatus
);

// QR confirmation records exit / return
router.post(
    "/public-gate-confirm/:outpassId",
    publicGateConfirm
);


// ======================================================
// STUDENT GATE ROUTES
// LOGIN REQUIRED
// ======================================================

// Current route
router.get(
    "/:outpassId/gate-status",
    protect,
    authorize("student"),
    studentGateStatus
);

// Current route
router.post(
    "/:outpassId/gate-action",
    protect,
    authorize("student"),
    studentConfirmGateAction
);


// ------------------------------------------------------
// LEGACY STUDENT GATE ROUTES
// ------------------------------------------------------

// Legacy frontend sends outpassId in body
router.post(
    "/student-status",
    protect,
    authorize("student"),
    (req, res, next) => {

        if (!req.body || !req.body.outpassId) {
            return res.status(400).json({
                message: "Outpass ID is required."
            });
        }

        req.params.outpassId =
            req.body.outpassId;

        next();
    },
    studentGateStatus
);

// Legacy frontend sends outpassId + action in body
router.post(
    "/student-confirm",
    protect,
    authorize("student"),
    (req, res, next) => {

        if (!req.body || !req.body.outpassId) {
            return res.status(400).json({
                message: "Outpass ID is required."
            });
        }

        req.params.outpassId =
            req.body.outpassId;

        next();
    },
    studentConfirmGateAction
);


// ======================================================
// GATE HISTORY
// ======================================================

router.get(
    "/gate-history",
    protect,
    authorize(
        "security",
        "student",
        "parent",
        "warden"
    ),
    getGateHistory
);


// ======================================================
// EXPORT
// ======================================================

module.exports = router;