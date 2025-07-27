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
} from '@heroicons/react/24/outline';

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
  const [availableClasses, setAvailableClasses] = useState<SchoolClass[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    axios
      .get(route('admin.api.all-school-classes'))
      .then((response) => setSchoolClasses(response.data));
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      axios
        .get(
          route('admin.api.students.index', {
            search: searchQuery,
            class: filterClass,
          })
        )
        .then((response) => setStudents(response.data));
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, filterClass, refreshKey]);

  useEffect(() => {
    if (filterLevel) {
      setAvailableClasses(
        schoolClasses.filter((sc) => sc.level.toString() === filterLevel)
      );
    } else {
      setAvailableClasses([]);
    }
    setFilterClass('');
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
    const url = isEditMode
      ? route('admin.api.students.update', currentStudent?.id)
      : route('admin.api.students.store');
    const method = isEditMode ? 'put' : 'post';
    axios({ method, url, data: formData })
      .then(() => {
        closeModal();
        setRefreshKey((oldKey) => oldKey + 1);
      })
      .catch((error) => {
        if (error.response?.status === 422) {
          setErrors(error.response.data.errors);
        }
      })
      .finally(() => setProcessing(false));
  };

  const deleteStudent = (student: Student) => {
    if (
      !window.confirm(`Yakin ingin menghapus siswa ${student.nama_lengkap}?`)
    ) {
      return;
    }
    axios.delete(route('admin.api.students.destroy', student.id)).then(() => {
      setRefreshKey((oldKey) => oldKey + 1);
    });
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
          Manajemen Siswa
        </h2>
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
              className="flex items-center gap-2"
            >
              <PlusCircleIcon className="w-5 h-5" />
              <span>Tambah Siswa</span>
            </PrimaryButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative md:col-span-2">
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

            <div className="flex gap-2">
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-1/2 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
              >
                <option value="">Semua Level</option>
                {uniqueLevels.map((level) => (
                  <option key={level} value={level}>
                    Level {level}
                  </option>
                ))}
              </select>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                disabled={!filterLevel}
                className="w-1/2 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm disabled:bg-gray-200"
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
                        <span className="bg-indigo-100 text-indigo-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">
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
                        className="font-medium text-indigo-600 hover:text-indigo-800 p-2"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteStudent(student)}
                        className="font-medium text-red-600 hover:text-red-800 p-2 ml-2"
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
    </AuthenticatedLayout>
  );
}
