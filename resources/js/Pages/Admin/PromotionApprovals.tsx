import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useToast } from '@/hooks/useToast';
import { PageProps, StudentProgress } from '@/types';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';

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
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<
    'approve' | 'reject' | null
  >(null);
  const [selectedProposal, setSelectedProposal] =
    React.useState<Proposal | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [note, setNote] = React.useState('');
  const quillModules = React.useMemo(
    () => ({
      toolbar: [
        ['bold', 'italic', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
      ],
    }),
    []
  );
  const quillFormats = React.useMemo(
    () => ['bold', 'italic', 'strike', 'list', 'bullet', 'link'],
    []
  );

  // Removed old Markdown helpers now that we use a WYSIWYG editor

  const handleApprove = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setConfirmAction('approve');
    setConfirmOpen(true);
  };

  const handleReject = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setConfirmAction('reject');
    setConfirmOpen(true);
  };

  const onConfirm = () => {
    if (!selectedProposal || !confirmAction) return;
    setIsSubmitting(true);
    const routeName =
      confirmAction === 'approve'
        ? route('admin.promotion-approvals.approve', selectedProposal.id)
        : route('admin.promotion-approvals.reject', selectedProposal.id);
    router.post(
      routeName,
      { note },
      {
        preserveScroll: true,
        onSuccess: () => {
          if (confirmAction === 'approve') {
            toast.success('Kenaikan jilid berhasil disetujui.');
          } else {
            toast.success('Pengajuan kenaikan jilid ditolak.');
          }
          setConfirmOpen(false);
          setSelectedProposal(null);
          setConfirmAction(null);
          setNote('');
        },
        onError: () => {
          if (confirmAction === 'approve') {
            toast.error('Gagal menyetujui kenaikan jilid.');
          } else {
            toast.error('Gagal menolak pengajuan kenaikan.');
          }
        },
        onFinish: () => setIsSubmitting(false),
      }
    );
  };

  const onCloseConfirm = () => {
    if (isSubmitting) return;
    setConfirmOpen(false);
    setSelectedProposal(null);
    setConfirmAction(null);
    setNote('');
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
      {/* Modal Konfirmasi Setujui/Tolak */}
      <Modal show={confirmOpen} onClose={onCloseConfirm}>
        <div className="p-6">
          <div className="flex items-center">
            <div
              className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${confirmAction === 'approve' ? 'bg-green-100' : 'bg-red-100'}`}
            >
              {confirmAction === 'approve' ? (
                <CheckCircleIcon
                  className="h-6 w-6 text-green-600"
                  aria-hidden="true"
                />
              ) : (
                <XCircleIcon
                  className="h-6 w-6 text-red-600"
                  aria-hidden="true"
                />
              )}
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                {confirmAction === 'approve'
                  ? 'Konfirmasi Persetujuan'
                  : 'Konfirmasi Penolakan'}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {confirmAction === 'approve'
                    ? 'Anda yakin ingin MENYETUJUI kenaikan jilid untuk siswa '
                    : 'Anda yakin ingin MENOLAK kenaikan jilid untuk siswa '}
                  <span className="font-semibold text-gray-900">
                    {selectedProposal?.student.nama_lengkap}
                  </span>
                  ?
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Catatan Koordinator (opsional)
              </label>
              <div className="mt-2">
                <ReactQuill
                  theme="snow"
                  value={note}
                  onChange={setNote}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Tulis catatan untuk guru..."
                  className="bg-white"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row-reverse sm:gap-3">
              {confirmAction === 'reject' ? (
                <DangerButton
                  onClick={onConfirm}
                  disabled={isSubmitting}
                  className="w-full justify-center sm:w-auto"
                >
                  {isSubmitting ? 'Memproses...' : 'Ya, Tolak'}
                </DangerButton>
              ) : (
                <PrimaryButton
                  onClick={onConfirm}
                  disabled={isSubmitting}
                  className="w-full justify-center sm:w-auto"
                >
                  {isSubmitting ? 'Memproses...' : 'Ya, Setujui'}
                </PrimaryButton>
              )}
              <SecondaryButton
                onClick={onCloseConfirm}
                disabled={isSubmitting}
                className="w-full justify-center sm:w-auto"
              >
                Batal
              </SecondaryButton>
            </div>
          </div>
        </div>
      </Modal>
    </AuthenticatedLayout>
  );
}
