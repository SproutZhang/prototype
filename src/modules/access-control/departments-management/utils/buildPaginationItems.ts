/** 生成分页页码序列（含省略号），用于部门列表分页 UI */
export function buildPaginationItems(
  totalPages: number,
  currentPage: number,
): Array<number | 'ellipsis'> {
  if (totalPages <= 0) return []
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const items: Array<number | 'ellipsis'> = []

  const addPage = (page: number) => {
    if (page >= 1 && page <= totalPages && !items.includes(page)) {
      items.push(page)
    }
  }

  addPage(1)

  if (currentPage <= 4) {
    for (let page = 2; page <= 5; page++) addPage(page)
    items.push('ellipsis')
  } else if (currentPage >= totalPages - 3) {
    items.push('ellipsis')
    for (let page = totalPages - 4; page < totalPages; page++) addPage(page)
  } else {
    items.push('ellipsis')
    for (let page = currentPage - 1; page <= currentPage + 1; page++) addPage(page)
    items.push('ellipsis')
  }

  addPage(totalPages)
  return items
}
