const mongoose = require("mongoose");

const outpassSchema = new mongoose.Schema(
    {
        // ==========================================
        // BASIC DETAILS
        // ==========================================

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

        // ==========================================
        // WEEKDAY / WEEKEND
        // ==========================================

        dayType: {
            type: String,
            enum: [
                "weekday",
                "weekend"
            ],
            default: null
        },

        // ==========================================
        // ACADEMIC APPROVAL
        // ==========================================

        academicApprovalRequired: {
            type: Boolean,
            default: false
        },

        // Role of the assigned authority
        //
        // classAdvisor = normal weekday flow
        // hod          = fallback flow
        //
        academicApprovalBy: {
            type: String,
            enum: [
                "classAdvisor",
                "hod",
                null
            ],
            default: null
        },

        // Actual User who is assigned
        academicApprover: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        academicApprovalStatus: {
            type: String,
            enum: [
                "not_required",
                "pending",
                "approved",
                "rejected"
            ],
            default: "not_required"
        },

        academicApprovedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        academicApprovedAt: {
            type: Date,
            default: null
        },

        academicRejectionReason: {
            type: String,
            default: ""
        },

        // ==========================================
        // WARDEN APPROVAL
        // ==========================================

        wardenApprovalStatus: {
            type: String,
            enum: [
                "pending",
                "approved",
                "rejected"
            ],
            default: "pending"
        },

        wardenApprovedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        wardenApprovedAt: {
            type: Date,
            default: null
        },

        // ==========================================
        // OVERALL STATUS
        // ==========================================

        status: {
            type: String,
            enum: [
                "pending",
                "academic_pending",
                "warden_pending",
                "approved",
                "rejected",
                "completed",
                "expired"
            ],
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

module.exports = mongoose.model(
    "Outpass",
    outpassSchema
);