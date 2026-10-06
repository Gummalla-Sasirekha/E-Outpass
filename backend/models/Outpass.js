// ======================================================
// REJECT OUTPASS - ACADEMIC
// HOD / CLASS ADVISOR
// ======================================================

const rejectAcademicOutpass = async (req, res) => {

    try {

        const { outpassId } = req.params;

        const { rejectionReason } = req.body;

        const role = req.user.role;


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
        // VALIDATE REJECTION REASON
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

        const outpass = await Outpass.findOne({

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
        // REJECT ACADEMIC APPROVAL
        // ==========================================

        outpass.academicApprovalStatus =
            "rejected";


        // ==========================================
        // RECORD WHO REJECTED
        // ==========================================

        outpass.academicRejectedBy =
            req.user.userId;


        // ==========================================
        // RECORD WHEN REJECTED
        // ==========================================

        outpass.academicRejectedAt =
            new Date();


        // ==========================================
        // STORE REJECTION REASON
        // ==========================================

        outpass.academicRejectionReason =
            rejectionReason.trim();


        // ==========================================
        // OVERALL OUTPASS STATUS
        // ==========================================

        outpass.status =
            "rejected";


        // Store same reason in general field
        // so parent/student can see it easily.

        outpass.rejectionReason =
            rejectionReason.trim();


        // ==========================================
        // CLEAR APPROVAL RECORD
        // ==========================================

        outpass.academicApprovedBy =
            null;

        outpass.academicApprovedAt =
            null;


        // ==========================================
        // SAVE
        // ==========================================

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


        // ==========================================
        // RESPONSE
        // ==========================================

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