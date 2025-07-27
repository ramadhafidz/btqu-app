import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { PageProps, User } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';

// Tambahkan relasi teacher ke tipe User jika ada
interface UserWithTeacher extends User {
  teacher: { id_pegawai: string } | null;
}

export default function Index({
  auth,
  users,
}: PageProps<{ users: UserWithTeacher[] }>) {
  const handleChangeRole = (user: UserWithTeacher) => {
    const newRole = user.role === 'guru' ? 'koordinator' : 'guru';
    if (confirm(`Yakin ingin mengubah role ${user.name} menjadi ${newRole}?`)) {
      router.patch(
        route('superadmin.users.change-role', user.id),
        { role: newRole },
        {
          preserveScroll: true,
        }
      );
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
          Kelola User
        </h2>
      }
    >
      <Head title="Kelola User" />
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white shadow-sm sm:rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Nama</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role Saat Ini</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'guru' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <PrimaryButton onClick={() => handleChangeRole(user)}>
                        Ubah Role
                      </PrimaryButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
