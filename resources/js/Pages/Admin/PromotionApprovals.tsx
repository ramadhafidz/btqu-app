import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { PageProps, StudentProgress } from '@/types';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

// [BARU] Definisikan nama jilid agar bisa digunakan di sini
const JILID_NAMES: { [key: number]: string } = {
  1: 'Jilid 1',
  2: 'Jilid 2',
  3: 'Jilid 3',
  4: 'Jilid 4',
  5: 'Jilid 5',
  6: 'Jilid 6',
  7: 'Gharib',
  8: 'Tajwid',
};

// Definisikan tipe data yang lebih detail
interface Proposal extends StudentProgress {
  student: {
    nama_lengkap: string;
    nisn: string;
    school_class: {
      level: number;
      nama_kelas: string;
    } | null;
    btq_group: {
      teacher: {
        user: {
          name: string;
        };
      } | null;
    } | null;
  };
}

export default function Index({
  auth,
  proposals,
}: PageProps<{ proposals: Proposal[] }>) {
  const flash = (usePage().props as any).flash ?? {};

  const handleApprove = (proposal: Proposal) => {
    if (
      !window.confirm(
        `Yakin ingin MENYETUJUI kenaikan jilid untuk siswa ${proposal.student.nama_lengkap}?`
      )
    )
      return;
    router.post(
      route('admin.promotion-approvals.approve', proposal.id),
      {},
      { preserveScroll: true }
    );
  };

  const handleReject = (proposal: Proposal) => {
    if (
      !window.confirm(
        `Yakin ingin MENOLAK kenaikan jilid untuk siswa ${proposal.student.nama_lengkap}?`
      )
    )
      return;
    router.post(
      route('admin.promotion-approvals.reject', proposal.id),
      {},
      { preserveScroll: true }
    );
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
          Persetujuan Kenaikan Jilid
        </h2>
      }
    >
      <Head title="Persetujuan Kenaikan" />
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Header Halaman */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-800">
              Daftar Pengajuan
            </h3>
            <p className="text-sm text-gray-500">
              Tinjau dan berikan persetujuan untuk siswa yang diajukan naik
              jilid oleh guru.
            </p>
          </div>

          {flash.success && (
            <div
              className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md"
              role="alert"
            >
              <p>{flash.success}</p>
            </div>
          )}

          {/* [UBAH] Desain Ulang Tabel */}
          <div className="bg-white shadow-sm sm:rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 font-bold">
                    Info Siswa
                  </th>
                  <th scope="col" className="px-6 py-3 font-bold">
                    Kenaikan Jilid
                  </th>
                  <th scope="col" className="px-6 py-3 font-bold">
                    Diajukan Oleh
                  </th>
                  <th scope="col" className="px-6 py-3 font-bold text-center">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((proposal) => (
                  <tr
                    key={proposal.id}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {proposal.student.nama_lengkap}
                      </div>
                      <div className="text-gray-500">
                        {proposal.student.school_class
                          ? `${proposal.student.school_class.level} ${proposal.student.school_class.nama_kelas}`
                          : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-800">
                        {/* [UBAH] Gunakan JILID_NAMES untuk menampilkan nama jilid */}
                        {JILID_NAMES[proposal.jilid]} &rarr;{' '}
                        {JILID_NAMES[proposal.jilid + 1] ?? 'Lulus'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {proposal.student.btq_group?.teacher?.user.name ?? 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleApprove(proposal)}
                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md text-xs transition"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>Setujui</span>
                      </button>
                      <button
                        onClick={() => handleReject(proposal)}
                        className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md text-xs transition ml-2"
                      >
                        <XCircleIcon className="w-4 h-4" />
                        <span>Tolak</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {proposals.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-12">
                      <h3 className="font-semibold text-lg">
                        Tidak Ada Pengajuan
                      </h3>
                      <p className="text-gray-500 mt-1">
                        Saat ini tidak ada siswa yang diajukan untuk kenaikan
                        jilid.
                      </p>
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
