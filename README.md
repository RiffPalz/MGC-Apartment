# 🏢 MGC Apartment Monitoring System

---

## 📌 Overview

The **MGC Apartment Monitoring System** is a full-stack web application designed to **optimize apartment management processes**, enable real-time monitoring of tenant activities, and facilitate efficient communication between administrators, caretakers, and tenants.

The system addresses limitations of traditional property management approaches — including delayed maintenance processing, inefficient record management, and lack of real-time visibility — by integrating centralized data handling, automated workflows, and multi-channel notifications (in-app, email, and SMS).

Built with modern full-stack technologies, the platform implements **role-based access control (RBAC)**, secure JWT authentication, real-time data synchronization via Socket.IO, and automated SMS notifications via Semaphore.

---

## 🚀 Key Features

### 🏢 Unit & Contract Management
- Real-time unit occupancy monitoring (Occupied / Vacant / Ready)
- Contract creation, editing, renewal, termination, and completion
- PDF contract upload and download via Cloudinary
- Automated contract expiry detection with 30-day and 5-day SMS reminders
- Tenant-unit assignment with capacity enforcement

### 💳 Payment Management
- Monthly rent bill generation (manual and automated via cron)
- Utility bill creation and tracking
- Receipt upload by tenants (Cash / GCash)
- Payment verification by admin and caretaker
- Overdue payment auto-marking via scheduled cron job
- Payment status lifecycle: Unpaid → Pending Verification → Paid / Overdue

### 🛠 Maintenance Management
- Tenant maintenance request submission with category selection
- Status lifecycle: Pending → Approved → In Progress → Done
- Follow-up notification system for tenants
- Admin and caretaker maintenance creation and management
- Real-time status updates via Socket.IO

### 👥 User & Account Management
- Role-based access control: Admin / Caretaker / Tenant
- Secure JWT authentication with login token management
- Admin two-factor login via email OTP
- Tenant registration with unit availability validation
- Account approval / decline workflow with SMS notification
- Profile management with photo upload (admin)
- Password reset via email code

### 📣 Announcements
- Admin-created announcements with category tagging
- In-app notification delivery to all tenants and caretakers
- SMS broadcast to all approved tenants on new announcement

### 📄 Application Requests
- Public tenant application submission with ID upload
- Admin review, approval, and rejection workflow
- Application status check by email

### 📊 Dashboard & Activity Logs
- Unit occupancy analytics and contract summaries
- Payment dashboard with revenue tracking
- Activity log per user role
- Maintenance and payment stat cards

### 🔔 Notification System
- **In-app notifications** via Socket.IO (real-time)
- **Email notifications** via Resend (OTP, password reset, application confirmation)
- **SMS notifications** via Semaphore for all critical events (see SMS section below)


## 🧱 System Architecture

### Frontend
- React.js (Vite)
- Tailwind CSS v4 with custom design tokens
- Axios for API communication
- Socket.IO Client for real-time updates
- React Router v6 with role-based protected routes

### Backend
- Node.js + Express.js
- Sequelize ORM with MySQL
- RESTful API with role-based middleware
- Socket.IO for real-time event broadcasting
- node-cron for scheduled tasks (overdue payments, contract expiry, rent billing)

### Infrastructure & Services
- **Database:** MySQL
- **File Storage:** Cloudinary (profile pictures, contract PDFs, payment receipts)
- **Email:** Resend API
- **SMS:** Semaphore API
- **Deployment:** Render (backend), Vercel / Render (frontend)

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (Vite), Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MySQL |
| ORM | Sequelize |
| Authentication | JWT |
| Real-time | Socket.IO |
| File Storage | Cloudinary |
| Email Service | Resend |
| SMS Service | Semaphore |
| Scheduler | node-cron |

---