const mongoose = require("mongoose");

const outpassSchema = new mongoose.Schema(
    {
        // =====================================================
        // BASIC OUTPASS INFORMATION
        // =====================================================

        outpassId: {
            type: String,
            required: true,
            unique: true,
            trim: true
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

        // =====================================================
        // REQUEST DETAILS
        // =====================================================

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

        // =====================================================
        // PASS TYPE
        // =====================================================

        passType: {
            type: String,
            enum: [
                "day",
                "long_duration"
            ],
            default: "day"
        },

        // =====================================================
        // LEAVING DATE
        // =====================================================

        dateRequestedFor: {
            type: Date,
            required: true
        },

        // =====================================================
        // RETURN DATE
        // For day pass: same as dateRequestedFor
        // For long-duration pass: future date
        // =====================================================

        returnDate: {
            type: Date,
            required: true
        },

        // =====================================================
        // LEAVING / RETURN TIMES
        // =====================================================

        timeOfLeaving: {
            type: String,
            required: true,
            trim: true
        },

        expectedInTime: {
            type: String,
            required: true,
            trim: true
        },

        // =====================================================
        // DAY TYPE
        // Based on the leaving date
        // =====================================================

        dayType: {
            type: String,
            enum: [
                "weekday",
                "weekend"
            ],
            required: true
        },

        // =====================================================
        // ACADEMIC APPROVAL
        // HOD / CLASS ADVISOR
        // =====================================================

        academicApprovalRequired: {
            type: Boolean,
            default: false
        },

        academicApprovalBy: {
            type: String,
            enum: [
                "classAdvisor",
                "hod",
                null
            ],
            default: null
        },

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

        academicRejectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        academicRejectedAt: {
            type: Date,
            default: null
        },

        academicRejectionReason: {
            type: String,
            default: "",
            trim: true
        },

        // =====================================================
        // WARDEN APPROVAL
        // =====================================================

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

        // =====================================================
        // OVERALL OUTPASS STATUS
        // =====================================================

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
            default: "",
            trim: true
        },

        approvedAt: {
            type: Date,
            default: null
        },

        // =====================================================
        // QR CODES
        // Separate QR for exit and return
        // =====================================================

        exitQrCode: {
            type: String,
            default: null
        },

        returnQrCode: {
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