const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const outpassRoutes = require("./routes/outpassRoutes");
const studentRoutes = require("./routes/studentRoutes");
const wardenStudentRoutes = require("./routes/wardenStudentRoutes");

const app = express();


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json());


// ==========================================
// ROUTES
// ==========================================

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/outpass",
    outpassRoutes
);

app.use(
    "/api/student",
    studentRoutes
);

app.use(
    "/api/outpass",
    wardenStudentRoutes
);

// ==========================================
// ROOT ROUTE
// ==========================================

app.get("/", (req, res) => {
    res.json({
        message: "E-Outpass Backend is running!",
        status: "OK"
    });
});


// ==========================================
// 404 HANDLER
// ==========================================

app.use((req, res) => {
    res.status(404).json({
        message: "API endpoint not found."
    });
});


// ==========================================
// MONGODB CONNECTION
// ==========================================

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {

        console.log(
            "MongoDB connected successfully!"
        );

        // Render provides PORT automatically.
        // For local development, it will use 5000.
        const PORT = process.env.PORT || 5000;

        app.listen(
            PORT,
            "0.0.0.0",
            () => {

                console.log(
                    `Server running on port ${PORT}`
                );

            }
        );

    })
    .catch((error) => {

        console.error(
            "MongoDB connection failed:",
            error.message
        );

    });