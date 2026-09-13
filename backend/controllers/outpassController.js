const Outpass = require("../models/Outpass");
const Student = require("../models/Student");
const Hostel = require("../models/Hostel");
const GateLog = require("../models/GateLog");
const User = require("../models/User");
const QRCode = require("qrcode");

// ==========================================
// REQUEST OUTPASS - PARENT
// ==========================================

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

        if (
            !studentId ||
            !placeOfVisit ||
            !reason ||
            !dateRequestedFor ||
            !timeOfLeaving ||
            !expectedInTime
        ) {
            return res.status(400).json({
                message: "All fields are required."
            });
        }

        const student = await Student.findOne({
            studentId: String(studentId),
            parent: req.user.userId
        }).populate("hostel");

        if (!student) {
            return res.status(404).json({
                message:
                    "Student not found or not linked to this parent."
            });
        }

        if (!student.hostel) {
            return res.status(400).json({
                message:
                    "Student is not assigned to a hostel."
            });
        }

        const outpassId =
            `OP-${Date.now()}-${Math.floor(
                100 + Math.random() * 900
            )}`;

        const outpass = await Outpass.create({
            outpassId,

            student:
                student._id,

            parent:
                req.user.userId,

            hostel:
                student.hostel._id,

            placeOfVisit,

            reason,

            dateRequestedFor,

            timeOfLeaving,

            expectedInTime,

            status:
                "pending"
        });

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

        return res.status(201).json({
            message:
                "Outpass request submitted successfully.",

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


// ==========================================
// GET MY STUDENT - PARENT
// ==========================================

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


// ==========================================
// GET MY OUTPASSES - PARENT
// ==========================================

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


// ==========================================
// GET PENDING OUTPASSES - WARDEN
// ==========================================

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
                    "pending"

            })
                .populate(
                    "student",
                    "studentId name course roomNumber"
                )
                .populate(
                    "parent",
                    "name email"
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


// ==========================================
// APPROVE OUTPASS - WARDEN
// ==========================================

const approveOutpass = async (req, res) => {
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

        if (
            outpass.status !==
            "pending"
        ) {
            return res.status(400).json({
                message:
                    `Outpass is already ${outpass.status}.`
            });
        }

        // ==========================================
        // APPROVE OUTPASS
        // ==========================================

        outpass.status =
            "approved";

        outpass.approvedAt =
            new Date();

        // ==========================================
        // CREATE PHONE-ACCESSIBLE QR
        // ==========================================

        const frontendUrl =
            process.env.FRONTEND_URL ||
            "http://192.168.1.38:5173";

        const gateUrl =
            `${frontendUrl}/gate/${encodeURIComponent(
                outpass.outpassId
            )}`;

        console.log(
            "Generating Gate QR:",
            gateUrl
        );

        outpass.qrCode =
            await QRCode.toDataURL(
                gateUrl
            );

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


// ==========================================
// REJECT OUTPASS - WARDEN
// ==========================================

const rejectOutpass = async (req, res) => {
    try {
        const {
            outpassId
        } = req.params;

        const {
            rejectionReason
        } = req.body;

        if (
            !rejectionReason ||
            !rejectionReason.trim()
        ) {
            return res.status(400).json({
                message:
                    "Rejection reason is required."
            });
        }

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

        if (
            outpass.status !==
            "pending"
        ) {
            return res.status(400).json({
                message:
                    `Outpass is already ${outpass.status}.`
            });
        }

        outpass.status =
            "rejected";

        outpass.rejectionReason =
            rejectionReason.trim();

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


// ==========================================
// VALIDATE OUTPASS - SECURITY
// ==========================================

const validateOutpass = async (req, res) => {
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
            outpass.status ===
            "pending"
        ) {
            return res.status(400).json({
                message:
                    "Outpass is still pending approval."
            });
        }

        if (
            outpass.status ===
            "rejected"
        ) {
            return res.status(400).json({
                message:
                    "Outpass is rejected. Student cannot exit."
            });
        }

        if (
            outpass.status ===
            "completed"
        ) {
            return res.status(400).json({
                message:
                    "Outpass has already been completed."
            });
        }

        if (
            outpass.status ===
            "expired"
        ) {
            return res.status(400).json({
                message:
                    "Outpass has expired."
            });
        }

        if (
            outpass.status !==
            "approved"
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


// ==========================================
// SCAN OUT - SECURITY
// ==========================================

const scanOut = async (req, res) => {
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
            outpass.status ===
            "pending"
        ) {
            return res.status(400).json({
                message:
                    "Outpass is still pending approval."
            });
        }

        if (
            outpass.status ===
            "rejected"
        ) {
            return res.status(400).json({
                message:
                    "Outpass is rejected. Student cannot exit."
            });
        }

        if (
            outpass.status ===
            "completed"
        ) {
            return res.status(400).json({
                message:
                    "Outpass is completed. Student cannot exit."
            });
        }

        if (
            outpass.status ===
            "expired"
        ) {
            return res.status(400).json({
                message:
                    "Outpass has expired."
            });
        }

        if (
            outpass.status !==
            "approved"
        ) {
            return res.status(400).json({
                message:
                    "Outpass is not valid for exit."
            });
        }

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


// ==========================================
// SCAN IN - SECURITY
// ==========================================

const scanIn = async (req, res) => {
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

        gateLog.entryTime =
            new Date();

        gateLog.status =
            "returned";

        await gateLog.save();

        // Mark outpass completed
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


// ==========================================
// GET STUDENT GATE STATUS
// ==========================================
//
// No active GateLog → EXIT
// Active OUT GateLog → RETURN
// Completed → blocked
// ==========================================

const studentGateStatus = async (req, res) => {
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

        // ==========================================
        // PUBLIC QR FLOW
        // No student login required.
        // The outpass ID comes from the QR code.
        // ==========================================

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
        // STATUS CHECKS
        // ==========================================

        if (
            outpass.status ===
            "pending"
        ) {
            return res.status(400).json({
                message:
                    "This outpass is still pending approval."
            });
        }

        if (
            outpass.status ===
            "rejected"
        ) {
            return res.status(400).json({
                message:
                    "This outpass has been rejected."
            });
        }

        if (
            outpass.status ===
            "expired"
        ) {
            return res.status(400).json({
                message:
                    "This outpass has expired."
            });
        }

        if (
            outpass.status ===
            "completed"
        ) {
            return res.status(400).json({
                message:
                    "This outpass has already been completed."
            });
        }

        if (
            outpass.status !==
            "approved"
        ) {
            return res.status(400).json({
                message:
                    "This outpass is not valid."
            });
        }

        // ==========================================
        // CHECK ACTIVE OUT RECORD
        // ==========================================

        const existingGateLog =
            await GateLog.findOne({
                outpass:
                    outpass._id,

                status:
                    "outside"
            });

        // ==========================================
        // NO OUT YET → EXIT
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
        // ALREADY OUT → RETURN
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


// ==========================================
// STUDENT CONFIRM GATE ACTION
// ==========================================
//
// First scan:
//      Confirm Exit → OUT
//
// Second scan:
//      Confirm Return → IN
// ==========================================

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

            // ==========================================
            // PUBLIC QR FLOW
            // No student login required.
            // ==========================================

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
            // STATUS CHECKS
            // ==========================================

            if (
                outpass.status ===
                "pending"
            ) {
                return res.status(400).json({
                    message:
                        "This outpass is still pending approval."
                });
            }

            if (
                outpass.status ===
                "rejected"
            ) {
                return res.status(400).json({
                    message:
                        "This outpass has been rejected."
                });
            }

            if (
                outpass.status ===
                "expired"
            ) {
                return res.status(400).json({
                    message:
                        "This outpass has expired."
                });
            }

            if (
                outpass.status ===
                "completed"
            ) {
                return res.status(400).json({
                    message:
                        "This outpass has already been completed."
                });
            }

            if (
                outpass.status !==
                "approved"
            ) {
                return res.status(400).json({
                    message:
                        "This outpass is not valid."
                });
            }

            // ==========================================
            // CHECK CURRENT GATE STATE
            // ==========================================

            const existingGateLog =
                await GateLog.findOne({
                    outpass:
                        outpass._id,

                    status:
                        "outside"
                });

            // ==========================================
            // FIRST SCAN → EXIT
            // ==========================================

            if (!existingGateLog) {

                // Find common main-gate
                // security account
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
            // SECOND SCAN → RETURN
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

                // Mark outpass completed
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


// ==========================================
// GET GATE HISTORY
//
// SECURITY → ALL HOSTELS
// WARDEN   → OWN HOSTEL ONLY
// ==========================================

const getGateHistory = async (req, res) => {
    try {
        const role =
            req.user.role;

        // ==========================================
        // SECURITY
        // Common main gate
        // Can see ALL records
        // ==========================================

        if (
            role ===
            "security"
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
        // Only their hostel
        // ==========================================

        if (
            role ===
            "warden"
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

            // Find outpasses belonging
            // to this hostel
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

            // Find gate logs for
            // those outpasses
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

        // ==========================================
        // OTHER ROLES
        // ==========================================

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


// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    requestOutpass,

    getMyStudent,

    getMyOutpasses,

    getPendingOutpasses,

    approveOutpass,

    rejectOutpass,

    validateOutpass,

    scanOut,

    scanIn,

    studentGateStatus,

    studentConfirmGateAction,

    getGateHistory
};