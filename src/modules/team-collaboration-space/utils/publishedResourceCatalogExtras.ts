import type { TcsResourceCatalogItem } from '../types'

let publishedCatalogExtras: TcsResourceCatalogItem[] = []

export function getPublishedResourceCatalogExtras(): TcsResourceCatalogItem[] {
  return [...publishedCatalogExtras]
}

export function upsertPublishedResourceCatalogExtra(item: TcsResourceCatalogItem): void {
  const existingIndex = publishedCatalogExtras.findIndex((entry) => entry.id === item.id)
  if (existingIndex === -1) {
    publishedCatalogExtras = [...publishedCatalogExtras, item]
    return
  }
  publishedCatalogExtras = publishedCatalogExtras.map((entry, index) =>
    index === existingIndex ? { ...entry, ...item } : entry,
  )
}

export function removePublishedResourceCatalogExtra(resourceId: string): void {
  publishedCatalogExtras = publishedCatalogExtras.filter((item) => item.id !== resourceId)
}

export function hasPublishedResourceCatalogExtra(resourceId: string): boolean {
  return publishedCatalogExtras.some((item) => item.id === resourceId)
}
