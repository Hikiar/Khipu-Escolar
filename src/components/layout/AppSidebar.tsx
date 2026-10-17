import { Link, useLocation } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { portalInfo } from '@/config/navigation'
import type { NavItem } from '@/types/navigation'
import { useFilteredNav } from '@/hooks/useFilteredNav'
import { usePeriodoActivo } from '@/hooks/usePeriodoActivo'

function SidebarLogo() {
  return (
    <div className="flex items-center px-2">
      <img
        src="/logo-horizontal.svg"
        alt={portalInfo.name}
        className="h-10 w-auto rounded-md [[data-collapsible=icon]_&]:hidden"
      />
    </div>
  )
}

function SidebarNavLink({ item }: { item: NavItem }) {
  const { pathname } = useLocation()
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip={item.title}
        render={
          <Link to={item.href} aria-current={isActive ? 'page' : undefined} />
        }
      >
        <item.icon />
        <span>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AppSidebar() {
  const navigationGroups = useFilteredNav()
  const { periodo } = usePeriodoActivo()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarLogo />
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        {navigationGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarNavLink key={item.href} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2 px-1">
          <Badge variant="secondary" className="text-[10px] font-normal">
            {periodo ? `Año Lectivo ${periodo.codigo}` : 'Sin año lectivo activo'}
          </Badge>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}