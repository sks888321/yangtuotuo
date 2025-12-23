// API统一导出
// 将所有业务API集中导出，方便使用

export * as teacherAPI from './teachers'
export * as studentAPI from './students'
export * as classroomAPI from './classrooms'
export * as courseTypeAPI from './courseTypes'
export * as scheduleAPI from './schedules'
export * as paymentAPI from './payments'

// 初始化所有数据
export async function initAllData() {
  // 初始化所有数据文件，确保存在
  const teacherModule = await import('./teachers')
  const studentModule = await import('./students')
  const classroomModule = await import('./classrooms')
  const courseTypeModule = await import('./courseTypes')
  const scheduleModule = await import('./schedules')
  const paymentModule = await import('./payments')
  
  await Promise.all([
    teacherModule.getAll(),
    studentModule.getAll(),
    classroomModule.getAll(),
    courseTypeModule.getAll(),
    scheduleModule.getAll(),
    paymentModule.getAll()
  ])
}

