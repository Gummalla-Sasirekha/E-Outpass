# E-Outpass Management System

A web-based **E-Outpass Management System** designed to digitize the hostel day-outpass process by replacing WhatsApp requests, paper outpasses, and manual gate registers with a centralized digital workflow.

The system connects **Parents, Wardens, and Main-Gate Security** through role-based dashboards and uses **QR-based gate verification** to record student exit and return.

---

## 📌 Project Overview

In the existing hostel outpass process, parents may send requests through WhatsApp, wardens manually verify and issue paper outpasses, and security staff maintain physical gate records.

This process can lead to:

- Manual paperwork
- Difficulty tracking requests
- Repeated WhatsApp communication
- Manual gate-register entries
- Difficulty maintaining historical records
- Possibility of lost or damaged paper outpasses

The **E-Outpass Management System** provides a digital alternative.

### Digital Workflow

```text
Parent submits request
        ↓
Warden verifies request
        ↓
Warden approves / rejects
        ↓
System generates E-Outpass + QR
        ↓
QR is presented at Main Gate
        ↓
Exit is recorded
        ↓
Student returns
        ↓
Return is recorded
        ↓
Gate history is updated
```

---

## 🎯 Objectives

- Digitize the hostel outpass request process.
- Reduce dependency on paper-based outpasses.
- Replace WhatsApp-based requests with a structured system.
- Provide hostel-specific access for wardens.
- Generate QR-based digital outpasses.
- Record student exit and return times digitally.
- Maintain centralized gate movement history.
- Prevent rejected and completed outpasses from being reused.

---

## 👥 User Roles

### 1. Parent

Parents can:

- Log in to the system.
- View their linked student's details.
- Submit an outpass request.
- Enter place of visit and reason.
- Specify leaving and expected return times.
- Track request status.
- Access the approved outpass and QR code.

### 2. Warden

Each hostel has its own warden.

Wardens can:

- Log in to the system.
- View pending requests belonging to their hostel.
- Verify student and request details.
- Approve an outpass.
- Reject an outpass with a reason.
- View gate history for their own hostel.

Wardens cannot access another hostel's requests or gate history.

### 3. Security

Security operates at the common main gate.

Security can:

- Log in to the Security Dashboard.
- Validate approved outpasses.
- View outpass information.
- Verify QR-based outpasses.
- Access gate movement history.
- View records across hostels.

### 4. Student

Students do not require a separate login.

The student is represented through the linked student record and uses the approved QR outpass for gate confirmation.

The system records:

- Exit time
- Entry time
- Gate status

---

## 🔐 Authentication & Authorization

The system uses:

- **JWT** for authentication
- **bcryptjs** for password hashing
- Role-based authorization
- Protected API routes

Supported roles:

```text
parent
warden
security
```

Each protected operation checks the authenticated user's role before allowing access.

---

## 🏫 Hostel-Based Access Control

The system supports multiple hostels.

Each hostel is associated with a specific warden.

```text
LP GH
 └── Assigned Warden
     ├── Hostel Students
     └── Hostel Outpasses

LP BH
 └── Assigned Warden
     ├── Hostel Students
     └── Hostel Outpasses
```

A warden can access only the requests and gate records belonging to their assigned hostel.

Security, operating at the common main gate, can access gate records across hostels.

---

## 📱 QR-Based Gate Verification

Once an outpass is approved, the system automatically generates a QR code.

The QR code opens the deployed Gate Confirmation page.

### Exit Flow

```text
Approved Outpass
      ↓
QR Code
      ↓
Gate Confirmation
      ↓
Confirm Exit
      ↓
Exit timestamp recorded
      ↓
Status = Outside
```

### Return Flow

```text
Same QR Code
      ↓
Gate Confirmation
      ↓
Confirm Return
      ↓
Entry timestamp recorded
      ↓
Status = Returned
```

A completed outpass cannot be reused.

---

## 🚦 Outpass Status

| Status | Meaning |
|---|---|
| Pending | Waiting for warden approval |
| Approved | Warden approved the request |
| Rejected | Warden rejected the request |
| Completed | Student has exited and returned |
| Expired | Outpass is no longer valid |

---

## 🛡️ Gate Validation

The system prevents invalid gate operations.

```text
Approved  → Allowed
Rejected  → Blocked
Completed → Blocked
```

This prevents a previously completed or rejected outpass from being reused.

---

## 🗃️ Database Design

The application uses MongoDB.

### Collections

```text
users
students
hostels
outpasses
gatelogs
```

### User

Stores:

- Name
- Email
- Password
- Role

### Student

Stores:

- Student ID
- Name
- Course
- Room number
- Hostel
- Parent

### Hostel

Stores:

- Hostel name
- Hostel type
- Assigned warden

### Outpass

Stores:

- Outpass ID
- Student
- Parent
- Hostel
- Place of visit
- Reason
- Requested date
- Leaving time
- Expected return time
- Status
- Rejection reason
- Approval time
- QR code

### GateLog

Stores:

- Outpass
- Student
- Security user
- Exit time
- Entry time
- Gate status

---

## 🏗️ System Architecture

```text
                    ┌──────────────────┐
                    │      Parent      │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ React Frontend   │
                    └────────┬─────────┘
                             │
                         REST API
                             │
                             ▼
                    ┌──────────────────┐
                    │ Express / Node.js│
                    │     Backend      │
                    └────────┬─────────┘
                             │
                    ┌────────┴─────────┐
                    ▼                  ▼
             ┌──────────────┐   ┌──────────────┐
             │   MongoDB    │   │ QR Generator │
             │    Atlas     │   │    Library   │
             └──────────────┘   └──────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Gate Confirmation│
                    │     + QR Flow    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Security Gate   │
                    └──────────────────┘
```

---

## 💻 Technology Stack

### Frontend

- React
- Vite
- HTML
- CSS
- JavaScript
- html5-qrcode

### Backend

- Node.js
- Express.js
- REST APIs

### Database

- MongoDB
- MongoDB Atlas
- Mongoose

### Authentication

- JSON Web Token (JWT)
- bcryptjs

### QR

- qrcode
- html5-qrcode

### Deployment

- Vercel — Frontend
- Render — Backend
- MongoDB Atlas — Database

---

## 📂 Project Structure

```text
E-Outpass/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Login.jsx
│   │   ├── App.jsx
│   │   ├── GateConfirmation.jsx
│   │   ├── ParentDashboard.jsx
│   │   ├── SecurityDashboard.jsx
│   │   ├── StudentDashboard.jsx
│   │   └── WardenDashboard.jsx
│   ├── package.json
│   └── ...
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
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🔌 Main API Endpoints

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
```

### Parent

```text
POST /api/outpass/request
GET  /api/outpass/my-student
GET  /api/outpass/my
```

### Warden

```text
GET   /api/outpass/pending
PATCH /api/outpass/:outpassId/approve
PATCH /api/outpass/:outpassId/reject
GET   /api/outpass/gate-history
```

### Security

```text
POST /api/outpass/validate
POST /api/outpass/scan-out
POST /api/outpass/scan-in
GET  /api/outpass/gate-history
```

### Gate Confirmation

```text
POST /api/outpass/student-status
POST /api/outpass/student-confirm
```

---

## 🔄 Complete System Workflow

```text
┌───────────────┐
│     Parent    │
└───────┬───────┘
        │
        │ Submit Request
        ▼
┌────────────────┐
│     Warden     │
└───────┬────────┘
        │
        ├───────────────┐
        │               │
     Approve          Reject
        │               │
        ▼               ▼
   Generate QR      Rejected
        │
        ▼
┌────────────────┐
│ Approved QR    │
│   Outpass      │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Main Gate      │
│ QR Verification│
└───────┬────────┘
        │
     Confirm Exit
        │
        ▼
   Status: Outside
        │
        │ Student Returns
        ▼
    Confirm Return
        │
        ▼
   Status: Returned
        │
        ▼
   Gate History
```

---

## 📊 Key Features

- Role-based login
- Parent-student linking
- Hostel-wise warden access
- Digital outpass requests
- Warden approval/rejection
- Rejection reason
- Automatic QR generation
- QR-based gate confirmation
- Exit timestamp recording
- Entry timestamp recording
- Gate movement history
- Reuse prevention
- Responsive dashboards
- Mobile-friendly gate confirmation
- Deployed web application

---

## 🔒 Security Considerations

The application includes:

- Password hashing using bcryptjs
- JWT-based authentication
- Protected backend routes
- Role-based authorization
- Hostel-level access restrictions
- Server-side outpass validation
- Prevention of rejected outpass usage
- Prevention of completed outpass reuse
- Environment variables for sensitive configuration

Sensitive environment variables are excluded from version control.

---

## 🚀 Deployment

The application is deployed using:

```text
Frontend
    ↓
Vercel

Backend
    ↓
Render

Database
    ↓
MongoDB Atlas
```

### Frontend

**E-Outpass Web Application:**  
https://e-outpass.vercel.app

### Backend

**E-Outpass API:**  
https://e-outpass-backend.onrender.com

> Environment-specific configuration such as database connection strings and JWT secrets should be stored as environment variables and not committed to the repository.

---

## 🧪 Testing

The system was tested using the following end-to-end scenarios.

### Parent Flow

- Parent login
- Student details retrieval
- Outpass request creation
- Request status tracking

### Warden Flow

- Warden login
- Hostel-specific request visibility
- Outpass approval
- Outpass rejection
- Rejection reason

### Gate Flow

- QR generation
- QR opening on mobile
- Exit confirmation
- Return confirmation
- Gate history update
- Completed outpass reuse prevention
- Rejected outpass blocking

### Access Control

- Hostel-wise warden isolation
- Security access to common gate records

---

## 📱 Responsive Design

The system is designed to work across:

- Desktop
- Laptop
- Tablet
- Mobile devices

The Gate Confirmation page is specifically optimized for mobile usage because it is accessed through QR scanning at the gate.

---

## 🔮 Future Enhancements

Possible future improvements include:

- Parent notifications through email/SMS
- Automated WhatsApp notifications
- Admin management dashboard
- Student login
- Digital signature support
- Real-time gate dashboard
- Advanced analytics and reports
- Multiple gate support
- Attendance integration
- Emergency outpass handling
- Automated expiry handling
- Cloud-based document storage
- Audit logs
- Multi-institution support

---

## 🎓 Project Outcome

The E-Outpass Management System provides a centralized digital solution for managing hostel day-outpass requests and student movement at the main gate.

It reduces manual paperwork, improves request tracking, provides hostel-specific authorization, and creates a digital record of student exit and return.

The system demonstrates the integration of:

```text
React
+
Node.js
+
Express.js
+
MongoDB
+
JWT Authentication
+
QR Technology
+
Cloud Deployment
```

---

## 📌 Project Information

**Project:** E-Outpass Management System  
**Type:** Web Application  
**Purpose:** Digital Hostel Outpass and Gate Management

---

## 📄 License

This project is developed for academic and project demonstration purposes.
