const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const XLSX = require("xlsx");
const path = require("path");

require("dotenv").config();

const User = require("../models/User");
const Student = require("../models/Student");

const createStudentUsers = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected!");

        // Read students.xlsx
        const filePath = path.join(
            __dirname,
            "../../students.xlsx"
        );

        const workbook = XLSX.readFile(filePath);

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const studentsFromExcel =
            XLSX.utils.sheet_to_json(worksheet);

        console.log(
            `Found ${studentsFromExcel.length} students in Excel.`
        );

        // Demo password for student accounts
        const hashedPassword = await bcrypt.hash(
            "Demo@123",
            10
        );

        for (const studentData of studentsFromExcel) {

            const studentId = String(
                studentData.studentId
            ).trim();

            const studentEmail =
                String(
                    studentData.studentEmail || ""
                )
                    .trim()
                    .toLowerCase();

            const studentName =
                String(
                    studentData.name || ""
                ).trim();

            if (!studentId || !studentEmail) {
                console.log(
                    `Skipping student ${studentId || "unknown"}: studentEmail missing.`
                );
                continue;
            }

            // Find existing Student record
            const student = await Student.findOne({
                studentId: studentId
            });

            if (!student) {
                console.log(
                    `Student ID ${studentId} not found in database.`
                );
                continue;
            }

            // Find student user using STUDENT email
            let user = await User.findOne({
                email: studentEmail
            });

            if (!user) {

                user = await User.create({
                    name: studentName,
                    email: studentEmail,
                    password: hashedPassword,
                    role: "student"
                });

                console.log(
                    `Created student user: ${studentEmail}`
                );

            } else {

                // Safety check:
                // Never convert an existing parent/warden/security
                // account into a student account.
                if (user.role !== "student") {
                    console.log(
                        `ERROR: ${studentEmail} already belongs to role "${user.role}".`
                    );
                    console.log(
                        "Skipping this student to protect the existing account."
                    );
                    continue;
                }

                console.log(
                    `Student user already exists: ${studentEmail}`
                );
            }

            // Link Student document to Student User
            student.user = user._id;

            await student.save();

            console.log(
                `Linked ${studentName} → ${studentEmail}`
            );
        }

        console.log(
            "\nStudent accounts setup completed successfully! 🎉"
        );

        process.exit(0);

    } catch (error) {

        console.error(
            "\nStudent account setup failed:",
            error.message
        );

        process.exit(1);
    }
};

createStudentUsers();