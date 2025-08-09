import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import KpiCard from '@/Components/KpiCard';
import {
  UsersIcon,
  UserPlusIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';

interface Stats {
  total_users: number;
  total_teachers: number;
  total_coordinators: number;
}

export default function Dashboard({
  auth,
  stats,
}: PageProps<{ stats: Stats }>) {
  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
          Dashboard Super Admin
        </h2>
      }
    >
      <Head title="Dashboard Super Admin" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 mb-6">
            <h3 className="text-2xl font-bold text-gray-800">
              Selamat Datang, {auth.user.name}!
            </h3>
            <p className="text-gray-500 mt-1">
              Anda memiliki akses penuh untuk mengelola sistem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KpiCard
              title="Total Pengguna (Guru & Koor)"
              value={stats.total_users}
              icon={<UsersIcon className="w-8 h-8 text-[#005929]" />}
            />
            <KpiCard
              title="Total Guru"
              value={stats.total_teachers}
              icon={<BriefcaseIcon className="w-8 h-8 text-[#826F4F]" />}
            />
            <KpiCard
              title="Total Koordinator"
              value={stats.total_coordinators}
              icon={<UserPlusIcon className="w-8 h-8 text-[#005929]" />}
            />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
