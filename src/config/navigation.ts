import {
  Banknote,
  BarChart3,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Layers,
  Receipt,
  School,
  ScrollText,
  Users,
  UsersRound,
  ShieldCheck,
  UserCog,
} from 'lucide-react'
import type { NavGroup } from '@/types/navigation'
import { PERMISO_TOTAL } from '@/types/rbac'

export const navigationGroups: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        description: 'Resumen general del centro educativo',
      },
    ],
  },
  {
    label: 'Académico',
    items: [
      {
        title: 'Mis salones',
        href: '/mis-salones',
        icon: School,
        description: 'Tus salones y sus alumnos',
        permission: 'salones.mis',
        roles: ['profesor'],
      },
      {
        title: 'Planificación Académica',
        href: '/planificacion',
        icon: Layers,
        description: 'Grados, secciones, clases, asignaturas y plan de estudios',
        permission: 'grados.ver',
      },
      {
        title: 'Alumnos',
        href: '/alumnos',
        icon: Users,
        description: 'Gestión del alumnado',
        permission: 'alumnos.verTodos',
      },
      {
        title: 'Profesores',
        href: '/profesores',
        icon: UsersRound,
        description: 'Gestión del cuerpo docente',
        permission: 'profesores.ver',
      },
    ],
  },
  {
    label: 'Gestión',
    items: [
      {
        title: 'Matrículas',
        href: '/matriculas',
        icon: ClipboardList,
        description: 'Proceso de matrícula escolar',
        permission: 'matriculas.ver',
      },
      {
        title: 'Asistencia',
        href: '/asistencia',
        icon: CalendarCheck,
        description: 'Control de asistencia diaria',
        permission: 'asistencia.ver',
      },
      {
        title: 'Calificaciones',
        href: '/calificaciones',
        icon: GraduationCap,
        description: 'Notas y evaluaciones',
        permission: 'notas.ver',
      },
    ],
  },
  {
    label: 'Finanzas',
    items: [
      {
        title: 'Pagos',
        href: '/pagos',
        icon: Banknote,
        description: 'Pagos y cuotas escolares',
        permission: 'pagos.ver',
      },
      {
        title: 'Conceptos de pago',
        href: '/conceptos-pago',
        icon: Receipt,
        description: 'Catálogo de conceptos del cronograma por año lectivo',
        permission: 'conceptosPago.ver',
      },
    ],
  },
  {
    label: 'Administración',
    items: [
      {
        title: 'Reportes',
        href: '/reportes',
        icon: BarChart3,
        description: 'Reportes y estadísticas',
        permission: 'reportes.ver',
      },
      {
        title: 'Usuarios',
        href: '/usuarios',
        icon: UserCog,
        description: 'Gestión de cuentas de usuario',
        permission: 'usuarios.gestionar',
      },
      {
        title: 'Roles y Permisos',
        href: '/roles',
        icon: ShieldCheck,
        description: 'Roles configurables y permisos',
        permission: 'roles.gestionar',
      },
      {
        title: 'Tipos de calificación',
        href: '/modelos',
        icon: GraduationCap,
        description: 'Tipos de calificación configurables',
        permission: 'modelos.ver',
      },
      {
        title: 'Años lectivos',
        href: '/periodos',
        icon: CalendarClock,
        description: 'Crear, activar y cerrar años lectivos',
        permission: 'periodos.ver',
      },
      {
        title: 'Auditoría',
        href: '/auditoria',
        icon: ScrollText,
        description: 'Bitácora de acciones registradas en el sistema',
        permission: PERMISO_TOTAL,
      },
    ],
  },
]

export const portalInfo = {
  name: 'Khipu Escolar',
  initials: 'KE',
  tagline: 'Gestión escolar para colegios particulares',
} as const
