import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { PageProps, User } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';

interface ResetRequest {
  id: number;
  user: User;
  created_at: string;
}

export default function Index({
  auth,
  requests,
}: PageProps<{ requests: ResetRequest[] }>) {
  const handleReset = (user: User) => {
    if (
      confirm(
        `Yakin ingin mereset password untuk ${user.name}? Password akan diubah ke default.`
      )
    ) {
      router.post(
        route('superadmin.users.reset-password', user.id),
        {},
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
          Permintaan Reset Password
        </h2>
      }
    >
      <Head title="Permintaan Reset Password" />
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white shadow-sm sm:rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Nama Pengguna</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Waktu Permintaan</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {requests.length > 0 ? (
                  requests.map((req) => (
                    <tr
                      key={req.id}
                      className="bg-white border-b hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {req.user.name}
                      </td>
                      <td className="px-6 py-4">{req.user.email}</td>
                      <td className="px-6 py-4">
                        {new Date(req.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <PrimaryButton onClick={() => handleReset(req.user)}>
                          Reset Password
                        </PrimaryButton>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-gray-500">
                      Tidak ada permintaan reset password yang pending.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
