# 开发指南

## 项目结构

```
Celestial-Christmas-Tree/
├── components/           # React 组件
│   ├── Experience.tsx   # 3D 场景主组件
│   ├── Needles.tsx      # 松针粒子系统
│   ├── Decorations.tsx  # 装饰品（彩球、灯串、星星）
│   ├── InteractiveItems.tsx  # 互动物品（礼物盒、相框）
│   └── GestureUI.tsx    # UI 覆盖层和手势识别
├── utils/               # 工具函数
│   ├── coordinates.ts   # 位置生成工具
│   └── performance.ts   # 性能优化工具
├── constants.ts         # 全局常量配置
├── types.ts            # TypeScript 类型定义
├── App.tsx             # 根组件
├── index.tsx           # 应用入口
└── index.html          # HTML 模板
```

## 技术栈

### 核心技术
- **React 19**: UI 框架
- **TypeScript 5.8**: 类型安全
- **Vite 6**: 构建工具

### 3D 渲染
- **Three.js 0.182**: 3D 图形库
- **@react-three/fiber**: Three.js 的 React 渲染器
- **@react-three/drei**: R3F 辅助工具库
- **@react-three/postprocessing**: 后处理效果

### 手势识别
- **MediaPipe**: Google 的机器学习手势识别
- **react-webcam**: 摄像头访问

## 开发流程

### 1. 环境设置

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查
npm run type-check

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 2. 开发规范

#### 代码风格
- 使用 TypeScript 严格模式
- 遵循 React Hooks 规则
- 使用函数式组件
- Props 使用接口定义

#### 命名约定
- 组件: PascalCase (例: `Experience.tsx`)
- 常量: UPPER_SNAKE_CASE (例: `TREE_HEIGHT`)
- 函数/变量: camelCase (例: `getConePosition`)
- 类型/接口: PascalCase (例: `AppState`)

#### 文件组织
```typescript
// 1. 导入
import React from 'react';
import * as THREE from 'three';

// 2. 类型定义
interface MyComponentProps {
  value: number;
}

// 3. 常量
const MY_CONSTANT = 100;

// 4. 组件
export const MyComponent: React.FC<MyComponentProps> = ({ value }) => {
  // 组件逻辑
};
```

### 3. 性能最佳实践

#### 使用 Instanced Meshes
所有粒子系统都应使用 InstancedMesh 以获得最佳性能：

```typescript
const meshRef = useRef<THREE.InstancedMesh>(null);

// 在 useFrame 中更新实例
for (let i = 0; i < count; i++) {
  dummy.position.set(x, y, z);
  dummy.updateMatrix();
  meshRef.current.setMatrixAt(i, dummy.matrix);
}
meshRef.current.instanceMatrix.needsUpdate = true;
```

#### Memoization
使用 `useMemo` 缓存昂贵的计算：

```typescript
const positions = useMemo(() => {
  // 昂贵的位置计算
  return generatePositions();
}, [dependencies]);
```

#### 对象复用
在模块级别创建可复用的对象：

```typescript
// 在组件外部
const dummy = new THREE.Object3D();
const tempPos = new THREE.Vector3();

// 在循环中复用
for (let i = 0; i < count; i++) {
  tempPos.set(x, y, z); // 复用而不是创建新对象
}
```

### 4. 添加新功能

#### 添加新的粒子系统

1. 在 `components/` 中创建新组件
2. 使用 InstancedMesh
3. 实现双状态位置（tree/scattered）
4. 在 `Experience.tsx` 中导入

示例：
```typescript
export const NewParticles: React.FC<{ appState: AppState }> = ({ appState }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const positions = useMemo(() => {
    // 计算位置
  }, [appState]);
  
  useFrame((state, delta) => {
    // 更新逻辑
  });
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry />
      <meshStandardMaterial />
    </instancedMesh>
  );
};
```

#### 添加新的手势

1. 在 `GestureUI.tsx` 的 `processResults` 中添加检测逻辑
2. 在 `applyGestureEffect` 中添加响应
3. 在 UI 中添加说明

```typescript
// 检测新手势
const isNewGesture = /* 你的检测逻辑 */;
if (isNewGesture) detectedGesture = "NEW_GESTURE";

// 应用效果
case "NEW_GESTURE": 
  // 执行动作
  break;
```

### 5. 调试技巧

#### 查看粒子数量
在浏览器控制台中：
```javascript
// 查看场景信息
console.log(scene);

// 查看内存使用
console.log(renderer.info.memory);
```

#### 性能监控
```typescript
// 在 useFrame 中添加
const start = performance.now();
// ... 你的代码
const elapsed = performance.now() - start;
if (elapsed > 16) console.warn('Frame took', elapsed, 'ms');
```

#### Three.js Inspector
使用 React DevTools 和 R3F DevTools：
- React DevTools: 查看组件状态
- Leva Controls: 添加实时调试参数

## 常见问题

### Q: 性能下降怎么办？
A: 
1. 检查粒子数量是否过多
2. 确保使用 InstancedMesh
3. 减少 useFrame 中的计算
4. 使用 `useMemo` 缓存数据

### Q: 手势识别不准确？
A: 
1. 确保光线充足
2. 手要完全在镜头内
3. 调整 `GESTURE_CONFIDENCE_THRESHOLD`
4. 检查阈值参数（在 `constants.ts` 中）

### Q: 纹理加载失败？
A: 
1. 检查 CORS 设置
2. 使用 cache buster
3. 查看控制台错误信息
4. 确保 URL 正确

### Q: TypeScript 报错？
A: 
1. 运行 `npm run type-check`
2. 检查类型定义
3. 确保导入正确
4. 查看 `types.ts` 中的定义

## 部署

### 构建优化
```bash
# 构建
npm run build

# 分析包大小
npm run build -- --mode production
```

### 环境变量
在 `.env.local` 中设置：
```
VITE_APP_NAME=Celestial Christmas Tree
```

### 生产检查清单
- [ ] 运行类型检查无错误
- [ ] 测试所有手势
- [ ] 测试移动端响应式
- [ ] 检查控制台无警告
- [ ] 测试文件上传功能
- [ ] 验证构建包大小合理

## 贡献

欢迎贡献！请遵循以下流程：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### Pull Request 指南
- 保持 PR 专注于单一功能
- 添加适当的描述
- 更新相关文档
- 确保通过类型检查
- 测试所有更改

## 资源

### 学习资源
- [React Three Fiber 文档](https://docs.pmnd.rs/react-three-fiber)
- [Three.js 文档](https://threejs.org/docs/)
- [MediaPipe 手部追踪](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker)

### 相关项目
- [React Three Fiber Examples](https://docs.pmnd.rs/react-three-fiber/getting-started/examples)
- [Three.js Examples](https://threejs.org/examples/)

---

Happy coding! 🎄✨


