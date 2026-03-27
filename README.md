# 🛡️ SecureChat Messenger

![SecureChat Logo](client/public/logo123.png)

**SecureChat** is a high-performance, end-to-end encrypted messaging and video calling platform built with the MERN stack. It features real-time communication using Socket.io and peer-to-peer video streaming powered by WebRTC.

## 🚀 Key Features

- **📽️ Real-Time Video Calls**: High-quality, low-latency peer-to-peer video communication using WebRTC.
- **💬 Instant Messaging**: Real-time text communication with delivery status and seen indicators.
- **🔒 Security First**: End-to-end encryption for messages and secure signaling for media streams.
- **📱 Responsive Design**: A stunning, modern UI built with Tailwind CSS that works seamlessly on desktop and mobile.
- **🔔 Smart Notifications**: Real-time alerts for incoming calls and messages with customizable ringtones.
- **🌑 Dark Mode**: Premium aesthetics with a fully integrated dark mode.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React
- **Backend**: Node.js, Express, Socket.io
- **Database**: NeDB (High-performance, file-based storage)
- **Communication**: WebRTC (SimplePeer), Socket.io Signaling

## 📦 Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/tharun9392/chatting-app.git
cd chatting-app
```

### 2. Setup the Server
```bash
cd server
npm install
npm run dev
```
*Server will start on `http://localhost:5002`*

### 3. Setup the Client
```bash
cd ../client
npm install
npm start
```
*Client will start on `http://localhost:3000`*

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
Built with ❤️ by [Tharun](https://github.com/tharun9392)
