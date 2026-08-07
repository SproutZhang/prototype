/** 演示用：将部门内部 id 映射为参考图风格的数字部门 ID */
export function mockDepartmentPublicId(departmentId: string): string {
  let hash = 0
  for (const char of departmentId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return String(1000000000 + (hash % 900000000))
}
