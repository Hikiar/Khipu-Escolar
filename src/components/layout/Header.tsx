import { useLocation, Link } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { portalInfo } from '@/config/navigation'
import { useFilteredNav } from '@/hooks/useFilteredNav'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { NavItem } from '@/types/navigation'
import { LogOut, Sun, Moon, Search, UserRound } from 'lucide-react'
import { useTheme } from '@/providers/ThemeProvider'
import { CommandPalette } from '@/components/common'

function obtenerIniciales(nombres: string, apellidos: string): string {
  const inicial = (texto: string) => texto.trim().charAt(0).toUpperCase()
  return `${inicial(nombres)}${inicial(apellidos)}`
}

function useCurrentNavItem(): { group?: string; item?: NavItem } {
  const { pathname } = useLocation()
  const navigationGroups = useFilteredNav()

  for (const group of navigationGroups) {
    const item = group.items.find(
      (entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`),
    )
    if (item) {
      return { group: group.label, item }
    }
  }
  return {}
}

function HeaderBreadcrumb() {
  const { group, item } = useCurrentNavItem()

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {group && (
          <BreadcrumbItem>
            <span className="text-muted-foreground">{group}</span>
          </BreadcrumbItem>
        )}
        {item && (
          <BreadcrumbItem>
            <BreadcrumbPage>{item.title}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

function UserMenu() {
  const { usuario, logout } = useAuth()
  const persona = usuario?.persona
  const nombreCompleto = persona
    ? `${persona.nombres} ${persona.apellidos}`
    : 'Usuario'
  const roles = usuario?.roles.map((rol) => rol.nombre).join(', ') ?? 'Sin rol'
  const iniciales = persona
    ? obtenerIniciales(persona.nombres, persona.apellidos)
    : portalInfo.initials

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Abrir menú de usuario (mi perfil y cerrar sesión)"
            aria-haspopup="menu"
            className="flex translate-y-0 items-center gap-2 rounded-full outline-none transition-colors cursor-pointer hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-[popup-open]:bg-accent"
          />
        }
      >
        <span className="relative inline-flex">
          <Avatar className="size-8">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-xs font-semibold text-primary-foreground">
              {iniciales}
            </AvatarFallback>
          </Avatar>
          <span
            className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background"
            aria-hidden
          />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-sm font-semibold text-primary-foreground">
              {iniciales}
            </AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 flex-1 gap-0.5">
            <span className="truncate font-medium">{nombreCompleto}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              {persona
                ? `Código ${persona.codigoInstitucional}`
                : 'Sin datos de persona'}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5">
          <div className="flex flex-wrap gap-1">
            {usuario?.roles.map((rol) => (
              <Badge key={rol.id} variant="secondary">
                {rol.nombre}
              </Badge>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{roles}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link to="/perfil" />}>
          <UserRound className="size-4" aria-hidden />
          Mi perfil
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={logout}>
          <LogOut className="size-4" aria-hidden />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Header() {
  const { theme, resolved, setTheme } = useTheme()
  const [paletaAbierta, setPaletaAbierta] = useState(false)

  const togglePaleta = useCallback((abierta: boolean) => {
    setPaletaAbierta(abierta)
  }, [])

  useEffect(() => {
    function manejarAtajo(evento: KeyboardEvent) {
      if ((evento.metaKey || evento.ctrlKey) && evento.key.toLowerCase() === 'k') {
        evento.preventDefault()
        setPaletaAbierta((abierta) => !abierta)
      }
    }
    window.addEventListener('keydown', manejarAtajo)
    return () => window.removeEventListener('keydown', manejarAtajo)
  }, [])

  const nextTheme = () => {
    const order: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system']
    const idx = order.indexOf(theme)
    setTheme(order[(idx + 1) % 3])
  }

  const themeLabel = theme === 'system' ? 'Sistema' : theme === 'dark' ? 'Oscuro' : 'Claro'
  const themeIcon = resolved === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-sidebar/60 px-4 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-4" />
      <div className="flex-1">
        <HeaderBreadcrumb />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPaletaAbierta(true)}
          className="hidden items-center gap-2 rounded-md border bg-sidebar px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex"
          aria-label="Buscar en la aplicación (Ctrl+K)"
          title="Buscar (Ctrl+K)"
        >
          <Search className="size-3.5" aria-hidden />
          Buscar
          <kbd className="pointer-events-none inline-flex h-5 items-center gap-0.5 rounded border bg-background px-1.5 font-mono text-[10px] text-muted-foreground">
            Ctrl K
          </kbd>
        </button>
        <button
          type="button"
          onClick={nextTheme}
          title={`Tema: ${themeLabel} (click para cambiar)`}
          className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Tema actual: ${themeLabel}`}
        >
          {themeIcon}
        </button>
        <UserMenu />
      </div>
      <CommandPalette open={paletaAbierta} onOpenChange={togglePaleta} />
    </header>
  )
}