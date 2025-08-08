import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PageProps, User } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';
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

interface Teacher {
  id: number;
  id_pegawai: string;
  user: User;
  btq_group: {
    id: number;
    level: number;
    students_count: number;
  } | null;
}
interface ValidationErrors {
  name?: string[];
  email?: string[];
  password?: string[];
  id_pegawai?: string[];
}

export default function Index({ auth }: PageProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    id_pegawai: '',
  });
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  // [BARU] State untuk query pencarian
  const [searchQuery, setSearchQuery] = useState('');

  // [UBAH] useEffect untuk fetch data dengan debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      axios
        .get(route('admin.api.teachers.index', { search: searchQuery }))
        .then((response) => setTeachers(response.data));
    }, 300); // Jeda 300ms sebelum mengirim request

    return () => clearTimeout(timeoutId); // Membersihkan timeout jika user mengetik lagi
  }, [searchQuery]); // Efek ini dijalankan setiap kali searchQuery berubah

  const openAddModal = () => {
    /* ... (fungsi ini tidak berubah) */
    setIsEditMode(false);
    setErrors({});
    setFormData({
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      id_pegawai: '',
    });
    setIsModalOpen(true);
  };
  const openEditModal = (teacher: Teacher) => {
    /* ... (fungsi ini tidak berubah) */
    setIsEditMode(true);
    setErrors({});
    setFormData({
      name: teacher.user.name,
      email: teacher.user.email,
      id_pegawai: teacher.id_pegawai,
      password: '',
      password_confirmation: '',
    });
    setCurrentTeacher(teacher);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    /* ... (fungsi ini tidak berubah) */
    setIsModalOpen(false);
    setErrors({});
  };
  const submit: FormEventHandler = (e) => {
    /* ... (fungsi ini tidak berubah) */
    e.preventDefault();
    setProcessing(true);
    const url = isEditMode
      ? route('admin.api.teachers.update', currentTeacher?.id)
      : route('admin.api.teachers.store');
    const method = isEditMode ? 'put' : 'post';
    axios({ method, url, data: formData })
      .then(() => {
        closeModal();
        setSearchQuery('');
      })
      .catch((error) => {
        if (error.response && error.response.status === 422) {
          setErrors(error.response.data.errors);
        }
      })
      .finally(() => setProcessing(false));
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    /* ... (fungsi ini tidak berubah) */
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const deleteTeacher = (teacher: Teacher) => {
    /* ... (fungsi ini tidak berubah) */
    if (
      !window.confirm(
        `Yakin ingin menghapus guru ${teacher.user.name}? Akun login guru ini juga akan terhapus.`
      )
    ) {
      return;
    }
    axios
      .delete(route('admin.api.teachers.destroy', teacher.id))
      .then(() => setSearchQuery(''));
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
          Manajemen Guru
        </h2>
      }
    >
      <Head title="Manajemen Guru" />
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Daftar Guru</h3>
              <p className="text-sm text-gray-500">
                Kelola semua data guru dan akun pengajar.
              </p>
            </div>
            <PrimaryButton
              onClick={openAddModal}
              className="flex items-center gap-2"
            >
              <PlusCircleIcon className="w-5 h-5" />
              <span>Tambah Guru</span>
            </PrimaryButton>
          </div>

          {/* [BARU] Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              </div>
              <TextInput
                type="text"
                placeholder="Cari berdasarkan nama, email, atau ID pegawai..."
                className="w-full pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white shadow-sm sm:rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 font-bold">
                    Info Guru
                  </th>
                  <th scope="col" className="px-6 py-3 font-bold">
                    ID Pegawai
                  </th>
                  <th scope="col" className="px-6 py-3 font-bold">
                    Mengajar Grup
                  </th>
                  <th scope="col" className="px-6 py-3 font-bold text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr
                    key={teacher.id}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {teacher.user.name}
                      </div>
                      <div className="text-gray-500">{teacher.user.email}</div>
                    </td>
                    <td className="px-6 py-4">{teacher.id_pegawai}</td>
                    <td className="px-6 py-4">
                      {teacher.btq_group ? (
                        <span className="bg-green-100 text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">
                          Level {teacher.btq_group.level} (
                          {teacher.btq_group.students_count} Siswa)
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">
                          Belum Mengajar
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(teacher)}
                        className="font-medium text-indigo-600 hover:text-indigo-800 p-2"
                        title="Edit guru"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      <button
                        onClick={() => deleteTeacher(teacher)}
                        className="font-medium text-red-600 hover:text-red-800 p-2 ml-2"
                        title="Hapus guru"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                      </button>
                    </td>
                  </tr>
                ))}
                {teachers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-12">
                      <h3 className="font-semibold text-lg">
                        Guru Tidak Ditemukan
                      </h3>
                      <p className="text-gray-500 mt-1">
                        Coba ubah kata kunci pencarian Anda atau tambahkan guru
                        baru.
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
        {/* Modal tidak ada perubahan */}
        <form onSubmit={submit} className="p-6">
          <h2 className="text-lg font-medium text-gray-900">
            {isEditMode ? 'Edit Guru' : 'Tambah Guru Baru'}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {isEditMode && 'Kosongkan password jika tidak ingin mengubahnya.'}
          </p>
          <div className="mt-6">
            <InputLabel htmlFor="name" value="Nama Lengkap" />
            <TextInput
              id="name"
              name="name"
              value={formData.name}
              className="mt-1 block w-full"
              onChange={handleInputChange}
              required
            />
            <InputError message={errors.name?.[0]} className="mt-2" />
          </div>
          <div className="mt-4">
            <InputLabel htmlFor="id_pegawai" value="ID Pegawai" />
            <TextInput
              id="id_pegawai"
              name="id_pegawai"
              value={formData.id_pegawai}
              className="mt-1 block w-full"
              onChange={handleInputChange}
              required
            />
            <InputError message={errors.id_pegawai?.[0]} className="mt-2" />
          </div>
          <div className="mt-4">
            <InputLabel htmlFor="email" value="Email" />
            <TextInput
              id="email"
              type="email"
              name="email"
              value={formData.email}
              className="mt-1 block w-full"
              onChange={handleInputChange}
              required
            />
            <InputError message={errors.email?.[0]} className="mt-2" />
          </div>
          <div className="mt-4">
            <InputLabel htmlFor="password" value="Password" />
            <TextInput
              id="password"
              type="password"
              name="password"
              value={formData.password}
              className="mt-1 block w-full"
              onChange={handleInputChange}
              required={!isEditMode}
            />
            <InputError message={errors.password?.[0]} className="mt-2" />
          </div>
          <div className="mt-4">
            <InputLabel
              htmlFor="password_confirmation"
              value="Konfirmasi Password"
            />
            <TextInput
              id="password_confirmation"
              type="password"
              name="password_confirmation"
              value={formData.password_confirmation}
              className="mt-1 block w-full"
              onChange={handleInputChange}
              required={!isEditMode}
            />
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
