# 🌐 Master X - Channel Management System

Master X is a **modern and powerful Channel Management System** designed to collect, organize, and manage IPTV channel links from M3U, M3U8, HLS, and other sources. It allows admins to upload/update playlists and lets users search channels by name, status (Live/Down), and copy working links instantly.

> ⚠️ Note: This is **not a streaming platform**. It does not stream or host content — it only manages and collects links from uploaded or linked M3U files.

---

## 🚀 Features

- 🔐 **Simple Login System** (no JWT, no tokens)
- 📥 Upload or paste links to M3U/M3U8/HLS files
- 📡 Live/Down status detection for each channel
- 🔎 Search channels by name with instant filtering
- 📋 Copy-to-clipboard button for each working link
- 📊 Dashboard stats: total channels, working/down
- 🧠 Admin panel for managing and updating lists
- 🌙 Beautiful, responsive dark-themed UI

---

## 🛠️ Technologies Used

| Stack | Technology |
|-------|------------|
| **Frontend** | React.js, Tailwind CSS, Axios |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB with Mongoose |
| **Utils** | m3u-parser, child_process, cron |
| **Tools** | concurrently, dotenv, nodemon |

---

## 📁 Project Structure
master-x/
├── backend/
│ ├── middleware/
│ ├── models/
│ ├── routes/
│ ├── utils/
│ ├── scripts/
│ ├── .env
│ └── server.js
├── frontend/
│ ├── public/
│ ├── src/
│ └── tailwind.config.js
├── deploy.sh
├── ecosystem.config.js
├── DEPLOYMENT.md
├── package.json
└── README.md


---

## ⚙️ Getting Started

### ✅ Prerequisites

- Node.js & npm
- MongoDB running locally or via Atlas
- Git

---

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/master-x.git
   cd master-x
2. Install dependencies for backend and frontend:
   npm run install-all
This runs npm install in root, /backend, and /frontend automatically.

🔧 Configuration
Edit the .env file inside the /backend folder with your MongoDB connection string:

MONGO_URI=mongodb://localhost:27017/masterx
PORT=5000

🧪 Running the Project
To run everything together:
npm start
To run each part separately:

Backend
cd backend
npm run dev

Frontend
cd frontend
npm start

Frontend: http://localhost:3000

Backend API: http://localhost:5000

🚀 Deployment
See DEPLOYMENT.md and deploy.sh for instructions on production deployment using PM2 and reverse proxy (NGINX).

📄 License
This project is licensed under the MIT License.

🙌 Credits
Developed by X Project
© 2025 - All rights reserved.

