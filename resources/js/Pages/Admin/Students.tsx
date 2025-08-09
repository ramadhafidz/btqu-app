import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { FormEventHandler, useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import {
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/useToast';
import DangerButton from '@/Components/DangerButton';

const JILID_INFO: { [key: number]: { name: string; limit: number } } = {
  1: { name: 'Jilid 1', limit: 40 },
  2: { name: 'Jilid 2', limit: 40 },
  3: { name: 'Jilid 3', limit: 40 },
  4: { name: 'Jilid 4', limit: 40 },
  5: { name: 'Jilid 5', limit: 40 },
  6: { name: 'Jilid 6', limit: 40 },
  7: { name: 'Gharib', limit: 37 },
  8: { name: 'Tajwid', limit: 25 },
};

interface SchoolClass {
  id: number;
  level: number;
  nama_kelas: string;
}

interface Student {
  id: number;
  nisn: string;
  nama_lengkap: string;
  school_class: SchoolClass | null;
  btq_group: {
    id: number;
    teacher?: {
      user: {
        name: string;
      };
    };
  } | null;
  progress: {
    jilid: number;
    halaman: number;
  } | null;
}

interface ValidationErrors {
  nisn?: string[];
  nama_lengkap?: string[];
  school_class_id?: string[];
  jilid?: string[];
  halaman?: string[];
}

export default function Index({ auth }: PageProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const [formData, setFormData] = useState({
    nisn: '',
    nama_lengkap: '',
    school_class_id: '',
    jilid: '',
    halaman: '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortField, setSortField] = useState<'nama_lengkap' | 'nisn' | ''>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [availableClasses, setAvailableClasses] = useState<SchoolClass[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const toast = useToast();

  // State untuk modal konfirmasi penghapusan
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Ada filter aktif jika ada kolom urut atau level/kelas terisi
  const hasActiveFilter = useMemo(
    () => Boolean(sortField || filterLevel || filterClass),
    [sortField, filterLevel, filterClass]
  );

  useEffect(() => {
    axios
      .get(route('admin.api.all-school-classes'))
      .then((response) => setSchoolClasses(response.data));
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Kirim filter level ke backend jika ada
      const params = {
        search: searchQuery,
        class: filterClass,
        level: filterLevel,
        sort: sortField || undefined,
        order: sortField ? sortDir : undefined,
      };
      axios
        .get(route('admin.api.students.index'), { params })
        .then((response) => setStudents(response.data));
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, filterClass, filterLevel, sortField, sortDir, refreshKey]);

  useEffect(() => {
    if (filterLevel) {
      setAvailableClasses(
        schoolClasses.filter((sc) => sc.level.toString() === filterLevel)
      );
      // Jangan reset filterClass jika filterLevel berubah, kecuali filterLevel dikosongkan
    } else {
      setAvailableClasses([]);
      setFilterClass('');
    }
  }, [filterLevel, schoolClasses]);

  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [filteredClasses, setFilteredClasses] = useState<SchoolClass[]>([]);
  const uniqueLevels = useMemo(() => {
    const levels = schoolClasses.map((sc) => sc.level);
    return [...new Set(levels)].sort((a, b) => a - b);
  }, [schoolClasses]);

  useEffect(() => {
    if (isEditMode && currentStudent?.school_class) {
      const level = currentStudent.school_class.level.toString();
      setSelectedLevel(level);
      setFilteredClasses(
        schoolClasses.filter((sc) => sc.level.toString() === level)
      );
    }
  }, [isEditMode, currentStudent, schoolClasses]);

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const level = e.target.value;
    setSelectedLevel(level);
    setFilteredClasses(
      level ? schoolClasses.filter((sc) => sc.level.toString() === level) : []
    );
    setFormData((prev) => ({ ...prev, school_class_id: '' }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const newState = { ...prev, [name]: value };

      if (name === 'jilid') {
        newState.halaman = value ? '1' : '';
      }
      return newState;
    });
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setErrors({});
    setFormData({
      nisn: '',
      nama_lengkap: '',
      school_class_id: '',
      jilid: '',
      halaman: '',
    });
    setSelectedLevel('');
    setFilteredClasses([]);
    setIsModalOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterLevel('');
    setFilterClass('');
    setSortField('');
    setSortDir('asc');
    setAvailableClasses([]);
  };

  const openEditModal = (student: Student) => {
    setIsEditMode(true);
    setCurrentStudent(student);
    setErrors({});
    setFormData({
      nisn: student.nisn,
      nama_lengkap: student.nama_lengkap,
      school_class_id: student.school_class?.id.toString() || '',
      jilid: student.progress?.jilid.toString() || '',
      halaman: student.progress?.halaman.toString() || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setErrors({});
  };

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});
    const url = isEditMode
      ? route('admin.api.students.update', currentStudent?.id)
      : route('admin.api.students.store');
    const method = isEditMode ? 'put' : 'post';
    axios({ method, url, data: formData })
      .then((response) => {
        closeModal();
        setRefreshKey((oldKey) => oldKey + 1);
        // Tampilkan notistack sukses
        if (response.data && response.data.message) {
          toast.success(response.data.message);
        } else {
          toast.success(
            isEditMode
              ? 'Siswa berhasil diperbarui.'
              : 'Siswa baru berhasil ditambahkan.'
          );
        }
      })
      .catch((error) => {
        if (error.response?.status === 422) {
          setErrors(error.response.data.errors);
        } else {
          toast.error('Terjadi kesalahan saat menyimpan data.');
        }
      })
      .finally(() => setProcessing(false));
  };

  const deleteStudent = (student: Student) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    axios
      .delete(route('admin.api.students.destroy', studentToDelete.id))
      .then(() => {
        setIsDeleteModalOpen(false);
        setStudentToDelete(null);
        setRefreshKey((oldKey) => oldKey + 1);
        toast.success('Siswa berhasil dihapus.');
      })
      .catch(() => {
        toast.error('Terjadi kesalahan saat menghapus siswa.');
      })
      .finally(() => setIsDeleting(false));
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setStudentToDelete(null);
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center justify-between min-h-[64px] px-0 sm:px-6 lg:px-8 py-4">
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">
            Manajemen Siswa
          </h2>
        </div>
      }
    >
      <Head title="Manajemen Siswa" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Daftar Siswa</h3>
              <p className="text-sm text-gray-500">
                Kelola semua data siswa di sekolah Anda.
              </p>
            </div>
            <PrimaryButton
              onClick={openAddModal}
              className="flex items-center gap-2 !bg-[#005929] hover:!bg-[#005929]/90 focus:!bg-[#005929] active:!bg-[#005929] focus:!ring-[#005929]"
            >
              <PlusCircleIcon className="w-5 h-5" />
              <span>Tambah Siswa</span>
            </PrimaryButton>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              </div>
              <TextInput
                type="text"
                placeholder="Cari berdasarkan nama atau NISN..."
                className="w-full pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex justify-end items-center gap-2 md:shrink-0">
              {!isFilterOpen && hasActiveFilter && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
                  title="Clear filter"
                  aria-label="Clear filter"
                >
                  <XMarkIcon className="w-5 h-5" />
                  Clear filter
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsFilterOpen((v) => !v)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
              >
                <FunnelIcon className="w-5 h-5" />
                Filter
              </button>
            </div>
          </div>

          {isFilterOpen && (
            <div className="mb-6 bg-white shadow-sm sm:rounded-lg border border-gray-200">
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <InputLabel value="Urutkan" />
                  <div className="flex gap-2 mt-1">
                    <select
                      value={sortField}
                      onChange={(e) =>
                        setSortField(
                          e.target.value as 'nama_lengkap' | 'nisn' | ''
                        )
                      }
                      className="w-1/2 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                      aria-label="Pilih kolom urut"
                    >
                      <option value="">Pilih Kolom</option>
                      <option value="nama_lengkap">Nama</option>
                      <option value="nisn">NISN</option>
                    </select>
                    <select
                      value={sortDir}
                      onChange={(e) =>
                        setSortDir(e.target.value as 'asc' | 'desc')
                      }
                      disabled={!sortField}
                      className="w-1/2 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm disabled:bg-gray-200"
                      aria-label="Pilih arah urut"
                      title={
                        !sortField
                          ? 'Pilih kolom urut terlebih dahulu'
                          : undefined
                      }
                    >
                      <option value="asc">Naik</option>
                      <option value="desc">Turun</option>
                    </select>
                  </div>
                </div>

                <div>
                  <InputLabel value="Level" />
                  <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                    className="mt-1 w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                    aria-label="Filter berdasarkan level"
                  >
                    <option value="">Semua Level</option>
                    {uniqueLevels.map((level) => (
                      <option key={level} value={level}>
                        Level {level}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <InputLabel value="Kelas" />
                  <select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    disabled={!filterLevel}
                    className="mt-1 w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm disabled:bg-gray-200"
                    aria-label="Filter berdasarkan kelas"
                  >
                    <option value="">Semua Kelas</option>
                    {availableClasses.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.nama_kelas}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="px-4 pb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
                  title="Clear filter"
                  aria-label="Clear filter"
                >
                  <XMarkIcon className="w-5 h-5" />
                  Clear filter
                </button>
                <div className="flex gap-2">
                  <SecondaryButton onClick={() => setIsFilterOpen(false)}>
                    Tutup
                  </SecondaryButton>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white shadow-sm sm:rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 font-bold">
                    Info Siswa
                  </th>
                  <th scope="col" className="px-6 py-3 font-bold">
                    Kelas
                  </th>
                  <th scope="col" className="px-6 py-3 font-bold">
                    Kelompok BTQ
                  </th>
                  <th scope="col" className="px-6 py-3 font-bold text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {student.nama_lengkap}
                      </div>
                      <div className="text-gray-500">NISN: {student.nisn}</div>
                    </td>
                    <td className="px-6 py-4">
                      {student.school_class
                        ? `${student.school_class.level} ${student.school_class.nama_kelas}`
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {student.btq_group ? (
                        <span className="bg-[#005929]/10 text-[#005929] text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">
                          {student.btq_group.teacher
                            ? `Grup ${student.btq_group.teacher.user.name}`
                            : `Grup ID: ${student.btq_group.id}`}
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">
                          Belum Ada
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(student)}
                        className="font-medium text-[#005929] hover:text-[#826F4F] p-2"
                        title="Edit siswa"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteStudent(student)}
                        className="font-medium text-red-600 hover:text-red-800 p-2 ml-2"
                        title="Hapus siswa"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-12">
                      <h3 className="font-semibold text-lg">
                        Siswa Tidak Ditemukan
                      </h3>
                      <p className="text-gray-500 mt-1">
                        Coba ubah filter atau kata kunci pencarian Anda.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Modal show={isModalOpen} onClose={closeModal}>
        <form onSubmit={submit} className="p-6">
          <h2 className="text-lg font-medium text-gray-900">
            {isEditMode ? 'Edit Siswa' : 'Tambah Siswa Baru'}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Pastikan semua data siswa terisi dengan benar.
          </p>

          <div className="mt-6 space-y-4">
            {/* Baris 1: NISN & Nama Lengkap */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <InputLabel htmlFor="nisn" value="NISN" />
                <TextInput
                  id="nisn"
                  name="nisn"
                  value={formData.nisn}
                  className="mt-1 block w-full"
                  onChange={handleInputChange}
                  required
                />
                <InputError message={errors.nisn?.[0]} className="mt-2" />
              </div>
              <div>
                <InputLabel htmlFor="nama_lengkap" value="Nama Lengkap" />
                <TextInput
                  id="nama_lengkap"
                  name="nama_lengkap"
                  value={formData.nama_lengkap}
                  className="mt-1 block w-full"
                  onChange={handleInputChange}
                  required
                />
                <InputError
                  message={errors.nama_lengkap?.[0]}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Baris 2: Kelas (Level & Nama) */}
            <div>
              <InputLabel value="Kelas" />
              <div className="flex space-x-2 mt-1">
                <select
                  name="level"
                  value={selectedLevel}
                  onChange={handleLevelChange}
                  className="block w-1/3 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                  title="Pilih Level Kelas"
                  aria-label="Pilih Level Kelas"
                >
                  <option value="">Pilih Level</option>
                  {uniqueLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                <select
                  name="school_class_id"
                  id="school_class_id"
                  value={formData.school_class_id}
                  onChange={handleInputChange}
                  required
                  disabled={!selectedLevel}
                  className="block w-2/3 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm disabled:bg-gray-200"
                  aria-label="Pilih Nama Kelas"
                >
                  <option value="">Pilih Nama Kelas</option>
                  {filteredClasses.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.nama_kelas}
                    </option>
                  ))}
                </select>
              </div>
              <InputError
                message={errors.school_class_id?.[0]}
                className="mt-2"
              />
            </div>

            {/* Baris 3: Jilid & Halaman */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <InputLabel htmlFor="jilid" value="Jilid" />
                <select
                  id="jilid"
                  name="jilid"
                  value={formData.jilid}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                  required
                  title="Pilih Jilid BTQ"
                  aria-label="Pilih Jilid BTQ"
                >
                  <option value="">Pilih Jilid</option>
                  {Object.entries(JILID_INFO).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.name}
                    </option>
                  ))}
                </select>
                <InputError message={errors.jilid?.[0]} className="mt-2" />
              </div>
              <div>
                <InputLabel htmlFor="halaman" value="Halaman" />
                <TextInput
                  id="halaman"
                  type="number"
                  name="halaman"
                  min="1"
                  max={
                    formData.jilid
                      ? JILID_INFO[Number(formData.jilid)].limit
                      : undefined
                  }
                  value={formData.halaman}
                  className="mt-1 block w-full"
                  onChange={handleInputChange}
                  disabled={!formData.jilid}
                  required
                />
                <InputError message={errors.halaman?.[0]} className="mt-2" />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <SecondaryButton onClick={closeModal}>Batal</SecondaryButton>
            <PrimaryButton className="ms-3" disabled={processing}>
              Simpan
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Modal Konfirmasi Penghapusan */}
      <Modal show={isDeleteModalOpen} onClose={closeDeleteModal}>
        <div className="p-6">
          <div className="flex items-center">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                Konfirmasi Penghapusan
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Anda yakin ingin menghapus siswa{' '}
                  <span className="font-semibold text-gray-900">
                    {studentToDelete?.nama_lengkap}
                  </span>
                  ?
                </p>
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-amber-800">
                        <strong>Peringatan:</strong> Penghapusan siswa akan
                        menghapus seluruh data siswa ini secara permanen.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <DangerButton
              onClick={confirmDelete}
              disabled={isDeleting}
              className="w-full justify-center sm:ml-3 sm:w-auto"
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
            </DangerButton>
            <SecondaryButton
              onClick={closeDeleteModal}
              disabled={isDeleting}
              className="mt-3 w-full justify-center sm:mt-0 sm:w-auto"
            >
              Batal
            </SecondaryButton>
          </div>
        </div>
      </Modal>
    </AuthenticatedLayout>
  );
}
