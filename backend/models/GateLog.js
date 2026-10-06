const mongoose = require("mongoose");

const gateLogSchema = new mongoose.Schema(
    {
        outpass: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Outpass",
            required: true
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true
        },

        hostel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hostel",
            required: false,
            default: null
        },

        // Security user who records the exit.
        // Public QR flow leaves this null.
        outScannedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
            default: null
        },

        // Security user who records the return.
        // Public QR flow leaves this null.
        inScannedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
            default: null
        },

        // Student exit time
        outTime: {
            type: Date,
            default: null
        },

        // Student return time
        inTime: {
            type: Date,
            default: null
        },

        status: {
            type: String,
            enum: ["outside", "returned"],
            default: "outside"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "GateLog",
    gateLogSchema
);