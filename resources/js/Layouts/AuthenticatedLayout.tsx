import {
  Squares2X2Icon,
  UsersIcon,
  KeyIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  Bars3Icon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  PowerIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import {
  PropsWithChildren,
  ReactNode,
  useState,
  useEffect,
  useRef,
} from 'react';

export default function Authenticated({
  header,
  children,
}: PropsWithChildren<{ header?: ReactNode }>) {
  const user = usePage().props.auth.user;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminSidebarCollapsed') === 'true';
    }
    return false;
  });
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('adminSidebarCollapsed', String(collapsed));
      }
    } catch {}
  }, [collapsed]);
  // Dropdown state for sidebar (for future expansion)
  const [openDropdowns, setOpenDropdowns] = useState<{
    [key: string]: boolean;
  }>({});

  // Sidebar menu config (icon, label, href)
  const mainMenus = [
    {
      href: route('dashboard'),
      label: 'Dashboard',
      icon: Squares2X2Icon,
      show: true,
    },
    {
      href: route('superadmin.users.index'),
      label: 'Kelola User',
      icon: UsersIcon,
      show: user.role === 'superadmin',
    },
    {
      href: route('superadmin.password-resets.index'),
      label: 'Permintaan Reset',
      icon: KeyIcon,
      show: user.role === 'superadmin',
    },
    {
      href: route('teacher.my-group.index'),
      label: 'Grup Saya',
      icon: AcademicCapIcon,
      show: user.role === 'guru',
    },
    {
      href: route('admin.school-classes.index'),
      label: 'Kelola Kelas',
      icon: AcademicCapIcon,
      show: user.role === 'koordinator',
    },
    {
      href: route('admin.students.index'),
      label: 'Kelola Siswa',
      icon: UsersIcon,
      show: user.role === 'koordinator',
    },
    {
      href: route('admin.btq-groups.index'),
      label: 'Kelompok BTQ',
      icon: UserGroupIcon,
      show: user.role === 'koordinator',
    },
    {
      href: route('admin.promotion-approvals.index'),
      label: 'Persetujuan',
      icon: ClipboardDocumentCheckIcon,
      show: user.role === 'koordinator',
    },
    {
      href: route('admin.holidays.index'),
      label: 'Hari Libur',
      icon: CalendarDaysIcon,
      show: user.role === 'koordinator',
    },
  ];

  // Sidebar Desktop
  function DesktopSidebar() {
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          userMenuRef.current &&
          !userMenuRef.current.contains(event.target as Node)
        ) {
          setUserMenuOpen(false);
        }
      }
      if (userMenuOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      } else {
        document.removeEventListener('mousedown', handleClickOutside);
      }
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [userMenuOpen]);

    return (
      <aside
        className={`hidden md:fixed md:flex flex-col ${collapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-[#f8fafc] via-white to-[#f3f4f6] text-gray-900 min-h-screen shadow-2xl left-0 top-0 z-30 transition-all duration-300 ease-in-out border-r border-gray-200`}
      >
        <div className="flex items-center justify-between px-4 h-20 border-b border-gray-200">
          {!collapsed ? (
            <>
              <Link href="/">
                <ApplicationLogo className="h-10 w-auto" />
              </Link>
              <button
                onClick={() => setCollapsed((c) => !c)}
                className="ml-auto p-2 rounded hover:bg-gray-200 focus:outline-none"
                title={collapsed ? 'Expand' : 'Collapse'}
              >
                <ChevronDoubleLeftIcon className="w-6 h-6 text-gray-700" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="mx-auto p-2 rounded hover:bg-gray-200 focus:outline-none w-full"
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              <ChevronDoubleRightIcon className="w-6 h-6 text-gray-700 mx-auto" />
            </button>
          )}
        </div>
        <nav
          className={`flex-1 flex flex-col gap-8 ${collapsed ? 'px-0' : 'px-4'} py-6 overflow-y-auto`}
        >
          <div>
            {!collapsed && (
              <div className="text-xs font-semibold text-gray-400 mb-2 pl-2 tracking-widest uppercase">
                MENU UTAMA
              </div>
            )}
            <ul className="flex flex-col gap-2 items-stretch">
              {mainMenus
                .filter((m) => m.show)
                .map((m, i) => (
                  <SidebarMenuItem
                    key={i}
                    item={m}
                    index={i}
                    currentUrl={window.location.pathname}
                    collapsed={collapsed}
                    isOpen={openDropdowns[i]}
                    onToggle={() =>
                      setOpenDropdowns((prev) => ({ ...prev, [i]: !prev[i] }))
                    }
                  />
                ))}
            </ul>
          </div>
        </nav>
        {/* User Info with Dropdown */}
        <div
          className={`mt-auto ${collapsed ? 'px-0' : 'px-4'} pb-6 relative`}
          ref={userMenuRef}
        >
          <div
            className={`flex items-center gap-3 cursor-pointer hover:bg-gray-100 rounded-lg p-2 transition-colors duration-200 ${collapsed ? 'justify-center' : ''}`}
            onClick={() => setUserMenuOpen((v) => !v)}
            tabIndex={0}
            aria-haspopup="true"
          >
            <div
              className={`w-10 h-10 rounded-full border-2 border-gray-300 bg-[#826F4F] flex items-center justify-center text-white font-bold text-lg uppercase shadow-md ${collapsed ? 'mx-auto' : ''}`}
            >
              {user.name?.[0]}
            </div>
            {!collapsed && (
              <>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-semibold text-gray-900 text-sm truncate">
                    {user.name}
                  </span>
                  <span className="text-xs text-gray-500 truncate">
                    {user.email}
                  </span>
                </div>
                {/* Chevron icon for dropdown */}
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </>
            )}
          </div>
          {/* Dropdown menu */}
          {userMenuOpen && (
            <div
              className={`absolute z-50 transform transition-all duration-200 ease-out ${collapsed ? 'left-full top-0 -mt-12 ml-2 w-48' : 'left-full top-0 -mt-12 ml-2 w-48'} bg-white rounded-lg shadow-xl border border-gray-200 py-1`}
            >
              <Link
                href={route('profile.edit')}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 text-sm transition-colors duration-150"
                onClick={() => setUserMenuOpen(false)}
              >
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Profile
              </Link>
              <hr className="my-1 border-gray-100" />
              <Link
                href={route('logout')}
                method="post"
                as="button"
                className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 text-sm transition-colors duration-150"
                onClick={() => setUserMenuOpen(false)}
              >
                <svg
                  className="w-4 h-4 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </Link>
            </div>
          )}
        </div>
      </aside>
    );
  }

  // Sidebar Menu Item
  function SidebarMenuItem({ item, index, currentUrl, collapsed }: any) {
    let targetPath = '';
    try {
      targetPath = new URL(item.href, window.location.origin).pathname;
    } catch {
      targetPath = item.href;
    }
    const isActive = currentUrl.startsWith(targetPath);
    return (
      <li>
        <Link
          href={item.href}
          className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}
            ${collapsed ? 'px-0' : 'px-3'} py-2 font-medium transition text-sm
            ${
              isActive
                ? `${collapsed ? 'bg-[#005929] text-white font-bold rounded-md w-12 h-12 mx-auto shadow' : 'bg-[#005929] text-white font-bold rounded-lg shadow'}`
                : `${collapsed ? 'text-gray-700 hover:bg-gray-200 hover:text-gray-900 rounded-md w-12 h-12 mx-auto' : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900 rounded-lg'}`
            }`}
          style={
            collapsed
              ? {
                  minWidth: '48px',
                  minHeight: '48px',
                  justifyContent: 'center',
                }
              : {}
          }
          title={collapsed ? item.label : undefined}
        >
          <item.icon className="w-6 h-6" />
          {!collapsed && <span>{item.label}</span>}
        </Link>
      </li>
    );
  }

  // Sidebar Mobile
  function MobileSidebar() {
    return (
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-[#f8fafc] via-white to-[#f3f4f6] shadow-2xl z-40 transform md:hidden transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col items-center py-6 border-b border-gray-100 relative">
          <Link href="/">
            <ApplicationLogo className="w-16 h-16 rounded-full shadow-lg border-4 border-gray-200 bg-white" />
          </Link>
          <h2 className="mt-2 text-lg font-extrabold text-gray-800 tracking-wide drop-shadow">
            ADMIN
          </h2>
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-900"
            title="Tutup menu"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {mainMenus
            .filter((m) => m.show)
            .map((m, i) => (
              <Link
                key={i}
                href={m.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  (() => {
                    try {
                      const p = new URL(m.href, window.location.origin)
                        .pathname;
                      return window.location.pathname.startsWith(p);
                    } catch {
                      return window.location.pathname === m.href;
                    }
                  })()
                    ? 'bg-[#005929] text-white shadow-lg font-bold'
                    : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <m.icon className="w-5 h-5" />
                <span>{m.label}</span>
              </Link>
            ))}
        </nav>
        <div className="border-t border-gray-100 px-4 py-3 mt-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center text-gray-500 font-bold text-lg uppercase">
              {user.name?.[0]}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-gray-800 text-sm truncate">
                {user.name}
              </span>
              <span className="text-xs text-gray-500 truncate">
                {user.email}
              </span>
            </div>
          </div>
          <Link
            href={route('logout')}
            method="post"
            as="button"
            className="flex items-center gap-3 py-2 text-base font-semibold text-red-500 hover:bg-red-50 hover:text-red-700 transition w-full rounded-lg px-3 mt-3"
            title="Logout"
          >
            <PowerIcon className="w-6 h-6" />
            <span>Logout</span>
          </Link>
        </div>
      </div>
    );
  }

  // Topbar
  function Topbar() {
    return (
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow flex items-center h-20 px-4 sm:px-8">
        <button
          className="md:hidden mr-3 p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Buka menu sidebar"
        >
          <Bars3Icon className="h-7 w-7" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="truncate">{header}</div>
        </div>
        {/* User info/avatar removed from topbar */}
      </header>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen flex">
      <DesktopSidebar />
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <MobileSidebar />
      <div
        className={`${collapsed ? 'md:ml-20' : 'md:ml-64'} flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out relative`}
      >
        <Topbar />
        <main
          className={`flex-1 bg-gray-100 ${collapsed ? 'p-4 sm:p-8' : 'p-4 sm:p-8'}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
