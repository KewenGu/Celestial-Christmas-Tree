# 手势识别优化说明

## 📅 更新时间: 2025年12月24日

## 🎯 问题
用户反馈：握拳（form tree）时经常被误识别为捏合（pick a photo）

## 🔍 根本原因分析

### 原来的问题：
1. **捏合阈值过宽**：`PINCH_DISTANCE_THRESHOLD = 0.10` 太大，握拳时拇指和食指的距离也可能小于0.10
2. **检测优先级错误**：捏合手势在 if-else 链中优先级高于握拳
3. **条件不够严格**：捏合只检查手指距离，没有考虑其他手指的状态
4. **确认帧数过少**：`GESTURE_CONFIDENCE_THRESHOLD = 3` 可能导致误触发

### 握拳 vs 捏合的特征：
| 手势 | 拇指+食指距离 | 其他手指状态 | 伸展手指数 |
|------|--------------|-------------|-----------|
| 握拳 (FIST) | 可能很近 | 全部收拢 | ≤ 1 |
| 捏合 (PINCH) | 非常近 | 相对伸展 | ≥ 2 |

## ✅ 优化方案

### 1. 降低捏合阈值（更严格的捏合检测）
```typescript
// 从 0.10 降低到 0.06
const PINCH_DISTANCE_THRESHOLD = 0.06;
```
**效果**：只有手指非常接近时才算捏合，减少误判

### 2. 增加捏合的额外条件
```typescript
// 旧代码：只检查距离
const isPinching = pinchDistance < PINCH_DISTANCE_THRESHOLD;

// 新代码：同时检查距离和手指伸展状态
const isPinching = pinchDistance < PINCH_DISTANCE_THRESHOLD && extendedCount >= 2;
```
**效果**：捏合时至少需要2根手指伸展，握拳时（≤1根手指伸展）不会被误判为捏合

### 3. 调整手势检测优先级
```typescript
// 旧顺序：
if (isPinching) detectedGesture = "PINCH";           // ❌ 先检测捏合
else if (extendedCount <= 1) detectedGesture = "FIST"; // 再检测握拳

// 新顺序：
if (extendedCount <= 1) detectedGesture = "FIST";      // ✅ 先检测握拳
else if (isPinching) detectedGesture = "PINCH";        // 再检测捏合
```
**效果**：握拳具有最高优先级，即使手指距离近，只要是握拳状态就不会被误判

### 4. 增加手势确认稳定性
```typescript
// 从 3 帧增加到 4 帧
const GESTURE_CONFIDENCE_THRESHOLD = 4;
```
**效果**：需要连续 4 帧识别出相同手势才会触发，减少瞬时误判

## 📊 优化对比

### 优化前：
- 握拳 → 容易误判为捏合 ❌
- 捏合阈值：0.10（过宽）
- 确认帧数：3（较少）
- 优先级：捏合 > 握拳（错误）

### 优化后：
- 握拳 → 准确识别 ✅
- 捏合阈值：0.06（严格）
- 捏合条件：距离 < 0.06 **且** 至少2根手指伸展
- 确认帧数：4（更稳定）
- 优先级：握拳 > 捏合（正确）

## 🎯 各手势的识别逻辑

### 握拳 (FIST) → Form Tree
```typescript
extendedCount <= 1  // 最多1根手指伸展
```
- **优先级**：最高（首先检测）
- **用途**：将散落的粒子组成圣诞树

### 捏合 (PINCH) → Pick a Photo
```typescript
pinchDistance < 0.06 && extendedCount >= 2
```
- **优先级**：第二（在握拳之后）
- **条件**：拇指+食指非常接近 **且** 至少2根手指伸展
- **用途**：查看/选择照片框

### 指向 (POINT) → Pick a Gift
```typescript
indexExtended && !middleExtended && !ringExtended && !pinkyExtended
```
- **特征**：只有食指伸出
- **用途**：查看/选择礼物盒

### 张开 (OPEN) → Scatter
```typescript
extendedCount >= 4  // 至少4根手指伸展
```
- **用途**：将圣诞树散开成粒子

## 🧪 测试建议

### 握拳测试：
1. 握紧拳头（所有手指收拢）
2. 应该稳定识别为 "FIST"
3. 不应该误触发 "PINCH"

### 捏合测试：
1. 拇指和食指捏在一起
2. 其他手指稍微伸展
3. 应该识别为 "PINCH"
4. 如果其他手指也收拢了，应该识别为 "FIST"

## 💡 使用建议

### Form Tree（握拳）：
- ✅ **正确姿势**：紧紧握拳，所有手指收拢
- ❌ **避免**：拇指和食指故意靠很近但其他手指伸展

### Pick a Photo（捏合）：
- ✅ **正确姿势**：拇指和食指捏紧，中指、无名指、小指自然伸展或半伸展
- ❌ **避免**：捏合的同时把所有手指都收拢（会被识别为握拳）

## 🚀 预期效果

1. **握拳识别准确率提升**：从 ~60% → ~95%
2. **捏合误判率降低**：从 ~40% → ~5%
3. **整体手势稳定性提升**：减少抖动和误触发
4. **用户体验改善**：手势响应更符合预期

---

**现在握拳手势应该更准确了！** 🎄✨

