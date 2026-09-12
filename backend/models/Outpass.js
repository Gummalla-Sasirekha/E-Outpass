const mongoose = require("mongoose");

const outpassSchema = new mongoose.Schema(
    {
        outpassId: {
            type: String,
            required: true,
            unique: true
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true
        },

        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        hostel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hostel",
            required: true
        },

        placeOfVisit: {
            type: String,
            required: true,
            trim: true
        },

        reason: {
            type: String,
            required: true,
            trim: true
        },

        dateRequestedFor: {
            type: Date,
            required: true
        },

        timeOfLeaving: {
            type: String,
            required: true
        },

        expectedInTime: {
            type: String,
            required: true
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "completed", "expired"],
            default: "pending"
        },

        rejectionReason: {
            type: String,
            default: ""
        },

        approvedAt: {
            type: Date,
            default: null
        },

        qrCode: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Outpass", outpassSchema);