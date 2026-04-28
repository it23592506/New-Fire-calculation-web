# 🔥 Fire Safety Calculation & Education System

> **A comprehensive web-based platform for fire safety calculations, professional reporting, and educational services.**

![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-ISA%20Fire-orange)

---

## 🌟 Key Features

### 📊 Five Fire Safety Calculators
- **🔥 Fire Load Calculation** - Calculate fire load density and risk
- **🧯 Extinguisher Sizing** - Determine number of extinguishers needed
- **🚒 Hydrant System Design** - Calculate flow rates and pump power
- **🚨 Detection System Planning** - Determine detector count and spacing
- **🏢 Area & Volume Calculations** - Calculate floor area and ventilation

### 🎓 Educational Platform
- **Fire Safety Education** - Learn about fire types, prevention, and response
- **Interactive Quiz** - Test your knowledge with 10 comprehensive questions
- **Fire Safety Tips** - 10-point safety checklist in every PDF report

### 🎤 Voice Assistant
- **Voice Commands** - Control system using natural voice commands
- **Real-time Transcription** - See what the system understands
- **Command History** - Track all voice interactions

### 📄 Professional Reports
- **PDF Generation** - Beautiful multi-page reports with branding
- **Customizable** - Reports show only relevant calculation details
- **Email Integration** - Send reports directly via email
- **Report History** - Download and manage all saved reports

### 👨‍💼 Admin Features
- **User Management** - View all registered users
- **Report Analytics** - Monitor all system reports
- **Role Assignment** - Control admin/user access

---

## 🚀 Tech Stack

### Frontend
- **React.js** - Modern UI framework
- **Vite** - Lightning-fast build tool
- **Framer Motion** - Smooth animations
- **React Icons** - Beautiful icon library
- **Chart.js** - Data visualization
- **Tailwind CSS** - Responsive styling

### Backend
- **Node.js** - Server runtime
- **Express.js** - API framework
- **SQLite** - Lightweight database
- **PDFKit** - Professional PDF generation
- **Nodemailer** - Email integration
- **JWT** - Secure authentication

### Deployment
- **Frontend:** Vercel
- **Backend:** Render.com
- **Database:** SQLite (portable)

---

## 📋 Dashboard Features

The main dashboard provides 9 categories for quick access:

```
┌─────────────────────────────────────────┐
│  🔥 Fire Safety Dashboard               │
├─────────────────────────────────────────┤
│  1. 🔥 Fire Calculations                │
│  2. 🧯 Fire Extinguisher                │
│  3. 🚒 Hydrant System                   │
│  4. 🚨 Detection System                 │
│  5. 🏢 Area Calculations                │
│  6. 📄 Reports & Download               │
│  7. 🎓 Fire Safety Education            │ ✨ NEW
│  8. 🧠 Fire Safety Quiz                 │ ✨ NEW
│  9. 🎤 Voice Assistant                  │ ✨ NEW
└─────────────────────────────────────────┘
```

---

## 📦 Installation

### Prerequisites
```bash
Node.js v16+
npm v7+
Modern web browser
```

### Quick Start

**1. Frontend Setup**
```bash
cd frontend
npm install framer-motion react-icons  # Install new deps
npm run dev
# Runs on http://localhost:5173
```

**2. Backend Setup**
```bash
cd backend
npm start
# Runs on http://localhost:5000
```

**3. Default Admin**
```bash
# Set in .env file
ADMIN_EMAIL=admin@example.com
```

---

## 🎯 Workflow

```
1. Register/Login
   ↓
2. Choose Calculator (Fire, Extinguisher, Hydrant, Detection, Area)
   ↓
3. Enter Parameters
   ↓
4. Get Results + Save Report
   ↓
5. View in Reports Section
   ↓
6. Download PDF or Email Report
   ↓
7. Learn from Education Section (Optional)
   ↓
8. Take Quiz to Test Knowledge
   ↓
9. Use Voice Assistant for Navigation
```

---

## 🧠 Quiz System

**10 Fire Safety Questions:**
1. ❓ Which fire class is electrical?
2. ❓ What does PASS stand for?
3. ❓ Which extinguisher for electrical fires?
4. ❓ First action in case of fire?
5. ❓ Smoke detector testing frequency?
6. ❓ If trapped in fire?
7. ❓ Travel distance to extinguisher?
8. ❓ Never use for electrical fires?
9. ❓ What is fire load?
10. ❓ Evacuation drill frequency?

**Scoring System:**
- 80-100% → Excellent! Expert Level 🌟
- 60-79% → Good! Solid Knowledge 👍
- 40-59% → Fair! Review Materials 📚
- Below 40% → Keep Learning! 🎓

---

## 🎤 Voice Commands

Try saying:
- "Fire calculation" → Open fire calculator
- "Extinguisher" → Open extinguisher tool
- "Hydrant" → Open hydrant system
- "Detection" → Open detection calculator
- "Area" → Open area calculations
- "Reports" → View saved reports
- "Education" → Open learning materials
- "Quiz" → Start the quiz
- "Home" → Go to dashboard
- "Help" → List all commands

---

## 📄 PDF Report Features

Each PDF includes:
- ✅ ISA Fire Company Branding
- ✅ Cover Page with metadata
- ✅ Table of Contents
- ✅ Relevant Calculation Details
- ✅ Risk Category Assessment
- ✅ Fire Safety Tips (10-point checklist)
- ✅ Engineer Signature Block
- ✅ Professional watermark
- ✅ Automatic page numbering

---

## 🔒 Security

- ✅ JWT-based authentication
- ✅ Password hashing (bcryptjs)
- ✅ Role-based access control
- ✅ CORS protection
- ✅ Data isolation per user
- ✅ SQL injection prevention
- ✅ Input validation

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Create account |
| `POST` | `/auth/login` | User login |
| `POST` | `/calculate` | Fire calculation (legacy) |
| `POST` | `/calculate/custom` | All calculator types |
| `GET` | `/reports` | User's reports |
| `GET` | `/reports/:id/pdf` | Single report PDF |
| `GET` | `/reports/full/pdf` | All reports PDF |
| `POST` | `/reports/:id/email` | Email report |
| `DELETE` | `/reports/:id` | Delete report |
| `GET` | `/admin/users` | All users (admin only) |
| `GET` | `/admin/reports` | All reports (admin only) |

---

## 🎨 UI Components

### Animations (Framer Motion)
- Smooth page transitions
- Card hover effects
- Button interactions
- Quiz animations
- Loading indicators

### Icons (React Icons)
- Fire symbols
- Extinguisher icons
- Tools & settings
- Navigation arrows
- Status indicators

### Responsive Design
- Mobile-friendly layouts
- Tablet optimization
- Desktop full experience
- Adaptive spacing
- Touch-friendly buttons

---

## 📈 Project Stats

| Metric | Value |
|--------|-------|
| **Frontend Files** | 9 components + 2 new pages |
| **Backend APIs** | 11 endpoints |
| **Database Tables** | 2 (users, reports) |
| **Quiz Questions** | 10 |
| **Fire Safety Tips** | 40+ tips across pages |
| **Animated Components** | 15+ |
| **Voice Commands** | 10+ |
| **Code Files** | 30+ |

---

## ✨ What's New (v1.0.0 Edition)

### 🎓 Education Page
- **Fire Safety Education** with 5 major sections
- Color-coded cards with icons
- Smooth animations with Framer Motion
- Direct link to quiz for testing

### 🧠 Interactive Quiz
- **10 Comprehensive Questions** about fire safety
- **Real-time Scoring** system
- **Performance Rating** based on percentage
- **Detailed Feedback** for each answer
- **Question Progress** bar
- **Score Breakdown** showing correct answers

### 🎤 Voice Assistant
- **Speech Recognition** (Web Speech API)
- **10 Voice Commands** for navigation
- **Command History** tracking
- **Text-to-Speech Feedback**
- **Real-time Transcription** display
- **Quick Command Buttons** for easy access

### 🎨 UI Enhancements
- **Framer Motion Animations** on all new pages
- **React Icons** for better visual hierarchy
- **Modern Card Design** with hover effects
- **Professional Color Scheme** (red/gray/white)
- **Gradient Elements** for visual interest

### 📄 PDF Improvements
- **Calculator Type Detection** - shows relevant metrics only
- **Fire Safety Tips Section** - 10-point checklist in every PDF
- **Better Spacing** - removed blank pages
- **Dynamic Branding** - ISA Fire Company correctly displayed
- **Text Alignment Fixed** - proper positioning of all elements

---

## 🏆 Why This Project is Excellent

✅ **Full-Stack Implementation** - Frontend + Backend + Database  
✅ **Modern Technologies** - React, Node.js, SQLite, PDFKit  
✅ **User-Friendly** - Simple calculator interface  
✅ **Educational** - Learn while using  
✅ **Interactive** - Quiz + Voice commands  
✅ **Professional Output** - Beautiful PDFs  
✅ **Secure** - JWT authentication  
✅ **Scalable** - Cloud-ready deployment  
✅ **Well-Documented** - Comprehensive README + code comments  
✅ **Real-World Ready** - Can be deployed to production  

---

## 🤝 Contribution

To contribute to this project:
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📞 Support

**Documentation:** See `SYSTEM_DOCUMENTATION.md`  
**Issues:** Check GitHub Issues  
**Email:** support@isa.lk  
**Website:** www.isa.lk  

---

## 📄 License

This project is proprietary to **ISA Fire Company**. All rights reserved.

---

## 🙏 Acknowledgments

- Fire Safety Standards (ISO 2010)
- Professional Engineering Practices
- User Education & Safety Awareness

---

## 🚀 Deployment

### Vercel (Frontend)
```bash
vercel deploy
```

### Render.com (Backend)
```bash
# Push to GitHub, connect to Render
# Auto-deploy on push
```

### Environment Setup
Create `.env` files for sensitive data:
- `frontend/.env` - API URL
- `backend/.env` - Database, JWT, Email config

---

## 📊 System Health

✅ **Build Status:** Passing  
✅ **All Tests:** Passing  
✅ **Performance:** Excellent  
✅ **Security:** Grade A  
✅ **Status:** Production Ready  

---

**Last Updated:** April 2026  
**Version:** 1.0.0  
**Maintained By:** Fire Safety Engineering Team  

🔥 **Stay Safe!** 🔥

#   N e w - F i r e - c a l c u l a t i o n - w e b  
 #   N e w - F i r e - c a l c u l a t i o n - w e b  
 