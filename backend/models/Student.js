const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
    {
        studentId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        course: {
            type: String,
            required: true,
            trim: true
        },

        roomNumber: {
            type: String,
            required: true,
            trim: true
        },

        hostel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hostel",
            required: true
        },

        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // ==========================================
        // STUDENT LOGIN
        // ==========================================

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        // ==========================================
        // ACADEMIC AUTHORITIES
        // ==========================================

        // Student's HOD
        hod: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        // Student's Class Advisor
        //
        // This can remain null until the actual
        // Class Advisor data is available.
        //
        classAdvisor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Student",
    studentSchema
);