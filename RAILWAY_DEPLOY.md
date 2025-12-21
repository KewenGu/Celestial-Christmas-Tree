# Railway 部署指南

## 📦 部署到 Railway

### 前置要求
- Railway 账号（免费注册：https://railway.app）
- Git 仓库（GitHub, GitLab 或 Bitbucket）

### 方法 1：通过 Railway Dashboard（推荐）

#### 步骤 1：准备代码
确保你的代码已推送到 Git 仓库：
```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

#### 步骤 2：连接到 Railway
1. 访问 [Railway Dashboard](https://railway.app/dashboard)
2. 点击 **"New Project"**
3. 选择 **"Deploy from GitHub repo"**
4. 选择你的 `Celestial-Christmas-Tree` 仓库
5. Railway 会自动检测项目配置

#### 步骤 3：配置环境变量（可选）
如果需要环境变量：
1. 在项目页面，点击 **"Variables"** 标签
2. 添加所需的环境变量
   ```
   PORT=3000  # 可选，Railway 会自动设置
   ```

#### 步骤 4：部署
1. Railway 会自动开始构建
2. 构建命令：`npm ci && npm run build`
3. 启动命令：`npm run start`
4. 等待部署完成（通常 2-5 分钟）

#### 步骤 5：获取 URL
1. 部署完成后，点击 **"Settings"** 标签
2. 在 **"Domains"** 部分点击 **"Generate Domain"**
3. Railway 会生成一个公共 URL，例如：`https://celestial-christmas-tree-production.up.railway.app`

---

### 方法 2：通过 Railway CLI

#### 安装 Railway CLI
```bash
# macOS
brew install railway

# npm
npm i -g @railway/cli

# 或直接下载
curl -fsSL https://railway.app/install.sh | sh
```

#### 登录 Railway
```bash
railway login
```

#### 初始化项目
```bash
# 在项目目录中
cd Celestial-Christmas-Tree
railway init
```

#### 链接到现有项目（如果已创建）
```bash
railway link
```

#### 部署
```bash
# 一键部署
railway up

# 或者使用 Git 触发部署
git push railway main
```

#### 打开应用
```bash
railway open
```

---

## 🔧 配置说明

### 文件结构
部署所需的配置文件：

```
Celestial-Christmas-Tree/
├── railway.json       # Railway 配置
├── nixpacks.toml      # Nixpacks 构建配置
├── Procfile           # 进程配置
├── server.js          # 生产服务器
└── package.json       # 包含 start 脚本
```

### 构建过程
1. **安装依赖**: `npm ci`
2. **构建项目**: `npm run build` → 生成 `dist/` 目录
3. **启动服务器**: `npm run start` → 运行 `server.js`

### 端口配置
服务器会自动使用 Railway 提供的 `PORT` 环境变量，默认为 3000。

---

## 🚀 部署后优化

### 1. 自定义域名
1. 在 Railway 项目设置中点击 **"Domains"**
2. 点击 **"Custom Domain"**
3. 添加你的域名（例如：`christmastree.yourdomain.com`）
4. 在你的 DNS 提供商处添加 CNAME 记录

### 2. 环境变量
如需添加环境变量：
```bash
# 使用 CLI
railway variables set KEY=VALUE

# 或在 Dashboard 中添加
```

### 3. 监控日志
```bash
# 实时查看日志
railway logs

# 或在 Dashboard 的 "Deployments" 标签中查看
```

### 4. 回滚部署
如果新部署有问题：
1. 在 Dashboard 的 **"Deployments"** 标签
2. 找到之前的成功部署
3. 点击 **"Redeploy"**

---

## 📊 性能优化建议

### 1. 启用 HTTPS
Railway 自动提供 HTTPS，无需额外配置！

### 2. CDN 集成
对于更好的全球访问速度，考虑：
- Cloudflare（免费）
- Railway 的内置 CDN（自动）

### 3. 压缩资源
在 `server.js` 中添加压缩：

```javascript
import compression from 'compression';
app.use(compression());
```

然后安装依赖：
```bash
npm install compression
```

### 4. 缓存策略
更新 `server.js`：

```javascript
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1y',
  immutable: true
}));
```

---

## 🐛 故障排除

### 问题：构建失败
**原因**: 依赖安装问题或构建错误

**解决方案**:
1. 检查 Railway 日志：`railway logs`
2. 本地测试构建：`npm run build`
3. 确保所有依赖在 `package.json` 中

### 问题：应用崩溃
**原因**: 端口配置或启动脚本错误

**解决方案**:
1. 确保 `server.js` 使用 `process.env.PORT`
2. 检查启动命令：`npm run start`
3. 查看错误日志

### 问题：静态文件 404
**原因**: 构建产物路径不正确

**解决方案**:
1. 确认 `dist/` 目录存在
2. 检查 `server.js` 中的路径
3. 本地测试：`npm run build && npm run start`

### 问题：摄像头不工作
**原因**: HTTPS 是必需的

**解决方案**:
- Railway 自动提供 HTTPS，使用生成的域名即可
- 不要使用 HTTP，浏览器会阻止摄像头访问

---

## 💡 最佳实践

### 1. 环境区分
```javascript
// server.js
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  // 生产环境特定配置
}
```

### 2. 健康检查
添加健康检查端点：
```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});
```

### 3. 错误处理
```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
```

### 4. 版本管理
在每次部署前打标签：
```bash
git tag -a v1.0.0 -m "Initial Railway deployment"
git push origin v1.0.0
```

---

## 📝 部署检查清单

部署前确认：
- [ ] 代码已推送到 Git 仓库
- [ ] 本地构建成功：`npm run build`
- [ ] 本地服务器测试：`npm run start`
- [ ] 所有依赖在 `package.json` 中
- [ ] `server.js` 使用 `process.env.PORT`
- [ ] `.gitignore` 排除 `node_modules` 和 `dist`

部署后检查：
- [ ] 应用成功启动（查看日志）
- [ ] 网站可以访问
- [ ] 3D 场景正常渲染
- [ ] 手势识别工作（HTTPS 下）
- [ ] 移动端响应式正常
- [ ] 所有功能正常运行

---

## 🎉 完成！

部署成功后，你的圣诞树应用将在：
- **Railway URL**: `https://your-app.up.railway.app`
- **自定义域名**: `https://your-domain.com` (如果配置了)

现在你可以分享你的互动圣诞树给全世界了！🎄✨

---

## 📞 获取帮助

- **Railway 文档**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **项目 Issues**: 在你的 GitHub 仓库创建 issue

## 🔄 持续部署

Railway 会自动监听你的 Git 仓库：
- 每次 `git push` 到 `main` 分支
- Railway 自动触发新的部署
- 零停机时间滚动更新

享受你的自动化部署流程！🚀

