# 🏢 MGC Apartment Monitoring System

---

## 📌 Overview

The **MGC Apartment Monitoring System** is a web-based application designed to **optimize apartment management processes**, enable real-time monitoring of tenant activities, and facilitate efficient communication between administrators, caretakers, and tenants.

The system addresses limitations of traditional property management approaches, including delayed maintenance processing, inefficient record management, and lack of real-time system visibility. By integrating centralized data handling and automated workflows, the platform improves operational efficiency and decision-making.

Developed using modern **full-stack development technologies**, the system implements **role-based access control (RBAC)**, secure authentication mechanisms, and real-time data synchronization to ensure reliability, scalability, and data integrity across all user interactions.

---

## 🚀 Key Features

### 🏢 Apartment & Unit Management
- Real-time unit occupancy monitoring  
- Unit status tracking (Occupied / Vacant)  
- Contract management with PDF upload and download  
- Structured tenant-unit assignment  

### 🛠 Maintenance Management
- Submission of maintenance requests  
- Categorized concern handling (Electrical, Plumbing, etc.)  
- Status lifecycle tracking (Pending, Ongoing, Completed)  
- Maintenance history logging for tenants  
- Real-time updates via Socket.IO  

### 👥 User Management
- Role-based access control (Admin / Caretaker / Tenant)  
- Secure authentication and authorization (JWT)  
- Profile management and account updates  
- Account approval and verification system  

### 📄 Application Requests
- Tenant application submission workflow  
- Administrative approval and rejection handling  
- Daily unread request tracking  
- Read-status management  

### 📊 Dashboard & Monitoring
- Unit occupancy analytics and visualization  
- Recent request aggregation  
- Activity log tracking  
- Optimized dashboard widgets for system overview  

### 🔔 Notifications System
- Email notifications via Nodemailer  
- Real-time alerts using WebSockets  
- Automated status update notifications  

---

## 🧱 System Architecture

### Frontend
- React.js (Vite)  
- Tailwind CSS + Custom UI components  
- Axios for API communication  
- Socket.IO Client for real-time data updates  

### Backend
- Node.js + Express.js  
- Sequelize ORM  
- RESTful API design pattern  

### Database
- MySQL  
- Relational schema for users, units, contracts, and requests  

---

## 🛠️ Technology Stack

| Layer          | Technology                                      |
| -------------- | ----------------------------------------------- |
| Frontend       | ReactJS (Vite), Tailwind CSS, Custom CSS        |
| Backend        | Node.js, Express.js                             |
| Database       | MySQL                                           |
| ORM            | Sequelize                                       |
| Authentication | JWT                                             |
| File Storage   | Cloudinary                                      |
| Realtime       | Socket.IO                                       |
| Email Service  | Nodemailer                                      |

---
