const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: [
                "parent",
                "student",
                "warden",
                "security",
                "hod",
                "classAdvisor"
            ],
            required: true
        },

        // ==========================================
        // AVAILABILITY
        // ==========================================
        //
        // Mainly used for Class Advisors.
        //
        // true  → available to receive approvals
        // false → unavailable, so HOD becomes fallback
        //
        isAvailable: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "User",
    userSchema
);