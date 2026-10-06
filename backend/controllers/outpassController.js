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



const determineAcademicApprover = async (student) => {



    // --------------------------------------------------

    // 1. CLASS ADVISOR

    // --------------------------------------------------



    if (student.classAdvisor) {



        const classAdvisor = await User.findOne({

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



    // --------------------------------------------------

    // 2. HOD FALLBACK

    // --------------------------------------------------



    if (student.hod) {



        const hod = await User.findOne({

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



        // --------------------------------------------------

        // VALIDATION

        // --------------------------------------------------



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



        // --------------------------------------------------

        // FIND STUDENT

        // --------------------------------------------------



        const student = await Student.findOne({

            studentId: String(studentId),

            parent: req.user.userId

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



        if (!student.hostel) {

            return res.status(400).json({

                message:

                    "Student is not assigned to a hostel."

            });

        }



        // --------------------------------------------------

        // DAY TYPE

        // --------------------------------------------------



        const dayType = getDayType(dateRequestedFor);



        if (!dayType) {

            return res.status(400).json({

                message: "Invalid outpass date."

            });

        }



        // --------------------------------------------------

        // DEFAULT VALUES

        // --------------------------------------------------



        let academicApprovalRequired = false;

        let academicApprovalBy = null;

        let academicApprover = null;

        let academicApprovalStatus = "not_required";

        let initialStatus = "warden_pending";



        // --------------------------------------------------

        // WEEKDAY

        // --------------------------------------------------



        if (dayType === "weekday") {



            academicApprovalRequired = true;



            const academicAssignment =

                await determineAcademicApprover(student);



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



        // --------------------------------------------------

        // GENERATE OUTPASS ID

        // --------------------------------------------------



        const outpassId =

            `OP-${Date.now()}-${Math.floor(

                100 + Math.random() * 900

            )}`;



        // --------------------------------------------------

        // CREATE OUTPASS

        // --------------------------------------------------



        const outpass = await Outpass.create({



            outpassId,



            student: student._id,



            parent: req.user.userId,



            hostel: student.hostel._id,



            placeOfVisit: placeOfVisit.trim(),



            reason: reason.trim(),



            dateRequestedFor:

                new Date(dateRequestedFor),



            timeOfLeaving,



            expectedInTime,



            dayType,



            academicApprovalRequired,



            academicApprovalBy,



            academicApprover,



            academicApprovalStatus,



            wardenApprovalStatus:

                "pending",



            status:

                initialStatus

        });



        // --------------------------------------------------

        // RESPONSE

        // --------------------------------------------------



        const populatedOutpass =

            await Outpass.findById(outpass._id)

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

                parent: req.user.userId

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

                parent: req.user.userId

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

            count: outpasses.length,

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

                warden: req.user.userId

            });



        if (!hostel) {

            return res.status(404).json({

                message:

                    "No hostel is assigned to this warden."

            });

        }



        const outpasses =

            await Outpass.find({

                hostel: hostel._id,

                status: "warden_pending"

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

                .sort({

                    createdAt: -1

                });



        return res.status(200).json({



            hostel: hostel.name,



            count: outpasses.length,



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

                    warden: req.user.userId

                });



            if (!hostel) {

                return res.status(404).json({

                    message:

                        "No hostel is assigned to this warden."

                });

            }



            const outpasses =

                await Outpass.find({

                    hostel: hostel._id

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



                hostel: hostel.name,



                count: outpasses.length,



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



const getAcademicPendingOutpasses =

    async (req, res) => {



        try {



            // --------------------------------------------------

            // AUTHENTICATED USER

            // --------------------------------------------------



            if (!req.user || !req.user.userId) {

                return res.status(401).json({

                    message:

                        "Authentication information is missing."

                });

            }



            const role = req.user.role;



            // --------------------------------------------------

            // ROLE CHECK

            // --------------------------------------------------



            if (

                role !== "hod" &&

                role !== "classAdvisor"

            ) {

                return res.status(403).json({

                    message:

                        "Only HOD or Class Advisor can access academic approval requests."

                });

            }



            // --------------------------------------------------

            // FIND ONLY REQUESTS ASSIGNED TO THIS USER

            // --------------------------------------------------



            const query = {

                academicApprovalRequired: true,

                academicApprovalStatus: "pending",

                academicApprover: req.user.userId

            };



            const outpasses =

                await Outpass.find(query)

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



                count: outpasses.length,



                outpasses

            });



        } catch (error) {



            console.error(

                "Get academic pending outpasses error:",

                error

            );



            return res.status(500).json({

                message:

                    "Server error while fetching academic approval requests.",



                error: error.message,

                name: error.name    

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



            const outpass =

                await Outpass.findOne({



                    outpassId,



                    academicApprovalRequired: true,



                    academicApprovalStatus: "pending",



                    academicApprover:

                        req.user.userId

                });



            if (!outpass) {

                return res.status(404).json({

                    message:

                        "Academic approval request not found or not assigned to you."

                });

            }



            // --------------------------------------------------

            // APPROVE ACADEMIC STAGE

            // --------------------------------------------------



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



            // --------------------------------------------------

            // SEND TO WARDEN

            // --------------------------------------------------



            outpass.status =

                "warden_pending";



            outpass.wardenApprovalStatus =

                "pending";



            await outpass.save();



            const populatedOutpass =

                await Outpass.findById(outpass._id)

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



            if (

                role !== "hod" &&

                role !== "classAdvisor"

            ) {

                return res.status(403).json({

                    message:

                        "Only HOD or Class Advisor can reject academic requests."

                });

            }



            if (

                !rejectionReason ||

                !rejectionReason.trim()

            ) {

                return res.status(400).json({

                    message:

                        "Rejection reason is required."

                });

            }



            const outpass =

                await Outpass.findOne({



                    outpassId,



                    academicApprovalRequired: true,



                    academicApprovalStatus: "pending",



                    academicApprover:

                        req.user.userId

                });



            if (!outpass) {

                return res.status(404).json({

                    message:

                        "Academic approval request not found or not assigned to you."

                });

            }



            outpass.academicApprovalStatus =

                "rejected";



            outpass.academicRejectedBy =

                req.user.userId;



            outpass.academicRejectedAt =

                new Date();



            outpass.academicRejectionReason =

                rejectionReason.trim();



            outpass.academicApprovedBy =

                null;



            outpass.academicApprovedAt =

                null;



            outpass.status =

                "rejected";



            outpass.rejectionReason =

                rejectionReason.trim();



            await outpass.save();



            const populatedOutpass =

                await Outpass.findById(outpass._id)

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



            // --------------------------------------------------

            // FIND WARDEN HOSTEL

            // --------------------------------------------------



            const hostel =

                await Hostel.findOne({

                    warden: req.user.userId

                });



            if (!hostel) {

                return res.status(404).json({

                    message:

                        "No hostel is assigned to this warden."

                });

            }



            // --------------------------------------------------

            // FIND OUTPASS

            // --------------------------------------------------



            const outpass =

                await Outpass.findOne({



                    outpassId,



                    hostel: hostel._id

                });



            if (!outpass) {

                return res.status(404).json({

                    message:

                        "Outpass not found in your hostel."

                });

            }



            // --------------------------------------------------

            // MUST BE WARDEN PENDING

            // --------------------------------------------------



            if (

                outpass.status !==

                "warden_pending"

            ) {

                return res.status(400).json({

                    message:

                        `Outpass is currently ${outpass.status}. It cannot be approved by the warden yet.`

                });

            }



            // --------------------------------------------------

            // WEEKDAY ACADEMIC CHECK

            // --------------------------------------------------



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



            // --------------------------------------------------

            // WEEKEND SAFETY CHECK

            // --------------------------------------------------



            if (

                outpass.dayType === "weekend" &&

                outpass.academicApprovalRequired

            ) {

                return res.status(400).json({

                    message:

                        "Weekend requests should not require academic approval."

                });

            }



            // --------------------------------------------------

            // WARDEN APPROVAL

            // --------------------------------------------------



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



            // --------------------------------------------------

            // QR CODE

            // --------------------------------------------------



            const frontendUrl =

                process.env.FRONTEND_URL ||

                "http://192.168.1.33:5173";



            const gateUrl =

                `${frontendUrl}/gate/${encodeURIComponent(

                    outpass.outpassId

                )}`;



            outpass.qrCode =

                await QRCode.toDataURL(

                    gateUrl

                );



            await outpass.save();



            const populatedOutpass =

                await Outpass.findById(outpass._id)

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

                    warden: req.user.userId

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



                    hostel: hostel._id

                });



            if (!outpass) {

                return res.status(404).json({

                    message:

                        "Outpass not found in your hostel."

                });

            }



            if (

                outpass.status !==

                "warden_pending"

            ) {

                return res.status(400).json({

                    message:

                        `Outpass is currently ${outpass.status}. It cannot be rejected by the warden at this stage.`

                });

            }



            if (

                outpass.dayType === "weekday" &&

                outpass.academicApprovalRequired &&

                outpass.academicApprovalStatus !==

                    "approved"

            ) {

                return res.status(400).json({

                    message:

                        "Academic approval must be completed before warden action."

                });

            }



            outpass.status =

                "rejected";



            outpass.rejectionReason =

                rejectionReason.trim();



            outpass.wardenApprovalStatus =

                "rejected";



            outpass.wardenApprovedBy =

                null;



            outpass.wardenApprovedAt =

                null;



            await outpass.save();



            const populatedOutpass =

                await Outpass.findById(outpass._id)

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

                    );



            return res.status(200).json({



                message:

                    "Outpass rejected by warden.",



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

            } = req.params;



            const outpass =

                await Outpass.findOne({

                    outpassId

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

                        "academicApprovedBy",

                        "name email role"

                    )

                    .populate(

                        "wardenApprovedBy",

                        "name email role"

                    );



            if (!outpass) {

                return res.status(404).json({

                    valid: false,

                    message:

                        "Outpass not found."

                });

            }



            if (

                outpass.status !==

                "approved"

            ) {

                return res.status(400).json({

                    valid: false,

                    message:

                        `This outpass is not valid for gate entry. Current status: ${outpass.status}.`,

                    outpass

                });

            }



            return res.status(200).json({



                valid: true,



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

                valid: false,

                message:

                    "Server error while validating outpass."

            });

        }

    };



// ======================================================

// GET APPROVED OUTPASSES - SECURITY

// ======================================================



const getSecurityApprovedOutpasses =

    async (req, res) => {



        try {



            const outpasses =

                await Outpass.find({

                    status: "approved"

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

                    .sort({

                        approvedAt: -1

                    });



            return res.status(200).json({

                count: outpasses.length,

                outpasses

            });



        } catch (error) {



            console.error(

                "Get security approved outpasses error:",

                error

            );



            return res.status(500).json({

                message:

                    "Server error while fetching approved outpasses."

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

            } = req.params;



            const outpass =

                await Outpass.findOne({

                    outpassId

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

                outpass.status !==

                "approved"

            ) {

                return res.status(400).json({

                    message:

                        "Only approved outpasses can be used for gate exit."

                });

            }



            const existingLog =

                await GateLog.findOne({



                    outpass: outpass._id,



                    outTime: {

                        $ne: null

                    },



                    inTime: null

                });



            if (existingLog) {

                return res.status(400).json({

                    message:

                        "Student has already exited and has not yet returned."

                });

            }



            const gateLog =

                await GateLog.create({



                    outpass:

                        outpass._id,



                    student:

                        outpass.student._id,



                    hostel:

                        outpass.hostel._id,



                    outTime:

                        new Date(),



                    outScannedBy:

                        req.user.userId

                });



            const populatedLog =

                await GateLog.findById(

                    gateLog._id

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

                        "outpass",

                        "outpassId placeOfVisit reason dateRequestedFor timeOfLeaving expectedInTime status"

                    )

                    .populate(

                        "outScannedBy",

                        "name email role"

                    );



            return res.status(200).json({



                message:

                    "Student exit recorded successfully.",



                gateLog:

                    populatedLog

            });



        } catch (error) {



            console.error(

                "Scan out error:",

                error

            );



            return res.status(500).json({

                message:

                    "Server error while recording student exit."

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

            } = req.params;



            const outpass =

                await Outpass.findOne({

                    outpassId

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



                    outTime: {

                        $ne: null

                    },



                    inTime: null



                }).sort({

                    outTime: -1

                });



            if (!gateLog) {

                return res.status(400).json({

                    message:

                        "No active exit record found for this outpass."

                });

            }



            gateLog.inTime =

                new Date();



            gateLog.inScannedBy =

                req.user.userId;



            await gateLog.save();



            outpass.status =

                "completed";



            await outpass.save();



            const populatedLog =

                await GateLog.findById(

                    gateLog._id

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

                        "outpass",

                        "outpassId placeOfVisit reason dateRequestedFor timeOfLeaving expectedInTime status"

                    )

                    .populate(

                        "outScannedBy",

                        "name email role"

                    )

                    .populate(

                        "inScannedBy",

                        "name email role"

                    );



            return res.status(200).json({



                message:

                    "Student return recorded successfully.",



                gateLog:

                    populatedLog

            });



        } catch (error) {



            console.error(

                "Scan in error:",

                error

            );



            return res.status(500).json({

                message:

                    "Server error while recording student return."

            });

        }

    };



// ======================================================

// STUDENT GATE STATUS

// ======================================================



const studentGateStatus =

    async (req, res) => {



        try {



            const {

                outpassId

            } = req.params;



            const outpass =

                await Outpass.findOne({

                    outpassId

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



            const gateLog =

                await GateLog.findOne({

                    outpass: outpass._id

                })

                    .sort({

                        createdAt: -1

                    })

                    .populate(

                        "outScannedBy",

                        "name email role"

                    )

                    .populate(

                        "inScannedBy",

                        "name email role"

                    );



            let gateStatus =

                "not_exited";



            if (gateLog) {



                if (

                    gateLog.outTime &&

                    !gateLog.inTime

                ) {

                    gateStatus =

                        "outside";

                }



                if (

                    gateLog.outTime &&

                    gateLog.inTime

                ) {

                    gateStatus =

                        "returned";

                }

            }



            return res.status(200).json({



                outpassId:

                    outpass.outpassId,



                outpassStatus:

                    outpass.status,



                gateStatus,



                gateLog:

                    gateLog || null

            });



        } catch (error) {



            console.error(

                "Student gate status error:",

                error

            );



            return res.status(500).json({

                message:

                    "Server error while fetching gate status."

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

            } = req.params;



            const {

                action

            } = req.body;



            if (

                !action ||

                !["out", "in"].includes(action)

            ) {

                return res.status(400).json({

                    message:

                        "Action must be either 'out' or 'in'."

                });

            }



            const student =

                await Student.findOne({

                    user: req.user.userId

                });



            if (!student) {

                return res.status(404).json({

                    message:

                        "Student profile not found."

                });

            }



            const outpass =

                await Outpass.findOne({



                    outpassId,



                    student: student._id

                });



            if (!outpass) {

                return res.status(404).json({

                    message:

                        "Outpass not found for this student."

                });

            }



            // --------------------------------------------------

            // OUT

            // --------------------------------------------------



            if (action === "out") {



                if (

                    outpass.status !==

                    "approved"

                ) {

                    return res.status(400).json({

                        message:

                            "Only approved outpasses can be used for exit."

                    });

                }



                const existingLog =

                    await GateLog.findOne({



                        outpass:

                            outpass._id,



                        outTime: {

                            $ne: null

                        },



                        inTime: null

                    });



                if (existingLog) {

                    return res.status(400).json({

                        message:

                            "You have already exited and have not returned yet."

                    });

                }



                const gateLog =

                    await GateLog.create({



                        outpass:

                            outpass._id,



                        student:

                            student._id,



                        hostel:

                            outpass.hostel,



                        outTime:

                            new Date(),



                        outScannedBy:

                            req.user.userId

                    });



                return res.status(200).json({



                    message:

                        "Gate exit confirmed successfully.",



                    gateLog

                });

            }

            // IN
            if (action === "in") {
                const gateLog =
                    await GateLog.findOne({
                        outpass:
                            outpass._id,
                        outTime: {
                            $ne: null
                        },
                        inTime: null
                    }).sort({
                        outTime: -1
                    });
                if (!gateLog) {
                    return res.status(400).json({
                        message:
                            "No active gate exit record found."
                    });
                }
                gateLog.inTime =
                    new Date();
                gateLog.inScannedBy =
                    req.user.userId;
                await gateLog.save();
                outpass.status =
                    "completed";
                await outpass.save();
                return res.status(200).json({
                    message:
                        "Gate return confirmed successfully.",
                    gateLog
                });
            }
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

// GET GATE HISTORY

const getGateHistory =
    async (req, res) => {
        try {
            const query = {};
            if (req.user.role === "student") {
                const student = await Student.findOne({ user: req.user.userId });
                if (!student) return res.status(404).json({ message: "Student profile not found." });
                query.student = student._id;
            }
            if (req.user.role === "parent") {
                const students = await Student.find({ parent: req.user.userId }).select("_id");
                query.student = { $in: students.map(student => student._id) };
            }
            if (req.user.role === "warden") {
                const hostel = await Hostel.findOne({ warden: req.user.userId });
                if (!hostel) return res.status(404).json({ message: "No hostel is assigned to this warden." });
                query.hostel = hostel._id;
            }
            // Public QR scans do not have a logged-in Security user,
            // so Security must not be filtered by scanner fields.
            const gateLogs = await GateLog.find(query)
                .populate("student", "studentId name course roomNumber")
                .populate("hostel", "name type")
                .populate("outpass", "outpassId placeOfVisit reason dateRequestedFor timeOfLeaving expectedInTime status")
                .populate("outScannedBy", "name email role")
                .populate("inScannedBy", "name email role")
                .sort({ createdAt: -1 });
            return res.status(200).json({ count: gateLogs.length, gateLogs });
        } catch (error) {
            console.error("Get gate history error:", error);
            return res.status(500).json({ message: "Server error while fetching gate history." });
        }
    };


const publicGateStatus = async (req, res) => {
    try {
        const { outpassId } = req.params;
        if (!outpassId) return res.status(400).json({ message: "Outpass ID is required." });
        const outpass = await Outpass.findOne({ outpassId });
        if (!outpass) return res.status(404).json({ message: "Outpass not found." });
        if (outpass.status !== "approved") {
            return res.status(400).json({ message: `This outpass is not currently approved. Current status: ${outpass.status}.` });
        }
        const activeGateLog = await GateLog.findOne({
            outpass: outpass._id,
            outTime: { $ne: null },
            inTime: null
        }).sort({ outTime: -1 });
        return res.status(200).json({
            action: activeGateLog ? "return" : "exit",
            outpassId: outpass.outpassId
        });
    } catch (error) {
        console.error("Public gate status error:", error);
        return res.status(500).json({ message: "Server error while checking gate status." });
    }
};


const publicGateConfirm = async (req, res) => {
    try {
        const { outpassId } = req.params;
        const { action } = req.body;
        if (!outpassId) return res.status(400).json({ message: "Outpass ID is required." });
        if (!action || !["exit", "return"].includes(action)) {
            return res.status(400).json({ message: "Action must be either 'exit' or 'return'." });
        }
        const outpass = await Outpass.findOne({ outpassId });
        if (!outpass) return res.status(404).json({ message: "Outpass not found." });

        if (action === "exit") {
            if (outpass.status !== "approved") {
                return res.status(400).json({ message: `This outpass cannot be used for exit. Current status: ${outpass.status}.` });
            }
            const existingLog = await GateLog.findOne({
                outpass: outpass._id,
                outTime: { $ne: null },
                inTime: null
            });
            if (existingLog) {
                return res.status(400).json({ message: "This student has already exited and has not returned yet." });
            }
            const gateLog = await GateLog.create({
                outpass: outpass._id,
                student: outpass.student,
                hostel: outpass.hostel,
                outTime: new Date(),
                status: "outside"
            });
            return res.status(200).json({
                message: "Campus exit recorded successfully.",
                action: "exit",
                gateLog
            });
        }

        if (action === "return") {
            const gateLog = await GateLog.findOne({
                outpass: outpass._id,
                outTime: { $ne: null },
                inTime: null
            }).sort({ outTime: -1 });
            if (!gateLog) {
                return res.status(400).json({ message: "No active exit record was found for this outpass." });
            }
            gateLog.inTime = new Date();
            gateLog.status = "returned";
            await gateLog.save();
            outpass.status = "completed";
            await outpass.save();
            return res.status(200).json({
                message: "Campus return recorded successfully.",
                action: "return",
                gateLog
            });
        }
    } catch (error) {
        console.error("Public gate confirmation error:", error);
        return res.status(500).json({ message: "Server error while confirming gate action." });
    }
};


// EXPORTS

module.exports = {

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

};