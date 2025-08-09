import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import {
  PageProps,
  BtqGroup,
  Student,
  StudentProgress,
  Juz,
  Surah,
} from '@/types';
import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import { Dialog } from '@headlessui/react';
import {
  PlusIcon,
  MinusIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/solid';

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

interface StudentWithProgress extends Student {
  progress: StudentProgress;
}
interface BtqGroupWithStudents extends BtqGroup {
  students: StudentWithProgress[];
}

const JILID_LIMITS: { [key: number]: number } = {
  1: 40,
  2: 40,
  3: 40,
  4: 40,
  5: 40,
  6: 40,
  7: 37,
  8: 25,
};

const getStatusBadgeClass = (status: string) => {
  switch (status.toLowerCase()) {
    case 'lulus':
      return 'bg-[#005929]/10 text-[#005929]';
    case 'diajukan':
      return 'bg-[#826F4F]/10 text-[#826F4F]';
    case 'proses':
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
};

export default function MyGroup({
  auth,
  btqGroup: initialGroup,
}: PageProps & { btqGroup: BtqGroupWithStudents | null }) {
  const [btqGroup, setBtqGroup] = useState(initialGroup);
  const [juzs, setJuzs] = useState<Juz[]>([]);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedJuz, setSelectedJuz] = useState('');
  const [hafalanJuzIds, setHafalanJuzIds] = useState<{ [key: number]: string }>(
    {}
  );
  const [hafalanSurahIds, setHafalanSurahIds] = useState<{
    [key: number]: string;
  }>({});
  const [hafalanAyats, setHafalanAyats] = useState<{ [key: number]: string }>(
    {}
  );
  const [editHafalanStudentId, setEditHafalanStudentId] = useState<
    number | null
  >(null);
  const [localPageChanges, setLocalPageChanges] = useState<{
    [key: number]: number;
  }>({});
  const [localHafalanChanges, setLocalHafalanChanges] = useState<{
    [key: number]: {
      juzId: number | null;
      surahId: number | null;
      ayat: string | null;
    };
  }>({});
  const [savingState, setSavingState] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  // Guard navigation when there are unsaved changes
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const allowNavigateRef = useRef(false);

  useEffect(() => {
    setBtqGroup(initialGroup);
    if (initialGroup?.students) {
      const initialPages = initialGroup.students.reduce(
        (acc, student) => {
          if (student.progress) acc[student.id] = student.progress.halaman;
          return acc;
        },
        {} as { [key: number]: number }
      );

      const initialHafalan = initialGroup.students.reduce(
        (acc, student) => {
          if (student.progress) {
            acc[student.id] = {
              juzId: (student.progress as any)?.hafalan_juz_id ?? null,
              surahId: student.progress.hafalan_surah_id,
              ayat: student.progress.hafalan_ayat,
            };
          }
          return acc;
        },
        {} as {
          [key: number]: {
            juzId: number | null;
            surahId: number | null;
            ayat: string | null;
          };
        }
      );

      setLocalPageChanges(initialPages);
      setLocalHafalanChanges(initialHafalan);
    }
  }, [initialGroup]);

  useEffect(() => {
    axios.get(route('api.juzs')).then((res) => setJuzs(res.data));
    axios.get(route('api.surahs')).then((res) => setSurahs(res.data));
  }, []);

  useEffect(() => {
    if (selectedJuz) {
      axios
        .get(route('api.surahs', { juz_id: selectedJuz }))
        .then((res) => setSurahs(res.data));
    } else {
      axios.get(route('api.surahs')).then((res) => setSurahs(res.data));
    }
  }, [selectedJuz]);

  const refreshPageData = () => {
    router.reload({ only: ['btqGroup'] });
  };

  const openHafalanModal = (student: StudentWithProgress) => {
    const localHafalan = localHafalanChanges[student.id] ?? {
      juzId: (student.progress as any)?.hafalan_juz_id,
      surahId: student.progress?.hafalan_surah_id,
      ayat: student.progress?.hafalan_ayat,
    };

    setHafalanJuzIds((prev) => ({
      ...prev,
      [student.id]: localHafalan.juzId?.toString() ?? '',
    }));
    setHafalanSurahIds((prev) => ({
      ...prev,
      [student.id]: localHafalan.surahId?.toString() ?? '',
    }));
    setHafalanAyats((prev) => ({
      ...prev,
      [student.id]: localHafalan.ayat ?? '',
    }));

    setEditHafalanStudentId(student.id);
  };

  const handleLocalPageChange = (studentId: number, amount: number) => {
    setLocalPageChanges((prev) => ({
      ...prev,
      [studentId]: (prev[studentId] || 0) + amount,
    }));
  };

  const handleSaveChangesForRow = (studentId: number) => {
    const student = btqGroup?.students.find((s) => s.id === studentId);
    if (!student || !student.progress) return;

    setSavingState((prev) => ({ ...prev, [studentId]: true }));

    const payload: {
      pages_to_add?: number;
      hafalan_juz_id?: number | null;
      hafalan_surah_id?: number | null;
      hafalan_ayat?: string | null;
    } = {};

    const initialPage = student.progress.halaman;
    const newPage = localPageChanges[studentId];
    if (newPage !== initialPage) {
      payload.pages_to_add = newPage - initialPage;
    }

    const initialHafalan = {
      juzId: (student.progress as any)?.hafalan_juz_id ?? null,
      surahId: student.progress.hafalan_surah_id,
      ayat: student.progress.hafalan_ayat,
    };
    const newHafalan = localHafalanChanges[studentId];
    if (
      newHafalan &&
      (newHafalan.juzId !== initialHafalan.juzId ||
        newHafalan.surahId !== initialHafalan.surahId ||
        newHafalan.ayat !== initialHafalan.ayat)
    ) {
      payload.hafalan_juz_id = newHafalan.juzId;
      payload.hafalan_surah_id = newHafalan.surahId;
      payload.hafalan_ayat = newHafalan.ayat;
    }

    if (Object.keys(payload).length > 0) {
      axios
        .patch(route('teacher.progress.update', student.progress.id), payload)
        .then(() => refreshPageData())
        .finally(() =>
          setSavingState((prev) => ({ ...prev, [studentId]: false }))
        );
    } else {
      setSavingState((prev) => ({ ...prev, [studentId]: false }));
    }
  };

  const handleSetHafalan = () => {
    if (!editHafalanStudentId) return;
    setLocalHafalanChanges((prev) => ({
      ...prev,
      [editHafalanStudentId]: {
        juzId: Number(hafalanJuzIds[editHafalanStudentId]) || null,
        surahId: Number(hafalanSurahIds[editHafalanStudentId]) || null,
        ayat: hafalanAyats[editHafalanStudentId] || null,
      },
    }));
    setEditHafalanStudentId(null);
  };

  // Apakah ada perubahan pada salah satu siswa?
  const hasAnyChanges = useMemo(() => {
    if (!btqGroup) return false;
    return btqGroup.students.some((student) => {
      const initialHalaman = student.progress?.halaman ?? 0;
      const localHalaman = localPageChanges[student.id] ?? initialHalaman;
      if (localHalaman !== initialHalaman) return true;

      const currentJuz = (student.progress as any)?.hafalan_juz_id ?? null;
      const currentSurah = student.progress?.hafalan_surah_id ?? null;
      const currentAyat = student.progress?.hafalan_ayat ?? null;
      const local = localHafalanChanges[student.id];
      const localJuz = local?.juzId ?? currentJuz;
      const localSurah = local?.surahId ?? currentSurah;
      const localAyat = local?.ayat ?? currentAyat;
      return (
        localJuz !== currentJuz ||
        localSurah !== currentSurah ||
        localAyat !== currentAyat
      );
    });
  }, [btqGroup, localPageChanges, localHafalanChanges]);

  // Warn on browser/tab close or refresh when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasAnyChanges) {
        e.preventDefault();
        // Chrome requires returnValue to be set
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasAnyChanges]);

  // Intercept Inertia navigations to show a confirm modal if there are unsaved changes
  useEffect(() => {
    const handler = (event: any) => {
      if (isBulkSaving) return; // allow internal reloads during save
      if (hasAnyChanges && !allowNavigateRef.current) {
        event.preventDefault?.();
        const href = event?.detail?.visit?.url?.href as string | undefined;
        if (href) setPendingUrl(href);
        setShowLeaveConfirm(true);
      }
    };
    window.addEventListener('inertia:before', handler as EventListener);
    return () =>
      window.removeEventListener('inertia:before', handler as EventListener);
  }, [hasAnyChanges, isBulkSaving]);

  // Simpan semua perubahan sekaligus
  const handleBulkSave = async () => {
    if (!btqGroup || !hasAnyChanges) return;
    setIsBulkSaving(true);
    try {
      const requests: Promise<any>[] = [];
      for (const student of btqGroup.students) {
        const progress = student.progress;
        if (!progress) continue;

        const payload: {
          pages_to_add?: number;
          hafalan_juz_id?: number | null;
          hafalan_surah_id?: number | null;
          hafalan_ayat?: string | null;
        } = {};

        // Halaman
        const initialPage = progress.halaman;
        const localHalaman = localPageChanges[student.id] ?? initialPage;
        if (localHalaman !== initialPage) {
          payload.pages_to_add = localHalaman - initialPage;
        }

        // Hafalan
        const currentJuz = (progress as any)?.hafalan_juz_id ?? null;
        const currentSurah = progress.hafalan_surah_id;
        const currentAyat = progress.hafalan_ayat;
        const local = localHafalanChanges[student.id];
        const nextJuz = local?.juzId ?? currentJuz;
        const nextSurah = local?.surahId ?? currentSurah;
        const nextAyat = local?.ayat ?? currentAyat;
        if (
          nextJuz !== currentJuz ||
          nextSurah !== currentSurah ||
          nextAyat !== currentAyat
        ) {
          payload.hafalan_juz_id = nextJuz ?? null;
          payload.hafalan_surah_id = nextSurah ?? null;
          payload.hafalan_ayat = nextAyat ?? null;
        }

        if (Object.keys(payload).length > 0) {
          requests.push(
            axios.patch(route('teacher.progress.update', progress.id), payload)
          );
        }
      }

      if (requests.length > 0) {
        await Promise.allSettled(requests);
        refreshPageData();
      }
    } finally {
      setIsBulkSaving(false);
    }
  };

  if (!btqGroup) {
    return (
      <AuthenticatedLayout
        header={
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">
            Grup Saya
          </h2>
        }
      >
        <Head title="Grup Saya" />
        <div className="py-12">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
              <div className="p-6 text-gray-900 text-center">
                <p>Anda belum ditugaskan ke kelompok BTQ manapun.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Silakan hubungi koordinator untuk informasi lebih lanjut.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  const handleProposePromotion = (progressId: number) => {
    if (!window.confirm('Yakin ingin mengajukan siswa ini untuk naik jilid?')) {
      return;
    }
    router.post(
      route('teacher.promotions.propose', progressId),
      {},
      {
        onSuccess: () => {
          // Data akan di-refresh oleh Inertia secara otomatis,
          // tapi jika butuh refresh manual, panggil di sini.
        },
        preserveScroll: true,
      }
    );
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">
            Grup Saya
          </h2>
          <a
            href={route('teacher.coordinator-notes.index')}
            className="inline-flex items-center gap-2 rounded-md border border-[#005929]/30 px-3 py-1.5 text-sm font-medium text-[#005929] hover:bg-[#005929] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#005929] transition"
          >
            <span>Lihat Catatan Koordinator</span>
            <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      }
    >
      <Head title="Grup Saya" />
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 md:p-8">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  Anggota Grup {auth.user.name}
                </h3>
                <PrimaryButton
                  onClick={handleBulkSave}
                  disabled={!hasAnyChanges || isBulkSaving}
                  className="!py-2 !px-4 !bg-[#005929] hover:!bg-[#005929]/90 focus:!ring-[#005929]"
                >
                  {isBulkSaving ? 'Menyimpan...' : 'Simpan'}
                </PrimaryButton>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Nama Siswa
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Jilid
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Halaman
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Hafalan
                      </th>
                      {/* Kolom Aksi dihapus */}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {btqGroup.students.map((student) => {
                      const progress = student.progress;
                      const jilid = progress?.jilid ?? 0;
                      const maxHalaman = JILID_LIMITS[jilid] ?? 999;
                      const initialHalaman = progress?.halaman ?? 0;
                      const localHalaman =
                        localPageChanges[student.id] ?? initialHalaman;
                      const localHafalan = localHafalanChanges[student.id] ?? {
                        juzId: null,
                        surahId: null,
                        ayat: null,
                      };
                      const hafalanJuzId =
                        localHafalan.juzId ??
                        (progress as any)?.hafalan_juz_id ??
                        null;
                      const hafalanSurahId =
                        localHafalan.surahId ?? progress?.hafalan_surah_id;
                      const hafalanAyat =
                        localHafalan.ayat ?? progress?.hafalan_ayat;
                      const isSaving = isBulkSaving;

                      return (
                        <tr
                          key={student.id}
                          className="hover:bg-gray-50 transition-colors duration-200"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {student.nama_lengkap}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {jilid > 0 ? JILID_NAMES[jilid] : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  handleLocalPageChange(student.id, -1)
                                }
                                disabled={
                                  !progress ||
                                  localHalaman <= initialHalaman ||
                                  isSaving
                                }
                                className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                title="Kurangi halaman"
                              >
                                <MinusIcon className="w-5 h-5" />
                              </button>
                              <span className="text-sm font-semibold text-gray-700 w-6 text-center">
                                {localHalaman || '-'}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleLocalPageChange(student.id, 1)
                                }
                                disabled={
                                  !progress ||
                                  localHalaman >= maxHalaman ||
                                  isSaving
                                }
                                className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                title="Tambah halaman"
                              >
                                <PlusIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {progress?.status_kenaikan ? (
                              <span
                                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                                  progress.status_kenaikan
                                )}`}
                              >
                                {progress.status_kenaikan}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic text-sm">
                                Belum ada
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              type="button"
                              onClick={() => openHafalanModal(student)}
                              className="font-medium text-[#005929] hover:text-[#826F4F] transition"
                            >
                              {hafalanSurahId && hafalanAyat
                                ? `${
                                    surahs.find((s) => s.id === hafalanSurahId)
                                      ?.name_latin ?? '...'
                                  } : ${hafalanAyat}`
                                : 'Tambah Hafalan'}
                            </button>
                          </td>
                          {/* Kolom Aksi dihapus */}
                        </tr>
                      );
                    })}
                    {btqGroup.students.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-8 text-gray-400"
                        >
                          Belum ada siswa di kelompok ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Dialog
        open={!!editHafalanStudentId}
        onClose={() => setEditHafalanStudentId(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6">
            <Dialog.Title className="text-lg font-bold text-gray-900">
              Atur Hafalan
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-gray-500 mb-4">
              Atur progres hafalan untuk siswa. Perubahan akan disimpan saat
              Anda menekan tombol 'Simpan' di tabel utama.
            </Dialog.Description>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="juz"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Pilih Juz
                </label>
                <select
                  id="juz"
                  value={hafalanJuzIds[editHafalanStudentId!] ?? selectedJuz}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedJuz(val);
                    if (editHafalanStudentId) {
                      setHafalanJuzIds((prev) => ({
                        ...prev,
                        [editHafalanStudentId]: val,
                      }));
                      // Reset surah when juz changes
                      setHafalanSurahIds((prev) => ({
                        ...prev,
                        [editHafalanStudentId]: '',
                      }));
                    }
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#005929] focus:ring-[#005929] sm:text-sm"
                >
                  <option value="">Semua Juz</option>
                  {juzs.map((j) => (
                    <option key={j.id} value={j.id}>
                      Juz {j.juz_number}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="surah"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Pilih Surah
                </label>
                <select
                  id="surah"
                  value={hafalanSurahIds[editHafalanStudentId!] ?? ''}
                  onChange={(e) =>
                    setHafalanSurahIds((prev) => ({
                      ...prev,
                      [editHafalanStudentId!]: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#005929] focus:ring-[#005929] sm:text-sm"
                >
                  <option value="">Pilih Surah</option>
                  {surahs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.surah_number}. {s.name_latin}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="ayat"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Ayat
                </label>
                <input
                  id="ayat"
                  type="text"
                  value={hafalanAyats[editHafalanStudentId!] ?? ''}
                  onChange={(e) =>
                    setHafalanAyats((prev) => ({
                      ...prev,
                      [editHafalanStudentId!]: e.target.value,
                    }))
                  }
                  placeholder="Contoh: 1-7"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#005929] focus:ring-[#005929] sm:text-sm"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <SecondaryButton onClick={() => setEditHafalanStudentId(null)}>
                Batal
              </SecondaryButton>
              <PrimaryButton
                className="!bg-[#005929] hover:!bg-[#005929]/90 focus:!ring-[#005929]"
                onClick={handleSetHafalan}
              >
                Atur
              </PrimaryButton>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Modal konfirmasi meninggalkan halaman saat ada perubahan belum disimpan */}
      <Dialog
        open={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-lg rounded-xl bg-white p-6">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto sm:mx-0 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100">
                <ExclamationTriangleIcon
                  className="h-6 w-6 text-yellow-600"
                  aria-hidden="true"
                />
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                <Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
                  Konfirmasi Meninggalkan Halaman
                </Dialog.Title>
                <div className="mt-2 text-sm text-gray-600">
                  Anda yakin ingin meninggalkan halaman ini? Perubahan yang
                  belum disimpan akan hilang.
                </div>
                <div className="mt-4 rounded border border-yellow-200 bg-yellow-50 p-3 text-yellow-800 text-sm">
                  <strong className="font-semibold">Peringatan:</strong>{' '}
                  Perubahan belum disimpan tidak dapat dipulihkan setelah Anda
                  keluar.
                </div>
              </div>
            </div>
            <div className="mt-6 sm:mt-5 sm:flex sm:flex-row-reverse">
              <DangerButton
                onClick={() => {
                  if (pendingUrl) {
                    allowNavigateRef.current = true;
                    setTimeout(() => (allowNavigateRef.current = false), 500);
                    setShowLeaveConfirm(false);
                    const url = pendingUrl;
                    setPendingUrl(null);
                    router.visit(url);
                  } else {
                    setShowLeaveConfirm(false);
                  }
                }}
                className="w-full justify-center sm:ml-3 sm:w-auto"
              >
                Tinggalkan Halaman
              </DangerButton>
              <SecondaryButton
                onClick={() => setShowLeaveConfirm(false)}
                className="mt-3 w-full justify-center sm:mt-0 sm:w-auto"
              >
                Batal
              </SecondaryButton>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </AuthenticatedLayout>
  );
}
