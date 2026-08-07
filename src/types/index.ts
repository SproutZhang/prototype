/** 通用分页列表结构，可按业务扩展字段 */
export type Paginated<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}
