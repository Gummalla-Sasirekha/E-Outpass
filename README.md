# 🎫 E-Outpass Management System

## 📌 Overview

The **E-Outpass Management System** is a web-based application designed
to digitize and simplify the college outpass process.

The system replaces the traditional paper-based workflow with a
centralized digital process involving **Parents, Students, Wardens, and
Security**.

### 🔄 Current Digital Workflow

``` text
Parent submits outpass request
        ↓
Warden verifies and approves/rejects
        ↓
Approved E-Outpass is generated
        ↓
Student receives approval/status notification
        ↓
Student reaches the common main gate
        ↓
Security searches by Student Name / Outpass ID
        ↓
Security displays the QR code
        ↓
Student scans the QR displayed by Security
        ↓
OUT time is recorded
        ↓
Student leaves
        ↓
Student returns to the main gate
        ↓
Security displays the same QR again
        ↓
Student scans the QR again
        ↓
IN time is recorded
        ↓
Outpass is marked Completed
```

------------------------------------------------------------------------

## 🎯 Objectives

-   Digitize the existing college outpass process.
-   Reduce dependency on paper-based passes and manual gate registers.
-   Provide separate dashboards for different users.
-   Allow students to securely log in and track their outpass status.
-   Enable wardens to verify requests belonging only to their hostel.
-   Provide Security with a common main-gate dashboard across hostels.
-   Automate OUT and IN gate records using QR verification.
-   Maintain a centralized database of students, hostels, users,
    outpasses, and gate logs.

------------------------------------------------------------------------

# 👥 User Roles

## 1. Parent

Parents can:

-   Log in to the system.
-   Access their linked student's information.
-   Submit an outpass request.
-   Enter place of visit, reason, date, leaving time, and expected
    return time.
-   Track the request status.
-   View rejected, approved, and completed requests.

## 2. Student

Students have their **own login accounts** using their real student
email and password.

Students can:

-   Log in securely.
-   View their student information.
-   View their submitted outpasses.
-   Receive status notifications.
-   See whether an outpass is:
    -   Pending
    -   Approved
    -   Rejected
    -   Completed
    -   Expired
-   Follow the main-gate instructions for an approved outpass.

> The normal Student Dashboard does **not** display a QR code. The QR
> code is displayed by Security at the common main gate, and the student
> scans it using their phone.

## 3. Warden

Each hostel has its own warden.

Wardens can:

-   Log in securely.
-   View pending requests belonging to their hostel.
-   Verify outpass details.
-   Approve requests.
-   Reject requests with a rejection reason.
-   View outpass history for their hostel.
-   View gate history related to their hostel.

## 4. Security

There is a common Security account/dashboard for the main gate.

Security can:

-   Log in securely.
-   View approved outpasses from all hostels.
-   Search using Student Name or Outpass ID.
-   Open an approved outpass.
-   Display its QR code at the gate.
-   Record OUT when the student scans the displayed QR.
-   Record IN when the student scans the displayed QR again.
-   View complete gate history across all hostels.

------------------------------------------------------------------------

# 🔐 Authentication

The system uses **JWT-based authentication**.

Supported roles:

``` text
parent
student
warden
security
```

Passwords are stored using bcrypt hashing.

Student accounts are created from the imported master data rather than
through public registration.

Public registration is available for:

-   Parent
-   Warden
-   Security

Student accounts are linked to student records during data import.

------------------------------------------------------------------------

# 🏢 Hostel-Based Access

The system supports multiple hostels.

Each hostel has:

-   Hostel name
-   Hostel type
-   Assigned warden

Wardens only access requests and gate information associated with their
own hostel.

Security has access to approved outpasses and gate history across all
hostels because the verification point is the common main gate.

------------------------------------------------------------------------

# 🎓 Student Dashboard

The Student Dashboard provides students with a centralized view of their
outpass activity.

It includes:

-   Student profile information.
-   Latest status notification.
-   List of submitted outpasses.
-   Current outpass status.
-   Rejection reason when applicable.
-   Approval information.
-   Completion information.

### Status Notifications

  Status      Student Message
  ----------- -----------------------------
  Pending     Waiting for Warden Approval
  Approved    Outpass Approved
  Rejected    Outpass Rejected
  Completed   Returned Successfully
  Expired     Outpass Expired

For an approved request, the student is instructed to go to the main
gate and scan the QR code displayed by Security.

------------------------------------------------------------------------

# 📱 QR Gate Verification

QR verification is designed around the actual main-gate workflow.

## OUT Process

1.  Student reaches the common main gate.
2.  Student tells Security their name.
3.  Security searches for the student.
4.  Security selects the approved outpass.
5.  The QR code is displayed on the Security dashboard.
6.  Student scans the QR using their phone.
7.  The system verifies the student and outpass.
8.  The OUT time is recorded automatically.
9.  A `GateLog` entry is created with status `outside`.

## IN Process

1.  Student returns to the common main gate.
2.  Security searches for the student again.
3.  Security selects the same outpass.
4.  Security displays the QR again.
5.  Student scans the QR.
6.  The system verifies the active gate record.
7.  The IN time is recorded automatically.
8.  The gate log status changes to `returned`.
9.  The outpass status changes to `completed`.

The system prevents an already active OUT record from being scanned out
again and requires a valid OUT record before IN can be recorded.

------------------------------------------------------------------------

# 📊 Outpass Status Flow

``` text
        Pending
           │
     ┌─────┴─────┐
     ↓           ↓
  Rejected    Approved
                 │
                 ↓
              Gate OUT
                 │
                 ↓
              Gate IN
                 │
                 ↓
             Completed
```

An outpass can also become `expired` according to the application's
validation rules.

------------------------------------------------------------------------

# 🗄️ Database Design

The application uses **MongoDB**.

## User

Stores authentication and role information.

``` text
name
email
password
role
```

## Student

Stores student information and links the student to their user account.

``` text
studentId
name
course
roomNumber
hostel
parent
user
```

## Hostel

Stores hostel information and its assigned warden.

``` text
name
type
warden
```

## Outpass

Stores outpass requests and approval information.

``` text
outpassId
student
parent
hostel
placeOfVisit
reason
dateRequestedFor
timeOfLeaving
expectedInTime
status
rejectionReason
approvedAt
qrCode
```

## GateLog

Stores the actual main-gate movement.

``` text
outpass
student
security
exitTime
entryTime
status
```

------------------------------------------------------------------------

# 📊 Data Import

The system supports initial master-data import using Excel files.

``` text
users.xlsx
students.xlsx
hostels.xlsx
```

### `users.xlsx`

Contains user accounts for:

-   Parents
-   Students
-   Wardens
-   Security

Student users use their actual student email addresses.

### `students.xlsx`

Contains student master data and links each student to:

-   Parent
-   Hostel
-   Student login account

### `hostels.xlsx`

Contains hostel information and assigned wardens.

The importer reuses the existing student User records from `users.xlsx`
and links them to the corresponding Student records, avoiding duplicate
student accounts.

> For the academic/demo environment, the importer uses the configured
> demo password for imported accounts.

------------------------------------------------------------------------

# 🏗️ System Architecture

``` text
                    ┌─────────────────────┐
                    │      Frontend       │
                    │     React + Vite    │
                    └──────────┬──────────┘
                               │
                               │ REST API / JWT
                               ↓
                    ┌─────────────────────┐
                    │       Backend       │
                    │   Node + Express    │
                    └──────────┬──────────┘
                               │
                               ↓
                    ┌─────────────────────┐
                    │    MongoDB Atlas    │
                    └─────────────────────┘
```

### Main Components

``` text
Parent Dashboard
       │
Student Dashboard
       │
Warden Dashboard
       │
Security Dashboard
       │
       ↓
Node.js / Express API
       │
       ↓
MongoDB Atlas
```

------------------------------------------------------------------------

# 🛠️ Technology Stack

## Frontend

-   React.js
-   Vite
-   JavaScript
-   CSS

## Backend

-   Node.js
-   Express.js
-   REST APIs
-   JWT Authentication
-   bcrypt / bcryptjs
-   QRCode generation

## Database

-   MongoDB
-   MongoDB Atlas
-   Mongoose

## Data

-   Excel `.xlsx` files
-   ExcelJS / XLSX-based import workflow

## Deployment

-   Vercel --- Frontend
-   Render --- Backend
-   MongoDB Atlas --- Database

------------------------------------------------------------------------

# 📁 Project Structure

``` text
E-Outpass/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   ├── StudentDashboard.jsx
│   │   ├── StudentDashboard.css
│   │   ├── WardenDashboard.jsx
│   │   ├── SecurityDashboard.jsx
│   │   └── ...
│   │
│   └── package.json
│
├── backend/
│   ├── config/
│   ├── controllers/
│   │   └── authController.js
│   ├── middleware/
│   ├── models/
│   │   ├── User.js
│   │   ├── Student.js
│   │   ├── Hostel.js
│   │   ├── Outpass.js
│   │   └── GateLog.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── outpassRoutes.js
│   │   ├── studentRoutes.js
│   │   └── testRoutes.js
│   ├── utils/
│   │   ├── createStudentUsers.js
│   │   └── importData.js
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
├── hostels.xlsx
├── students.xlsx
└── users.xlsx
```

------------------------------------------------------------------------

# 🔗 Main API Endpoints

## Authentication

``` text
POST /api/auth/login
POST /api/auth/register
```

## Student

``` text
GET /api/student/me
GET /api/student/outpasses
```

## Outpass

``` text
POST /api/outpass/request
GET  /api/outpass/my
GET  /api/outpass/pending
GET  /api/outpass/warden-history
PUT  /api/outpass/:id/approve
PUT  /api/outpass/:id/reject
POST /api/outpass/validate
```

## Security

``` text
GET  /api/outpass/security-approved
POST /api/outpass/scan-out
POST /api/outpass/scan-in
GET  /api/outpass/gate-history
```

## Student Gate Confirmation

``` text
POST /api/outpass/student-confirm
```

All protected endpoints use the authenticated user's JWT token.

------------------------------------------------------------------------

# 🔄 Complete System Workflow

## 1. Parent Request

The parent logs in and submits an outpass request for their linked
student.

The request is stored with status:

``` text
pending
```

## 2. Warden Verification

The relevant hostel warden views the pending request.

The warden can:

``` text
Approve
   OR
Reject
```

If rejected, the rejection reason is stored and shown to the student.

## 3. Approval

When approved:

``` text
status = approved
```

The system records the approval time and generates a QR code associated
with the gate-verification URL.

## 4. Student Notification

The student logs in and sees the updated outpass status.

For an approved pass, the student is instructed to go to the common main
gate and scan the QR displayed by Security.

## 5. Security Verification

Security searches the approved outpass using:

``` text
Student Name
OR
Outpass ID
```

Security opens the selected outpass and displays the QR code.

## 6. Student Scans for OUT

The student scans the QR displayed on the Security screen.

The system validates the outpass and records:

``` text
exitTime
status = outside
```

## 7. Student Returns

When the student returns, Security searches for the same student/outpass
again and displays the QR.

## 8. Student Scans for IN

The student scans the displayed QR again.

The system records:

``` text
entryTime
status = returned
```

The related outpass is then marked:

``` text
status = completed
```

## 9. Gate History

The Security dashboard maintains the gate history.

Wardens can view gate history relevant to their hostel.

------------------------------------------------------------------------

# ✨ Key Features

-   Role-based authentication.
-   Separate Parent, Student, Warden, and Security dashboards.
-   Student login using real student email.
-   Hostel-specific warden access.
-   Common main-gate Security dashboard.
-   Parent-to-student linking.
-   Student-to-hostel linking.
-   Digital outpass requests.
-   Warden approval/rejection.
-   Rejection reason tracking.
-   Student status notifications.
-   Automatic QR generation after approval.
-   Security-side QR display.
-   Student QR scanning for OUT.
-   Student QR scanning for IN.
-   Automatic exit and entry timestamps.
-   Gate history.
-   Automatic outpass completion.
-   Search by student name or Outpass ID.
-   MongoDB-based centralized data storage.
-   Excel master-data import.
-   Responsive dashboard interfaces.

------------------------------------------------------------------------

# 🛡️ Security

The application includes several security mechanisms:

-   JWT-based authentication.
-   Role-based authorization.
-   Password hashing using bcrypt.
-   Protected API routes.
-   Hostel-level access restrictions for wardens.
-   Security-only access to gate verification operations.
-   Student authentication for student-side gate confirmation.
-   Validation of outpass status before gate actions.
-   Prevention of duplicate OUT operations.
-   Prevention of IN without an active OUT record.
-   Environment variables for sensitive backend configuration.

> Sensitive values such as database credentials and JWT secrets should
> be stored in environment variables and must not be committed to
> GitHub.

------------------------------------------------------------------------

# 🧪 Testing

The system can be tested through the complete role-based workflow.

### Parent Testing

-   Login
-   Submit outpass
-   View request status
-   View rejection/approval/completion

### Student Testing

-   Login using student email
-   View student information
-   View outpasses
-   Check status notifications
-   Scan the QR displayed by Security
-   Verify OUT status
-   Scan again when returning
-   Verify completed status

### Warden Testing

-   Login
-   View own hostel requests
-   Approve request
-   Reject request
-   Add rejection reason
-   View hostel history

### Security Testing

-   Login
-   View approved outpasses
-   Search by student name
-   Search by Outpass ID
-   Display QR
-   Verify OUT
-   Verify IN
-   View gate history

------------------------------------------------------------------------

# 📱 Responsive Design

The dashboards are designed to work across:

-   Desktop
-   Laptop
-   Tablet
-   Mobile devices

The student-side QR scanning workflow is particularly suitable for
mobile use because the student can scan the QR displayed at the main
gate using their phone.

------------------------------------------------------------------------

# 🚀 Future Enhancements

Possible future improvements include:

-   Admin management dashboard.
-   Bulk student/hostel/user management.
-   Email or WhatsApp notifications.
-   Advanced analytics and reports.
-   Automatic reminders for expected return times.
-   Improved audit logs.
-   Attendance integration.
-   Parent notification when the student exits and returns.
-   Additional security and access-control policies.

------------------------------------------------------------------------

# 🏆 Project Outcome

The **E-Outpass Management System** provides a complete digital
alternative to the traditional paper-based outpass workflow.

It connects:

``` text
Parent
   ↓
Warden
   ↓
Student
   ↓
Security
   ↓
Gate History
```

By combining **role-based access, centralized MongoDB storage, digital
approvals, student status tracking, and QR-based main-gate
verification**, the system reduces manual work and provides a more
organized and traceable outpass process.

------------------------------------------------------------------------

## 📄 License

This project is developed for academic/project purposes.
