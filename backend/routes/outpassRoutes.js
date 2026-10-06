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

router.post(
    "/request",
    protect,
    authorize("parent"),
    requestOutpass
);

router.get(
    "/my-student",
    protect,
    authorize("parent"),
    getMyStudent
);

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

router.get(
    "/academic-pending",
    protect,
    authorize("hod", "classAdvisor"),
    getAcademicPendingOutpasses
);

router.patch(
    "/:outpassId/academic-approve",
    protect,
    authorize("hod", "classAdvisor"),
    approveAcademicOutpass
);

router.patch(
    "/:outpassId/academic-reject",
    protect,
    authorize("hod", "classAdvisor"),
    rejectAcademicOutpass
);

// ======================================================
// WARDEN ROUTES
// ======================================================

router.get(
    "/pending",
    protect,
    authorize("warden"),
    getPendingOutpasses
);

router.get(
    "/history",
    protect,
    authorize("warden"),
    getWardenOutpassHistory
);

router.get(
    "/warden-history",
    protect,
    authorize("warden"),
    getWardenOutpassHistory
);

router.patch(
    "/:outpassId/approve",
    protect,
    authorize("warden"),
    approveOutpass
);

router.patch(
    "/:outpassId/reject",
    protect,
    authorize("warden"),
    rejectOutpass
);

// ======================================================
// SECURITY ROUTES
// ======================================================

router.get(
    "/approved",
    protect,
    authorize("security"),
    getSecurityApprovedOutpasses
);

router.get(
    "/security-approved",
    protect,
    authorize("security"),
    getSecurityApprovedOutpasses
);

// ======================================================
// VALIDATE OUTPASS
// ======================================================

router.get(
    "/validate/:outpassId",
    protect,
    authorize("security"),
    validateOutpass
);

router.get(
    "/:outpassId/validate",
    protect,
    authorize("security"),
    validateOutpass
);

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

// ======================================================
// SCAN OUT
// ======================================================

router.post(
    "/:outpassId/scan-out",
    protect,
    authorize("security"),
    scanOut
);

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

// ======================================================
// SCAN IN
// ======================================================

router.post(
    "/:outpassId/scan-in",
    protect,
    authorize("security"),
    scanIn
);

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

// ------------------------------------------------------
// EXIT QR
// /gate/exit/:outpassId
// ------------------------------------------------------

router.get(
    "/public-gate-status/exit/:outpassId",
    (req, res, next) => {
        req.params.qrAction = "exit";
        next();
    },
    publicGateStatus
);

router.post(
    "/public-gate-confirm/exit/:outpassId",
    (req, res, next) => {
        req.params.qrAction = "exit";
        next();
    },
    publicGateConfirm
);

// ------------------------------------------------------
// RETURN / ENTRY QR
// /gate/return/:outpassId
// ------------------------------------------------------

router.get(
    "/public-gate-status/return/:outpassId",
    (req, res, next) => {
        req.params.qrAction = "return";
        next();
    },
    publicGateStatus
);

router.post(
    "/public-gate-confirm/return/:outpassId",
    (req, res, next) => {
        req.params.qrAction = "return";
        next();
    },
    publicGateConfirm
);

// ------------------------------------------------------
// LEGACY PUBLIC QR ROUTES
// Kept temporarily for compatibility
// ------------------------------------------------------

router.get(
    "/public-gate-status/:outpassId",
    publicGateStatus
);

router.post(
    "/public-gate-confirm/:outpassId",
    publicGateConfirm
);

// ======================================================
// STUDENT GATE ROUTES
// LOGIN REQUIRED
// ======================================================

router.get(
    "/:outpassId/gate-status",
    protect,
    authorize("student"),
    studentGateStatus
);

router.post(
    "/:outpassId/gate-action",
    protect,
    authorize("student"),
    studentConfirmGateAction
);

// ======================================================
// LEGACY STUDENT GATE ROUTES
// ======================================================

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