<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🎄 Celestial Christmas Tree

An interactive 3D Christmas tree experience powered by React Three Fiber and hand gesture recognition. Transform particles from scattered chaos into a beautiful Christmas tree using intuitive hand gestures!

## ✨ Features

- **🌟 Particle System**: 2400+ pine needles that dynamically form a Christmas tree
- **🎁 Interactive Gifts**: 30 customizable gift boxes with personalized messages
- **🖼️ Photo Frames**: 15 photo frames that display festive images or your own photos
- **👋 Gesture Control**: Use hand gestures to control the experience:
  - ✋ Open Hand → Scatter particles
  - ✊ Closed Fist → Form tree
  - 👌 Pinch → View photo frames
  - ☝️ Point → Open gifts
- **🎨 Beautiful Effects**: Bloom lighting, vignette, and particle animations
- **📱 Responsive**: Optimized for both desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher recommended)
- Modern web browser with WebGL support

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Celestial-Christmas-Tree
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000` (or the port shown in terminal)

### Building for Production

```bash
npm run build
npm run preview
```

## 🌐 部署到 Railway

这个项目已经配置好可以直接部署到 Railway！

### 快速部署

1. **推送代码到 Git**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **访问 Railway**
   - 前往 [Railway.app](https://railway.app)
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择你的仓库

3. **自动部署**
   - Railway 会自动检测配置并开始部署
   - 等待 2-5 分钟完成构建
   - 点击 "Generate Domain" 获取公共 URL

📖 **详细部署指南**: 查看 [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)

### 部署命令
```bash
# 构建
npm run build

# 启动生产服务器
npm run start
```

## 🎮 How to Use

### Gesture Controls

The app uses MediaPipe hand tracking to recognize your gestures:

1. **Allow camera access** when prompted
2. **Show your hand** to the webcam (visible in the top-right corner)
3. **Use gestures** to interact:
   - Open all fingers to scatter particles
   - Close fist to form the tree
   - Pinch thumb and index finger to view photos
   - Point with index finger to view gifts

### Manual Controls

If gesture detection isn't working, use the manual controls at the bottom of the screen:
- Scatter / Tree / Photo / Gift buttons

### Customization

- **Upload Photos**: Click on "PICK A PHOTO" instruction to upload your own images
- **Edit Gifts**: Click on "PICK A GIFT" instruction to customize gift messages

## 🏗️ Architecture

### Project Structure

```
/
├── components/
│   ├── Experience.tsx      # Main 3D scene orchestration
│   ├── Needles.tsx         # Pine needle particle system
│   ├── Decorations.tsx     # Baubles, lights, and star topper
│   ├── InteractiveItems.tsx # Gifts and photo frames
│   └── GestureUI.tsx       # UI overlay and gesture detection
├── utils/
│   ├── coordinates.ts      # Position generation utilities
│   └── performance.ts      # Performance optimization utilities
├── constants.ts            # Global constants and configuration
├── types.ts               # TypeScript type definitions
└── App.tsx                # Root application component
```

### Key Technologies

- **React 19** - UI framework
- **Three.js** - 3D graphics library
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for R3F
- **@react-three/postprocessing** - Post-processing effects
- **MediaPipe** - Hand gesture recognition
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety

## 🎨 Performance Optimizations

- **Instanced Meshes**: All particles use instanced rendering for optimal performance
- **Memoization**: Heavy computations are memoized to avoid recalculation
- **Object Pooling**: Reusable objects to minimize garbage collection
- **Conditional Rendering**: Smart updates only when needed
- **Mobile Optimization**: Reduced particle counts and adjusted camera for smaller screens

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Festive images from [Unsplash](https://unsplash.com)
- Hand tracking powered by [MediaPipe](https://mediapipe.dev)
- 3D rendering by [Three.js](https://threejs.org) and [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)

---

Made with ❤️ and ✨ for the holiday season!
