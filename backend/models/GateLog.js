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

        security: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
            default: null
        },

        exitTime: {
            type: Date,
            default: null
        },

        entryTime: {
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