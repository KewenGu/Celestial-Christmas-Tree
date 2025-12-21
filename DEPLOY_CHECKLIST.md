# 🚀 Railway 部署快速清单

## ✅ 部署前检查

### 1. 本地测试
```bash
# 测试构建
npm run build

# 测试生产服务器
npm run start
# 然后访问 http://localhost:3000
```

### 2. 提交代码
```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

## 📋 部署步骤

### 选项 A: Railway Dashboard（推荐新手）

1. ✅ 访问 https://railway.app
2. ✅ 登录/注册账号
3. ✅ 点击 "New Project"
4. ✅ 选择 "Deploy from GitHub repo"
5. ✅ 授权 Railway 访问 GitHub
6. ✅ 选择 `Celestial-Christmas-Tree` 仓库
7. ✅ Railway 自动开始部署
8. ✅ 等待部署完成（2-5分钟）
9. ✅ 在 Settings → Domains 点击 "Generate Domain"
10. ✅ 获得 URL: `https://your-app.up.railway.app` ✨

### 选项 B: Railway CLI（推荐开发者）

```bash
# 1. 安装 CLI
npm i -g @railway/cli

# 2. 登录
railway login

# 3. 初始化项目
railway init

# 4. 部署
railway up

# 5. 打开应用
railway open
```

## 🔍 验证部署

访问你的 Railway URL，检查：
- [ ] 页面加载成功
- [ ] 3D 场景渲染
- [ ] 粒子动画流畅
- [ ] 手势识别工作（需要 HTTPS）
- [ ] 移动端响应正常

## 📊 监控

```bash
# 查看日志
railway logs

# 或在 Dashboard 查看实时日志
```

## 🐛 常见问题

### 构建失败？
```bash
# 检查本地构建
npm run build

# 查看 Railway 日志
railway logs
```

### 应用崩溃？
- 检查 PORT 环境变量（Railway 自动设置）
- 查看错误日志
- 确认 dist 目录已生成

### 功能异常？
- 摄像头需要 HTTPS（Railway 自动提供）
- 清除浏览器缓存
- 检查浏览器控制台错误

## 🎉 完成！

恭喜！你的圣诞树现在在线上了 🎄✨

分享你的链接：
- Twitter/X
- Facebook  
- LinkedIn
- 朋友圈

---

**需要帮助？** 查看完整指南：[RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)

