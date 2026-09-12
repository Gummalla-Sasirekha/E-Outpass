const mongoose = require("mongoose");

const hostelSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        type: {
            type: String,
            enum: ["girls", "boys"],
            required: true
        },

        warden: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Hostel", hostelSchema);