import { navigationGroups } from '@/config/navigation'
import type { NavItem } from '@/types/navigation'

export function getNavItemByHref(href: string): NavItem | undefined {
  for (const group of navigationGroups) {
    const item = group.items.find((entry) => entry.href === href)
    if (item) return item
  }
  return undefined
}