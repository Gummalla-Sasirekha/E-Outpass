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
    getGateHistory
} = require("../controllers/outpassController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

// ======================================================
// PARENT
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
// WARDEN
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
// SECURITY
// ======================================================

router.get(
    "/approved",
    protect,
    authorize("security"),
    getSecurityApprovedOutpasses
);

router.get(
    "/validate/:outpassId",
    protect,
    authorize("security"),
    validateOutpass
);

router.post(
    "/:outpassId/scan-out",
    protect,
    authorize("security"),
    scanOut
);

router.post(
    "/:outpassId/scan-in",
    protect,
    authorize("security"),
    scanIn
);

// ======================================================
// STUDENT GATE
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