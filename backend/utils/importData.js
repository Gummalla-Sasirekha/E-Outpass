const mongoose = require("mongoose");
const XLSX = require("xlsx");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config();

const User = require("../models/User");
const Hostel = require("../models/Hostel");
const Student = require("../models/Student");

// ==========================================
// EXCEL FILE LOCATIONS
// ==========================================

const USERS_FILE = path.join(
    __dirname,
    "..",
    "..",
    "users.xlsx"
);

const HOSTELS_FILE = path.join(
    __dirname,
    "..",
    "..",
    "hostels.xlsx"
);

const STUDENTS_FILE = path.join(
    __dirname,
    "..",
    "..",
    "students.xlsx"
);


// ==========================================
// DEMO PASSWORD
// ==========================================

const DEFAULT_PASSWORD = "Demo@123";


// ==========================================
// NORMALIZE EXCEL COLUMN NAMES
// ==========================================

function normalizeKey(key) {
    return String(key)
        .trim()
        .toLowerCase()
        .replace(/[\s_-]/g, "");
}


// ==========================================
// READ EXCEL FILE
// ==========================================

function readExcel(filePath) {
    const workbook = XLSX.readFile(filePath);

    const sheet =
        workbook.Sheets[workbook.SheetNames[0]];

    const rawData =
        XLSX.utils.sheet_to_json(sheet);

    return rawData.map((row) => {

        const cleanedRow = {};

        for (const key of Object.keys(row)) {

            const normalizedKey =
                normalizeKey(key);

            cleanedRow[normalizedKey] =
                row[key];
        }

        return cleanedRow;
    });
}


// ==========================================
// IMPORT DATA
// ==========================================

const importData = async () => {

    try {

        await mongoose.connect(
            process.env.MONGO_URI
        );

        console.log(
            "MongoDB connected successfully!"
        );


        // ======================================
        // READ EXCEL FILES
        // ======================================

        const users =
            readExcel(USERS_FILE);

        const hostels =
            readExcel(HOSTELS_FILE);

        const students =
            readExcel(STUDENTS_FILE);


        console.log(
            `Users found: ${users.length}`
        );

        console.log(
            `Hostels found: ${hostels.length}`
        );

        console.log(
            `Students found: ${students.length}`
        );


        // ======================================
        // DEMO RESET
        // ======================================

        await Student.deleteMany({});
        await Hostel.deleteMany({});
        await User.deleteMany({});

        console.log(
            "Existing demo data cleared."
        );


        // ======================================
        // HASH DEFAULT PASSWORD
        // ======================================

        const hashedPassword =
            await bcrypt.hash(
                DEFAULT_PASSWORD,
                10
            );


        // ======================================
        // USER MAP
        // ======================================

        const userMap = {};


        // ======================================
        // IMPORT USERS FROM EXCEL
        // ======================================

        for (const userData of users) {

            const name =
                String(userData.name).trim();

            const email =
                String(userData.email)
                    .trim()
                    .toLowerCase();

            const role =
                String(userData.role)
                    .trim()
                    .toLowerCase();


            console.log(
                `Importing user: ${name} | ${email} | ${role}`
            );


            const user =
                await User.create({
                    name,
                    email,
                    password: hashedPassword,
                    role
                });


            userMap[email] =
                user._id;


            console.log(
                `User created: ${name} (${role})`
            );
        }


        // ======================================
        // HOSTEL MAP
        // ======================================

        const hostelMap = {};


        // ======================================
        // IMPORT HOSTELS
        // ======================================

        for (const hostelData of hostels) {

            const hostelName =
                String(
                    hostelData.name
                ).trim();

            const hostelType =
                String(
                    hostelData.type
                )
                    .trim()
                    .toLowerCase();

            const wardenEmail =
                String(
                    hostelData.wardenemail
                )
                    .trim()
                    .toLowerCase();


            console.log(
                `Importing hostel: ${hostelName} | Warden: ${wardenEmail}`
            );


            const wardenId =
                userMap[wardenEmail];


            if (!wardenId) {

                console.log(
                    `Warden not found: ${wardenEmail}`
                );

                continue;
            }


            const hostel =
                await Hostel.create({
                    name: hostelName,
                    type: hostelType,
                    warden: wardenId
                });


            hostelMap[hostelName] =
                hostel._id;


            console.log(
                `Hostel created: ${hostelName}`
            );
        }


        // ======================================
        // IMPORT STUDENTS + CREATE LOGIN
        // ======================================

        for (const studentData of students) {

            const studentId =
                String(
                    studentData.studentid
                ).trim();

            const studentName =
                String(
                    studentData.name
                ).trim();

            const course =
                String(
                    studentData.course
                ).trim();

            const roomNumber =
                String(
                    studentData.roomnumber
                ).trim();

            const hostelName =
                String(
                    studentData.hostel
                ).trim();

            const parentEmail =
                String(
                    studentData.parentemail
                )
                    .trim()
                    .toLowerCase();


            console.log("");
            console.log(
                `Importing student: ${studentName}`
            );


            // ==================================
            // FIND PARENT
            // ==================================

            const parentId =
                userMap[parentEmail];


            if (!parentId) {

                console.log(
                    `Parent not found: ${parentEmail}`
                );

                continue;
            }


            // ==================================
            // FIND HOSTEL
            // ==================================

            const hostelId =
                hostelMap[hostelName];


            if (!hostelId) {

                console.log(
                    `Hostel not found: ${hostelName}`
                );

                continue;
            }


            // ==================================
            // CREATE STUDENT LOGIN
            // ==================================

            const studentEmail =
                `student${studentId}@eoutpass.local`;


            console.log(
                `Creating student login: ${studentEmail}`
            );


            const studentUser =
                await User.create({
                    name: studentName,

                    email: studentEmail,

                    password:
                        hashedPassword,

                    role: "student"
                });


            // ==================================
            // CREATE STUDENT RECORD
            // ==================================

            const student =
                await Student.create({

                    studentId,

                    name: studentName,

                    course,

                    roomNumber,

                    hostel: hostelId,

                    parent: parentId,

                    user: studentUser._id
                });


            console.log(
                `Student created: ${studentName}`
            );

            console.log(
                `Student login: ${studentEmail}`
            );

            console.log(
                `Student password: ${DEFAULT_PASSWORD}`
            );
        }


        // ======================================
        // COMPLETION
        // ======================================

        console.log("");

        console.log(
            "===================================="
        );

        console.log(
            "🎉 DATA IMPORT COMPLETED!"
        );

        console.log(
            "===================================="
        );

        console.log(
            `Original users imported: ${users.length}`
        );

        console.log(
            `Hostels imported: ${hostels.length}`
        );

        console.log(
            `Students imported: ${students.length}`
        );

        console.log(
            "Student login accounts created successfully."
        );

        console.log(
            `Demo password: ${DEFAULT_PASSWORD}`
        );

        console.log(
            "===================================="
        );

        console.log("");

        console.log(
            "🎓 STUDENT LOGIN ACCOUNTS"
        );

        console.log(
            "===================================="
        );

        for (const studentData of students) {

            const studentId =
                String(
                    studentData.studentid
                ).trim();

            const studentName =
                String(
                    studentData.name
                ).trim();

            console.log(
                `${studentName} → student${studentId}@eoutpass.local`
            );
        }

        console.log(
            "===================================="
        );


    } catch (error) {

        console.log("");

        console.log(
            "❌ DATA IMPORT FAILED"
        );

        console.error(error);


    } finally {

        await mongoose.connection.close();

        console.log(
            "MongoDB connection closed."
        );
    }
};


// ==========================================
// RUN IMPORT
// ==========================================

importData();