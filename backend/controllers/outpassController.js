const Outpass = require("../models/Outpass");
const Student = require("../models/Student");
const Hostel = require("../models/Hostel");
const GateLog = require("../models/GateLog");
const User = require("../models/User");
const QRCode = require("qrcode");


// ======================================================
// HELPER - DETERMINE DAY TYPE
// ======================================================

const getDayType = (date) => {

    const dateObject = new Date(date);

    if (Number.isNaN(dateObject.getTime())) {
        return null;
    }

    const day = dateObject.getDay();

    return day === 0 || day === 6
        ? "weekend"
        : "weekday";
};


// ======================================================
// HELPER - DETERMINE ACADEMIC APPROVER
// ======================================================
//
// WEEKDAY FLOW:
//
// 1. Check student's Class Advisor.
// 2. If Class Advisor exists and is available,
//    assign request to Class Advisor.
// 3. If Class Advisor is unavailable,
//    assign request to student's HOD.
//
// ======================================================

const determineAcademicApprover = async (student) => {

    // ==========================================
    // CLASS ADVISOR
    // ==========================================

    if (student.classAdvisor) {

        const classAdvisor =
            await User.findOne({
                _id: student.classAdvisor,
                role: "classAdvisor"
            });

        if (
            classAdvisor &&
            classAdvisor.isAvailable === true
        ) {

            return {
                role: "classAdvisor",
                userId: classAdvisor._id
            };
        }
    }


    // ==========================================
    // HOD FALLBACK
    // ==========================================

    if (student.hod) {

        const hod =
            await User.findOne({
                _id: student.hod,
                role: "hod"
            });

        if (hod) {

            return {
                role: "hod",
                userId: hod._id
            };
        }
    }


    // ==========================================
    // NO AUTHORITY CONFIGURED
    // ==========================================

    return null;
};


// ======================================================
// REQUEST OUTPASS - PARENT
// ======================================================

const requestOutpass = async (req, res) => {

    try {

        const {
            studentId,
            placeOfVisit,
            reason,
            dateRequestedFor,
            timeOfLeaving,
            expectedInTime
        } = req.body;


        // ==========================================
        // VALIDATE INPUT
        // ==========================================

        if (
            !studentId ||
            !placeOfVisit ||
            !reason ||
            !dateRequestedFor ||
            !timeOfLeaving ||
            !expectedInTime
        ) {

            return res.status(400).json({
                message:
                    "All fields are required."
            });
        }


        // ==========================================
        // FIND STUDENT
        // ==========================================

        const student =
            await Student.findOne({

                studentId:
                    String(studentId),

                parent:
                    req.user.userId

            })
                .populate("hostel")
                .populate("hod")
                .populate("classAdvisor");


        if (!student) {

            return res.status(404).json({
                message:
                    "Student not found or not linked to this parent."
            });
        }


        // ==========================================
        // CHECK HOSTEL
        // ==========================================

        if (!student.hostel) {

            return res.status(400).json({
                message:
                    "Student is not assigned to a hostel."
            });
        }


        // ==========================================
        // DETERMINE DAY TYPE
        // ==========================================

        const dayType =
            getDayType(dateRequestedFor);


        if (!dayType) {

            return res.status(400).json({
                message:
                    "Invalid outpass date."
            });
        }


        // ==========================================
        // DEFAULT WEEKEND FLOW
        // ==========================================

        let academicApprovalRequired =
            false;

        let academicApprovalBy =
            null;

        let academicApprover =
            null;

        let academicApprovalStatus =
            "not_required";

        let initialStatus =
            "warden_pending";


        // ==========================================
        // WEEKDAY FLOW
        // ==========================================

        if (dayType === "weekday") {

            academicApprovalRequired =
                true;


            const academicAssignment =
                await determineAcademicApprover(
                    student
                );


            // --------------------------------------
            // NO CA / HOD CONFIGURED
            // --------------------------------------

            if (!academicAssignment) {

                return res.status(400).json({
                    message:
                        "No Class Advisor or HOD is configured for this student."
                });
            }


            academicApprovalBy =
                academicAssignment.role;

            academicApprover =
                academicAssignment.userId;

            academicApprovalStatus =
                "pending";

            initialStatus =
                "academic_pending";
        }


        // ==========================================
        // CREATE OUTPASS ID
        // ==========================================

        const outpassId =
            `OP-${Date.now()}-${Math.floor(
                100 + Math.random() * 900
            )}`;


        // ==========================================
        // CREATE OUTPASS
        // ==========================================

        const outpass =
            await Outpass.create({

                outpassId,

                student:
                    student._id,

                parent:
                    req.user.userId,

                hostel:
                    student.hostel._id,

                placeOfVisit,

                reason,

                dateRequestedFor:
                    new Date(dateRequestedFor),

                timeOfLeaving,

                expectedInTime,

                dayType,

                academicApprovalRequired,

                academicApprovalBy,

                academicApprover,

                academicApprovalStatus,

                status:
                    initialStatus,

                wardenApprovalStatus:
                    "pending"
            });


        // ==========================================
        // POPULATE RESPONSE
        // ==========================================

        const populatedOutpass =
            await Outpass.findById(
                outpass._id
            )

                .populate(
                    "student",
                    "studentId name course roomNumber"
                )

                .populate(
                    "hostel",
                    "name type"
                )

                .populate(
                    "academicApprover",
                    "name email role isAvailable"
                );


        return res.status(201).json({

            message:
                dayType === "weekend"

                    ? "Weekend outpass request submitted to warden."

                    : `Weekday outpass request submitted for ${
                        academicApprovalBy === "classAdvisor"
                            ? "Class Advisor"
                            : "HOD"
                    } approval.`,

            outpass:
                populatedOutpass
        });

    } catch (error) {

        console.error(
            "Request outpass error:",
            error
        );

        return res.status(500).json({
            message:
                "Server error while requesting outpass."
        });
    }
};


// ======================================================
// GET MY STUDENT - PARENT
// ======================================================

const getMyStudent = async (req, res) => {

    try {

        const student =
            await Student.findOne({

                parent:
                    req.user.userId

            })

                .populate(
                    "hostel",
                    "name type"
                )

                .populate(
                    "hod",
                    "name email role"
                )

                .populate(
                    "classAdvisor",
                    "name email role isAvailable"
                );


        if (!student) {

            return res.status(404).json({
                message:
                    "No student is linked to this parent."
            });
        }


        return res.status(200).json({
            student
        });

    } catch (error) {

        console.error(
            "Get my student error:",
            error
        );

        return res.status(500).json({
            message:
                "Server error while fetching linked student."
        });
    }
};


// ======================================================
// GET MY OUTPASSES - PARENT
// ======================================================

const getMyOutpasses = async (req, res) => {

    try {

        const outpasses =
            await Outpass.find({

                parent:
                    req.user.userId

            })

                .populate(
                    "student",
                    "studentId name course roomNumber"
                )

                .populate(
                    "hostel",
                    "name type"
                )

                .populate(
                    "academicApprover",
                    "name email role"
                )

                .populate(
                    "academicApprovedBy",
                    "name email role"
                )

                .populate(
                    "academicRejectedBy",
                    "name email role"
                )

                .populate(
                    "wardenApprovedBy",
                    "name email role"
                )

                .sort({
                    createdAt: -1
                });


        return res.status(200).json({

            count:
                outpasses.length,

            outpasses
        });

    } catch (error) {

        console.error(
            "Get my outpasses error:",
            error
        );

        return res.status(500).json({
            message:
                "Server error while fetching outpasses."
        });
    }
};


// ======================================================
// GET PENDING OUTPASSES - WARDEN
// ======================================================

const getPendingOutpasses = async (req, res) => {

    try {

        const hostel =
            await Hostel.findOne({

                warden:
                    req.user.userId
            });


        if (!hostel) {

            return res.status(404).json({
                message:
                    "No hostel is assigned to this warden."
            });
        }


        const outpasses =
            await Outpass.find({

                hostel:
                    hostel._id,

                status:
                    "warden_pending"

            })

                .populate(
                    "student",
                    "studentId name course roomNumber"
                )

                .populate(
                    "parent",
                    "name email"
                )

                .populate(
                    "academicApprover",
                    "name email role"
                )

                .populate(
                    "academicApprovedBy",
                    "name email role"
                )

                .populate(
                    "academicRejectedBy",
                    "name email role"
                )

                .sort({
                    createdAt: -1
                });


        return res.status(200).json({

            hostel:
                hostel.name,

            count:
                outpasses.length,

            outpasses
        });

    } catch (error) {

        console.error(
            "Get pending outpasses error:",
            error
        );

        return res.status(500).json({
            message:
                "Server error while fetching pending requests."
        });
    }
};


// ======================================================
// GET WARDEN OUTPASS HISTORY
// ======================================================

const getWardenOutpassHistory =
    async (req, res) => {

        try {

            const hostel =
                await Hostel.findOne({

                    warden:
                        req.user.userId
                });


            if (!hostel) {

                return res.status(404).json({
                    message:
                        "No hostel is assigned to this warden."
                });
            }


            const outpasses =
                await Outpass.find({

                    hostel:
                        hostel._id

                })

                    .populate(
                        "student",
                        "studentId name course roomNumber"
                    )

                    .populate(
                        "parent",
                        "name email"
                    )

                    .populate(
                        "hostel",
                        "name type"
                    )

                    .populate(
                        "academicApprover",
                        "name email role"
                    )

                    .populate(
                        "academicApprovedBy",
                        "name email role"
                    )

                    .populate(
                        "academicRejectedBy",
                        "name email role"
                    )

                    .populate(
                        "wardenApprovedBy",
                        "name email role"
                    )

                    .sort({
                        createdAt: -1
                    });


            return res.status(200).json({

                hostel:
                    hostel.name,

                count:
                    outpasses.length,

                outpasses
            });

        } catch (error) {

            console.error(
                "Get warden outpass history error:",
                error
            );

            return res.status(500).json({
                message:
                    "Server error while fetching warden outpass history."
            });
        }
    };


// ======================================================
// GET ACADEMIC PENDING OUTPASSES
// HOD / CLASS ADVISOR
// ======================================================
//
// The logged-in academic authority only sees requests
// specifically assigned to that account.
//
// HOD will NOT see requests assigned to an available CA.
//
// ======================================================

const getAcademicPendingOutpasses =
    async (req, res) => {

        try {

            const role =
                req.user.role;


            if (
                role !== "hod" &&
                role !== "classAdvisor"
            ) {

                return res.status(403).json({
                    message:
                        "Only HOD or Class Advisor can access academic approval requests."
                });
            }


            const outpasses =
                await Outpass.find({

                    academicApprovalRequired:
                        true,

                    academicApprovalStatus:
                        "pending",

                    academicApprover:
                        req.user.userId

                })

                    .populate(
                        "student",
                        "studentId name course roomNumber"
                    )

                    .populate(
                        "parent",
                        "name email"
                    )

                    .populate(
                        "hostel",
                        "name type"
                    )

                    .populate(
                        "academicApprover",
                        "name email role isAvailable"
                    )

                    .sort({
                        createdAt: -1
                    });


            return res.status(200).json({

                role,

                count:
                    outpasses.length,

                outpasses
            });

        } catch (error) {

            console.error(
                "Get academic pending outpasses error:",
                error
            );

            return res.status(500).json({
                message:
                    "Server error while fetching academic approval requests."
            });
        }
    };


// ======================================================
// APPROVE OUTPASS - ACADEMIC
// HOD / CLASS ADVISOR
// ======================================================

const approveAcademicOutpass =
    async (req, res) => {

        try {

            const {
                outpassId
            } = req.params;

            const role =
                req.user.role;


            if (
                role !== "hod" &&
                role !== "classAdvisor"
            ) {

                return res.status(403).json({
                    message:
                        "Only HOD or Class Advisor can approve academic requests."
                });
            }


            // ==========================================
            // FIND REQUEST ASSIGNED TO THIS USER
            // ==========================================

            const outpass =
                await Outpass.findOne({

                    outpassId,

                    academicApprovalRequired:
                        true,

                    academicApprovalStatus:
                        "pending",

                    academicApprover:
                        req.user.userId

                });


            if (!outpass) {

                return res.status(404).json({
                    message:
                        "Academic approval request not found or not assigned to you."
                });
            }


            // ==========================================
            // APPROVE
            // ==========================================

            outpass.academicApprovalStatus =
                "approved";

            outpass.academicApprovedBy =
                req.user.userId;

            outpass.academicApprovedAt =
                new Date();

            outpass.academicRejectedBy =
                null;

            outpass.academicRejectedAt =
                null;

            outpass.academicRejectionReason =
                "";


            // ==========================================
            // SEND TO WARDEN
            // ==========================================

            outpass.status =
                "warden_pending";

            outpass.wardenApprovalStatus =
                "pending";


            await outpass.save();


            const populatedOutpass =
                await Outpass.findById(
                    outpass._id
                )

                    .populate(
                        "student",
                        "studentId name course roomNumber"
                    )

                    .populate(
                        "hostel",
                        "name type"
                    )

                    .populate(
                        "academicApprover",
                        "name email role"
                    )

                    .populate(
                        "academicApprovedBy",
                        "name email role"
                    );


            return res.status(200).json({

                message:
                    "Academic approval granted. Outpass sent to warden.",

                outpass:
                    populatedOutpass
            });

        } catch (error) {

            console.error(
                "Academic approval error:",
                error
            );

            return res.status(500).json({
                message:
                    "Server error while approving academic request."
            });
        }
    };


// ======================================================
// REJECT OUTPASS - ACADEMIC
// HOD / CLASS ADVISOR
// ======================================================

const rejectAcademicOutpass =
    async (req, res) => {

        try {

            const {
                outpassId
            } = req.params;

            const {
                rejectionReason
            } = req.body;

            const role =
                req.user.role;


            // ==========================================
            // CHECK AUTHORITY
            // ==========================================

            if (
                role !== "hod" &&
                role !== "classAdvisor"
            ) {

                return res.status(403).json({
                    message:
                        "Only HOD or Class Advisor can reject academic requests."
                });
            }


            // ==========================================
            // VALIDATE REASON
            // ==========================================

            if (
                !rejectionReason ||
                !rejectionReason.trim()
            ) {

                return res.status(400).json({
                    message:
                        "Rejection reason is required."
                });
            }


            // ==========================================
            // FIND REQUEST ASSIGNED TO THIS USER
            // ==========================================

            const outpass =
                await Outpass.findOne({

                    outpassId,

                    academicApprovalRequired:
                        true,

                    academicApprovalStatus:
                        "pending",

                    academicApprover:
                        req.user.userId

                });


            if (!outpass) {

                return res.status(404).json({
                    message:
                        "Academic approval request not found or not assigned to you."
                });
            }


            // ==========================================
            // REJECT
            // ==========================================

            outpass.academicApprovalStatus =
                "rejected";

            outpass.academicRejectedBy =
                req.user.userId;

            outpass.academicRejectedAt =
                new Date();

            outpass.academicRejectionReason =
                rejectionReason.trim();


            // ==========================================
            // CLEAR APPROVAL RECORD
            // ==========================================

            outpass.academicApprovedBy =
                null;

            outpass.academicApprovedAt =
                null;


            // ==========================================
            // OVERALL STATUS
            // ==========================================

            outpass.status =
                "rejected";

            outpass.rejectionReason =
                rejectionReason.trim();


            await outpass.save();


            // ==========================================
            // POPULATE RESPONSE
            // ==========================================

            const populatedOutpass =
                await Outpass.findById(
                    outpass._id
                )

                    .populate(
                        "student",
                        "studentId name course roomNumber"
                    )

                    .populate(
                        "hostel",
                        "name type"
                    )

                    .populate(
                        "academicApprover",
                        "name email role"
                    )

                    .populate(
                        "academicRejectedBy",
                        "name email role"
                    );


            return res.status(200).json({

                message:
                    "Outpass rejected by academic authority.",

                outpass:
                    populatedOutpass
            });

        } catch (error) {

            console.error(
                "Academic rejection error:",
                error
            );

            return res.status(500).json({
                message:
                    "Server error while rejecting academic request."
            });
        }
    };


// ======================================================
// APPROVE OUTPASS - WARDEN
// ======================================================

const approveOutpass =
    async (req, res) => {

        try {

            const {
                outpassId
            } = req.params;


            const hostel =
                await Hostel.findOne({

                    warden:
                        req.user.userId
                });


            if (!hostel) {

                return res.status(404).json({
                    message:
                        "No hostel is assigned to this warden."
                });
            }


            const outpass =
                await Outpass.findOne({

                    outpassId,

                    hostel:
                        hostel._id

                });


            if (!outpass) {

                return res.status(404).json({
                    message:
                        "Outpass not found in your hostel."
                });
            }


            // ==========================================
            // CHECK STATUS
            // ==========================================

            if (
                outpass.status !==
                "warden_pending"
            ) {

                return res.status(400).json({
                    message:
                        `Outpass is currently ${outpass.status}. It cannot be approved by the warden yet.`
                });
            }


            // ==========================================
            // WEEKDAY ACADEMIC CHECK
            // ==========================================

            if (
                outpass.dayType === "weekday" &&
                outpass.academicApprovalRequired
            ) {

                if (
                    outpass.academicApprovalStatus !==
                    "approved"
                ) {

                    return res.status(400).json({
                        message:
                            "Academic approval is required before warden approval."
                    });
                }
            }


            // ==========================================
            // WEEKEND CHECK
            // ==========================================

            if (
                outpass.dayType === "weekend" &&
                outpass.academicApprovalRequired
            ) {

                return res.status(400).json({
                    message:
                        "Weekend requests should not require academic approval."
                });
            }


            // ==========================================
            // WARDEN APPROVAL
            // ==========================================

            outpass.wardenApprovalStatus =
                "approved";

            outpass.wardenApprovedBy =
                req.user.userId;

            outpass.wardenApprovedAt =
                new Date();

            outpass.status =
                "approved";

            outpass.approvedAt =
                new Date();


            // ==========================================
            // GENERATE QR
            // ==========================================

            const frontendUrl =
                process.env.FRONTEND_URL ||
                "http://192.168.1.38:5173";


            const gateUrl =
                `${frontendUrl}/gate/${encodeURIComponent(
                    outpass.outpassId
                )}`;


            outpass.qrCode =
                await QRCode.toDataURL(
                    gateUrl
                );


            await outpass.save();


            // ==========================================
            // POPULATE
            // ==========================================

            const populatedOutpass =
                await Outpass.findById(
                    outpass._id
                )

                    .populate(
                        "student",
                        "studentId name course roomNumber"
                    )

                    .populate(
                        "hostel",
                        "name type"
                    )

                    .populate(
                        "academicApprover",
                        "name email role"
                    )

                    .populate(
                        "academicApprovedBy",
                        "name email role"
                    )

                    .populate(
                        "wardenApprovedBy",
                        "name email role"
                    );


            return res.status(200).json({

                message:
                    "Outpass approved successfully.",

                outpass:
                    populatedOutpass
            });

        } catch (error) {

            console.error(
                "Approve outpass error:",
                error
            );

            return res.status(500).json({
                message:
                    "Server error while approving outpass."
            });
        }
    };


// ======================================================
// REJECT OUTPASS - WARDEN
// ======================================================

const rejectOutpass =
    async (req, res) => {

        try {

            const {
                outpassId
            } = req.params;

            const {
                rejectionReason
            } = req.body;


            // ==========================================
            // VALIDATE REASON
            // ==========================================

            if (
                !rejectionReason ||
                !rejectionReason.trim()
            ) {

                return res.status(400).json({
                    message:
                        "Rejection reason is required."
                });
            }


            // ==========================================
            // FIND WARDEN HOSTEL
            // ==========================================

            const hostel =
                await Hostel.findOne({

                    warden:
                        req.user.userId
                });


            if (!hostel) {

                return res.status(404).json({
                    message:
                        "No hostel is assigned to this warden."
                });
            }


            // ==========================================
            // FIND OUTPASS
            // ==========================================

            const outpass =
                await Outpass.findOne({

                    outpassId,

                    hostel:
                        hostel._id

                });


            if (!outpass) {

                return res.status(404).json({
                    message:
                        "Outpass not found in your hostel."
                });
            }


            // ==========================================
            // CHECK STATUS
            // ==========================================

            if (
                outpass.status !==
                "warden_pending"
            ) {

                return res.status(400).json({
                    message:
                        `Outpass is currently ${outpass.status}.`
                });
            }


            // ==========================================
            // REJECT
            // ==========================================

            outpass.status =
                "rejected";

            outpass.rejectionReason =
                rejectionReason.trim();

            outpass.wardenApprovalStatus =
                "rejected";

            outpass.wardenApprovedBy =
                req.user.userId;

            outpass.wardenApprovedAt =
                new Date();


            await outpass.save();


            // ==========================================
            // POPULATE
            // ==========================================

            const populatedOutpass =
                await Outpass.findById(
                    outpass._id
                )

                    .populate(
                        "student",
                        "studentId name course roomNumber"
                    )

                    .populate(
                        "hostel",
                        "name type"
                    );


            return res.status(200).json({

                message:
                    "Outpass rejected successfully.",

                outpass:
                    populatedOutpass
            });

        } catch (error) {

            console.error(
                "Reject outpass error:",
                error
            );

            return res.status(500).json({
                message:
                    "Server error while rejecting outpass."
            });
        }
    };


// ======================================================
// VALIDATE OUTPASS - SECURITY
// ======================================================

const validateOutpass =
    async (req, res) => {

        try {

            const {
                outpassId
            } = req.body;


            if (!outpassId) {

                return res.status(400).json({
                    message:
                        "Outpass ID is required."
                });
            }


            const outpass =
                await Outpass.findOne({

                    outpassId:
                        outpassId.trim()

                })

                    .populate(
                        "student",
                        "studentId name course roomNumber"
                    )

                    .populate(
                        "hostel",
                        "name type"
                    );


            if (!outpass) {

                return res.status(404).json({
                    message:
                        "Outpass not found."
                });
            }


            if (
                outpass.status === "pending" ||
                outpass.status === "academic_pending" ||
                outpass.status === "warden_pending"
            ) {

                return res.status(400).json({
                    message:
                        "Outpass is still pending approval."
                });
            }


            if (
                outpass.status === "rejected"
            ) {

                return res.status(400).json({
                    message:
                        "Outpass is rejected. Student cannot exit."
                });
            }


            if (
                outpass.status === "completed"
            ) {

                return res.status(400).json({
                    message:
                        "Outpass has already been completed."
                });
            }


            if (
                outpass.status === "expired"
            ) {

                return res.status(400).json({
                    message:
                        "Outpass has expired."
                });
            }


            if (
                outpass.status !== "approved"
            ) {

                return res.status(400).json({
                    message:
                        "Outpass is not valid for gate verification."
                });
            }


            return res.status(200).json({

                message:
                    "Outpass is valid.",

                outpass
            });

        } catch (error) {

            console.error(
                "Validate outpass error:",
                error
            );

            return res.status(500).json({
                message:
                    "Server error while validating outpass."
            });
        }
    };


// ======================================================
// SECURITY - GET APPROVED OUTPASSES
// ======================================================

const getSecurityApprovedOutpasses =
    async (req, res) => {

        try {

            const outpasses =
                await Outpass.find({

                    status:
                        "approved"

                })

                    .populate(
                        "student",
                        "studentId name course roomNumber"
                    )

                    .populate(
                        "hostel",
                        "name type"
                    )

                    .populate(
                        "parent",
                        "name email"
                    )

                    .sort({
                        dateRequestedFor: 1,
                        timeOfLeaving: 1
                    });


            return res.status(200).json({

                success:
                    true,

                count:
                    outpasses.length,

                outpasses
            });

        } catch (error) {

            console.error(
                "Get security approved outpasses error:",
                error
            );

            return res.status(500).json({

                success:
                    false,

                message:
                    "Failed to fetch approved outpasses",

                error:
                    error.message
            });
        }
    };


// ======================================================
// SCAN OUT - SECURITY
// ======================================================

const scanOut =
    async (req, res) => {

        try {

            const {
                outpassId
            } = req.body;


            if (!outpassId) {

                return res.status(400).json({
                    message:
                        "Outpass ID is required."
                });
            }


            const outpass =
                await Outpass.findOne({

                    outpassId:
                        outpassId.trim()
                });


            if (!outpass) {

                return res.status(404).json({
                    message:
                        "Outpass not found."
                });
            }


            if (
                outpass.status === "pending" ||
                outpass.status === "academic_pending" ||
                outpass.status === "warden_pending"
            ) {

                return res.status(400).json({
                    message:
                        "Outpass is still pending approval."
                });
            }


            if (
                outpass.status === "rejected"
            ) {

                return res.status(400).json({
                    message:
                        "Outpass is rejected. Student cannot exit."
                });
            }


            if (
                outpass.status === "completed"
            ) {

                return res.status(400).json({
                    message:
                        "Outpass is completed. Student cannot exit."
                });
            }


            if (
                outpass.status === "expired"
            ) {

                return res.status(400).json({
                    message:
                        "Outpass has expired."
                });
            }


            if (
                outpass.status !== "approved"
            ) {

                return res.status(400).json({
                    message:
                        "Outpass is not valid for exit."
                });
            }


            // ==========================================
            // CHECK EXISTING EXIT
            // ==========================================

            const existingGateLog =
                await GateLog.findOne({

                    outpass:
                        outpass._id,

                    status:
                        "outside"
                });


            if (existingGateLog) {

                return res.status(400).json({
                    message:
                        "Student has already scanned OUT."
                });
            }


            // ==========================================
            // CREATE GATE LOG
            // ==========================================

            const gateLog =
                await GateLog.create({

                    outpass:
                        outpass._id,

                    student:
                        outpass.student,

                    security:
                        req.user.userId,

                    exitTime:
                        new Date(),

                    status:
                        "outside"
                });


            const populatedGateLog =
                await GateLog.findById(
                    gateLog._id
                )

                    .populate(
                        "student",
                        "studentId name course roomNumber"
                    )

                    .populate(
                        "outpass",
                        "outpassId placeOfVisit reason"
                    )

                    .populate(
                        "security",
                        "name email"
                    );


            return res.status(200).json({

                message:
                    "Student exit recorded successfully.",

                gateLog:
                    populatedGateLog
            });

        } catch (error) {

            console.error(
                "Scan OUT error:",
                error
            );

            return res.status(500).json({
                message:
                    "Server error while scanning OUT."
            });
        }
    };


// ======================================================
// SCAN IN - SECURITY
// ======================================================

const scanIn =
    async (req, res) => {

        try {

            const {
                outpassId
            } = req.body;


            if (!outpassId) {

                return res.status(400).json({
                    message:
                        "Outpass ID is required."
                });
            }


            const outpass =
                await Outpass.findOne({

                    outpassId:
                        outpassId.trim()
                });


            if (!outpass) {

                return res.status(404).json({
                    message:
                        "Outpass not found."
                });
            }


            const gateLog =
                await GateLog.findOne({

                    outpass:
                        outpass._id,

                    status:
                        "outside"
                });


            if (!gateLog) {

                return res.status(400).json({
                    message:
                        "Student has not scanned OUT yet."
                });
            }


            if (gateLog.entryTime) {

                return res.status(400).json({
                    message:
                        "Student has already scanned IN."
                });
            }


            // ==========================================
            // RECORD RETURN
            // ==========================================

            gateLog.entryTime =
                new Date();

            gateLog.status =
                "returned";


            await gateLog.save();


            // ==========================================
            // COMPLETE OUTPASS
            // ==========================================

            outpass.status =
                "completed";


            await outpass.save();


            const populatedGateLog =
                await GateLog.findById(
                    gateLog._id
                )

                    .populate(
                        "student",
                        "studentId name course roomNumber"
                    )

                    .populate(
                        "outpass",
                        "outpassId placeOfVisit reason"
                    )

                    .populate(
                        "security",
                        "name email"
                    );


            return res.status(200).json({

                message:
                    "Student entry recorded successfully.",

                gateLog:
                    populatedGateLog,

                outpass: {

                    outpassId:
                        outpass.outpassId,

                    status:
                        outpass.status
                }
            });

        } catch (error) {

            console.error(
                "Scan IN error:",
                error
            );

            return res.status(500).json({
                message:
                    "Server error while scanning IN."
            });
        }
    };


// ======================================================
// GET STUDENT GATE STATUS
// ======================================================

const studentGateStatus =
    async (req, res) => {

        try {

            const {
                outpassId
            } = req.body;


            if (!outpassId) {

                return res.status(400).json({
                    message:
                        "Outpass ID is required."
                });
            }


            const outpass =
                await Outpass.findOne({

                    outpassId:
                        outpassId.trim()

                })

                    .populate(
                        "student",
                        "studentId name course roomNumber"
                    );


            if (!outpass) {

                return res.status(404).json({
                    message:
                        "Outpass not found."
                });
            }


            // ==========================================
            // APPROVAL CHECK
            // ==========================================

            if (
                outpass.status === "pending" ||
                outpass.status === "academic_pending" ||
                outpass.status === "warden_pending"
            ) {

                return res.status(400).json({
                    message:
                        "This outpass is still pending approval."
                });
            }


            if (
                outpass.status === "rejected"
            ) {

                return res.status(400).json({
                    message:
                        "This outpass has been rejected."
                });
            }


            if (
                outpass.status === "expired"
            ) {

                return res.status(400).json({
                    message:
                        "This outpass has expired."
                });
            }


            if (
                outpass.status === "completed"
            ) {

                return res.status(400).json({
                    message:
                        "This outpass has already been completed."
                });
            }


            if (
                outpass.status !== "approved"
            ) {

                return res.status(400).json({
                    message:
                        "This outpass is not valid."
                });
            }


            // ==========================================
            // CHECK GATE LOG
            // ==========================================

            const existingGateLog =
                await GateLog.findOne({

                    outpass:
                        outpass._id,

                    status:
                        "outside"
                });


            // ==========================================
            // EXIT
            // ==========================================

            if (!existingGateLog) {

                return res.status(200).json({

                    action:
                        "exit",

                    message:
                        "Student can confirm exit.",

                    outpassId:
                        outpass.outpassId,

                    student:
                        outpass.student
                });
            }


            // ==========================================
            // RETURN
            // ==========================================

            if (
                existingGateLog.status ===
                "outside"
            ) {

                return res.status(200).json({

                    action:
                        "return",

                    message:
                        "Student can confirm return.",

                    outpassId:
                        outpass.outpassId,

                    student:
                        outpass.student
                });
            }


            return res.status(400).json({
                message:
                    "Invalid gate status."
            });

        } catch (error) {

            console.error(
                "Student gate status error:",
                error
            );

            return res.status(500).json({
                message:
                    "Server error while checking gate status."
            });
        }
    };


// ======================================================
// STUDENT CONFIRM GATE ACTION
// ======================================================

const studentConfirmGateAction =
    async (req, res) => {

        try {

            const {
                outpassId
            } = req.body;


            if (!outpassId) {

                return res.status(400).json({
                    message:
                        "Outpass ID is required."
                });
            }


            const outpass =
                await Outpass.findOne({

                    outpassId:
                        outpassId.trim()
                });


            if (!outpass) {

                return res.status(404).json({
                    message:
                        "Outpass not found."
                });
            }


            // ==========================================
            // APPROVAL CHECK
            // ==========================================

            if (
                outpass.status === "pending" ||
                outpass.status === "academic_pending" ||
                outpass.status === "warden_pending"
            ) {

                return res.status(400).json({
                    message:
                        "This outpass is still pending approval."
                });
            }


            if (
                outpass.status === "rejected"
            ) {

                return res.status(400).json({
                    message:
                        "This outpass has been rejected."
                });
            }


            if (
                outpass.status === "expired"
            ) {

                return res.status(400).json({
                    message:
                        "This outpass has expired."
                });
            }


            if (
                outpass.status === "completed"
            ) {

                return res.status(400).json({
                    message:
                        "This outpass has already been completed."
                });
            }


            if (
                outpass.status !== "approved"
            ) {

                return res.status(400).json({
                    message:
                        "This outpass is not valid."
                });
            }


            // ==========================================
            // CHECK EXISTING GATE LOG
            // ==========================================

            const existingGateLog =
                await GateLog.findOne({

                    outpass:
                        outpass._id,

                    status:
                        "outside"
                });


            // ==========================================
            // FIRST ACTION → EXIT
            // ==========================================

            if (!existingGateLog) {

                const securityUser =
                    await User.findOne({
                        role:
                            "security"
                    });


                if (!securityUser) {

                    return res.status(500).json({
                        message:
                            "Main gate security account not found."
                    });
                }


                const gateLog =
                    await GateLog.create({

                        outpass:
                            outpass._id,

                        student:
                            outpass.student,

                        security:
                            securityUser._id,

                        exitTime:
                            new Date(),

                        entryTime:
                            null,

                        status:
                            "outside"
                    });


                return res.status(200).json({

                    action:
                        "exit",

                    message:
                        "Exit confirmed successfully.",

                    outpassId:
                        outpass.outpassId,

                    gateLogId:
                        gateLog._id
                });
            }


            // ==========================================
            // SECOND ACTION → RETURN
            // ==========================================

            if (
                existingGateLog.status ===
                "outside"
            ) {

                existingGateLog.entryTime =
                    new Date();

                existingGateLog.status =
                    "returned";


                await existingGateLog.save();


                outpass.status =
                    "completed";


                await outpass.save();


                return res.status(200).json({

                    action:
                        "return",

                    message:
                        "Return confirmed successfully.",

                    outpassId:
                        outpass.outpassId,

                    gateLogId:
                        existingGateLog._id,

                    status:
                        "completed"
                });
            }


            return res.status(400).json({
                message:
                    "Invalid gate status."
            });

        } catch (error) {

            console.error(
                "Student gate confirmation error:",
                error
            );

            return res.status(500).json({
                message:
                    "Server error while confirming gate action."
            });
        }
    };


// ======================================================
// GET GATE HISTORY
// ======================================================
//
// SECURITY → ALL HOSTELS
// WARDEN  → OWN HOSTEL ONLY
//
// ======================================================

const getGateHistory =
    async (req, res) => {

        try {

            const role =
                req.user.role;


            // ==========================================
            // SECURITY
            // ==========================================

            if (
                role === "security"
            ) {

                const gateLogs =
                    await GateLog.find()

                        .populate(
                            "student",
                            "studentId name course roomNumber"
                        )

                        .populate(
                            "outpass",
                            "outpassId placeOfVisit reason dateRequestedFor hostel"
                        )

                        .populate(
                            "security",
                            "name email"
                        )

                        .sort({
                            createdAt: -1
                        });


                return res.status(200).json({

                    count:
                        gateLogs.length,

                    gateLogs
                });
            }


            // ==========================================
            // WARDEN
            // ==========================================

            if (
                role === "warden"
            ) {

                const hostel =
                    await Hostel.findOne({

                        warden:
                            req.user.userId
                    });


                if (!hostel) {

                    return res.status(404).json({
                        message:
                            "No hostel is assigned to this warden."
                    });
                }


                const hostelOutpasses =
                    await Outpass.find({

                        hostel:
                            hostel._id

                    })
                        .select("_id");


                const outpassIds =
                    hostelOutpasses.map(
                        (outpass) =>
                            outpass._id
                    );


                const gateLogs =
                    await GateLog.find({

                        outpass: {
                            $in:
                                outpassIds
                        }

                    })

                        .populate(
                            "student",
                            "studentId name course roomNumber"
                        )

                        .populate(
                            "outpass",
                            "outpassId placeOfVisit reason dateRequestedFor"
                        )

                        .populate(
                            "security",
                            "name email"
                        )

                        .sort({
                            createdAt: -1
                        });


                return res.status(200).json({

                    hostel:
                        hostel.name,

                    count:
                        gateLogs.length,

                    gateLogs
                });
            }


            return res.status(403).json({
                message:
                    "You are not authorized to view gate history."
            });

        } catch (error) {

            console.error(
                "Get gate history error:",
                error
            );

            return res.status(500).json({
                message:
                    "Server error while fetching gate history."
            });
        }
    };


// ======================================================
// EXPORTS
// ======================================================

module.exports = {

    // Parent
    requestOutpass,
    getMyStudent,
    getMyOutpasses,

    // Warden
    getPendingOutpasses,
    getWardenOutpassHistory,
    approveOutpass,
    rejectOutpass,

    // Academic
    getAcademicPendingOutpasses,
    approveAcademicOutpass,
    rejectAcademicOutpass,

    // Security
    validateOutpass,
    getSecurityApprovedOutpasses,
    scanOut,
    scanIn,

    // Gate
    studentGateStatus,
    studentConfirmGateAction,
    getGateHistory
};