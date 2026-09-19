const express = require("express");
const Student = require("../models/Student");
const Hostel = require("../models/Hostel");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

// Get students belonging to the logged-in warden's hostel.
router.get(
    "/warden-students",
    protect,
    authorize("warden"),
    async (req, res) => {
        try {
            const hostel = await Hostel.findOne({
                warden: req.user.userId
            });

            if (!hostel) {
                return res.status(404).json({
                    message: "No hostel is assigned to this warden."
                });
            }

            const students = await Student.find({
                hostel: hostel._id
            })
                .select("studentId name course roomNumber")
                .sort({ name: 1 });

            return res.status(200).json({
                hostel: hostel.name,
                count: students.length,
                students
            });
        } catch (error) {
            console.error(
                "Get warden students error:",
                error
            );

            return res.status(500).json({
                message:
                    "Server error while fetching hostel students."
            });
        }
    }
);

module.exports = router;