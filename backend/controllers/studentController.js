const Student = require("../models/Student");
const Outpass = require("../models/Outpass");

// ==========================================
// GET LOGGED-IN STUDENT PROFILE
// ==========================================

const getMyProfile = async (req, res) => {
    try {
        const student = await Student.findOne({
            user: req.user.userId
        }).populate("hostel", "name type");

        if (!student) {
            return res.status(404).json({
                message: "Student profile not found."
            });
        }

        res.status(200).json({
            message: "Student profile fetched successfully.",
            student
        });

    } catch (error) {
        console.error(
            "Get student profile error:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch student profile.",
            error: error.message
        });
    }
};


// ==========================================
// GET LOGGED-IN STUDENT OUTPASSES
// ==========================================

const getMyOutpasses = async (req, res) => {
    try {
        const student = await Student.findOne({
            user: req.user.userId
        });

        if (!student) {
            return res.status(404).json({
                message: "Student profile not found."
            });
        }

        const outpasses = await Outpass.find({
            student: student._id
        })
            .populate("hostel", "name type")
            .sort({
                createdAt: -1
            });

        res.status(200).json({
            message: "Student outpasses fetched successfully.",
            outpasses
        });

    } catch (error) {
        console.error(
            "Get student outpasses error:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch student outpasses.",
            error: error.message
        });
    }
};


module.exports = {
    getMyProfile,
    getMyOutpasses
};