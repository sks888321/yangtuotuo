# 性能优化修复说明

## 问题描述
用户反馈：连续切换3次菜单后系统会卡死。

## 根本原因
1. 每次切换菜单页面时，所有组件都会重新挂载（onMounted）
2. 每次挂载都会触发数据加载（API调用）
3. 没有加载状态保护，导致并发请求累积
4. WeeklyCalendar组件在每次挂载时都重新加载课程和排课数据
5. 没有清理函数（onUnmounted），导致内存泄漏

## 解决方案

### 1. 创建全局数据缓存系统
新建文件：`src/utils/cache.ts`

特性：
- 缓存用户、课程、排课、缴费数据
- 5分钟过期时间（可配置）
- 提供加载状态检查，防止重复加载
- 提供缓存失效机制

### 2. 更新所有视图组件使用缓存

#### Dashboard.vue
- 导入缓存系统
- onMounted时先检查缓存，如果有效则直接使用
- 数据加载后更新缓存

#### Users.vue
- 使用缓存加速用户列表加载
- 增删改操作后更新缓存

#### Courses.vue
- 使用缓存加速课程列表加载
- 增删改操作后更新缓存

#### Schedule.vue
- 使用缓存加速排课列表加载
- loadSchedules方法更新缓存

#### Payments.vue
- 使用缓存加速缴费列表加载
- 增删改操作后更新缓存

#### WeeklyCalendar.vue
- loadCourses方法先检查缓存
- 避免每次挂载都重新加载课程数据

### 3. 加载保护机制（已在上一轮实现）
- 所有视图添加loading ref标志
- 在数据加载时检查loading状态
- 使用`if (loading.value) return`防止并发请求

### 4. 清理机制（已在上一轮实现）
- WeeklyCalendar添加onUnmounted钩子
- 清理schedules数组释放内存
- 重置modal状态

## 测试步骤

1. 启动开发服务器：
```bash
pnpm dev
```

2. 测试场景：
   - 快速连续切换菜单5-10次（Dashboard → 用户管理 → 课程管理 → 排课管理 → 缴费管理）
   - 观察浏览器Network标签，确认数据只在首次加载
   - 观察内存使用情况（F12 → Performance → Memory）
   - 系统应该保持流畅，不会卡顿

3. 缓存验证：
   - 在某个页面添加数据
   - 切换到其他页面再切换回来
   - 数据应该立即显示（来自缓存）
   - 等待5分钟后再次切换
   - 数据会重新加载（缓存过期）

## 性能改进指标

优化前：
- 每次切换菜单：4-8次API调用
- 3次切换后：累计12-24次API调用 + 内存泄漏
- 结果：系统卡死

优化后：
- 首次加载：4次API调用（users, courses, schedules, payments）
- 后续切换：0次API调用（使用缓存）
- 5分钟后：重新加载数据（缓存过期）
- 结果：流畅切换

## 附加优化建议

如果数据量非常大，可以考虑：
1. 实现虚拟滚动（Virtual Scrolling）
2. 分页加载（Pagination）
3. 懒加载（Lazy Loading）
4. 数据压缩（Data Compression）
5. Service Worker缓存

## 文件清单

修改的文件：
- `src/utils/cache.ts` (新建)
- `src/views/Dashboard.vue`
- `src/views/Users.vue`
- `src/views/Courses.vue`
- `src/views/Schedule.vue`
- `src/views/Payments.vue`
- `src/components/WeeklyCalendar.vue`

## 构建验证

```bash
pnpm run build
# ✓ 构建成功，无TypeScript错误
```
