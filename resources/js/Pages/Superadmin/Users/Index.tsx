import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { PageProps, User } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import {
  PencilSquareIcon,
  PlusCircleIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import DangerButton from '@/Components/DangerButton';

// Tambahkan relasi teacher ke tipe User jika ada
interface UserWithEmployee extends User {
  employee: {
    id: number;
    id_pegawai: string;
  } | null;
}

export default function Index({
  auth,
  users: initialUsers,
}: PageProps<{ users: UserWithEmployee[] }>) {
  const { flash } = usePage().props;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserWithEmployee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Gunakan useForm untuk form tambah dan edit
  const { data, setData, post, put, processing, errors, reset } = useForm({
    name: '',
    email: '',
    role: 'guru',
    id_pegawai: '',
  });

  // Efek untuk melakukan pencarian saat user mengetik
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      router.get(
        route('superadmin.users.index'),
        { search: searchQuery },
        {
          preserveState: true,
          replace: true,
        }
      );
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Fungsi untuk membuka modal tambah
  const openAddModal = () => {
    setIsEditMode(false);
    reset();
    setIsModalOpen(true);
  };

  // Fungsi untuk membuka modal edit
  const openEditModal = (user: UserWithEmployee) => {
    setIsEditMode(true);
    setCurrentUser(user);
    setData({
      name: user.name,
      email: user.email,
      role: user.role,
      id_pegawai: user.employee?.id_pegawai || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset();
  };

  // Fungsi untuk submit form (bisa untuk tambah atau edit)
  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    if (isEditMode && currentUser) {
      put(route('superadmin.users.update', currentUser.id), {
        onSuccess: () => closeModal(),
      });
    } else {
      post(route('superadmin.users.store'), {
        onSuccess: () => closeModal(),
      });
    }
  };

  // Fungsi untuk hapus user
  const deleteUser = (user: UserWithEmployee) => {
    if (confirm(`Yakin ingin menghapus user ${user.name}?`)) {
      router.delete(route('superadmin.users.destroy', user.id), {
        preserveScroll: true,
      });
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
          Kelola Pengguna
        </h2>
      }
    >
      <Head title="Kelola Pengguna" />
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-4">
            <div className="w-1/2 relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              </div>
              <TextInput
                type="text"
                placeholder="Cari nama, email, atau ID pegawai..."
                className="w-full pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <PrimaryButton
              onClick={openAddModal}
              className="flex items-center gap-2"
            >
              <PlusCircleIcon className="w-5 h-5" />
              <span>Tambah User</span>
            </PrimaryButton>
          </div>

          {flash.success && (
            <div
              className="mb-4 p-4 text-sm text-green-800 rounded-lg bg-green-50"
              role="alert"
            >
              {flash.success}
            </div>
          )}

          <div className="bg-white shadow-sm sm:rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Info Pengguna</th>
                  <th className="px-6 py-3">ID Pegawai</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {initialUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div>{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {user.employee?.id_pegawai || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'guru'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 text-gray-400 hover:text-indigo-600"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteUser(user)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal show={isModalOpen} onClose={closeModal}>
        <form onSubmit={submit} className="p-6">
          <h2 className="text-lg font-medium text-gray-900">
            {isEditMode ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {!isEditMode &&
              'Password default akan diatur otomatis berdasarkan role.'}
          </p>
          <div className="mt-6 space-y-4">
            {/* Form Inputs */}
            <div>
              <InputLabel htmlFor="name" value="Nama Lengkap" />
              <TextInput
                id="name"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                className="mt-1 block w-full"
                required
              />
              <InputError message={errors.name} className="mt-2" />
            </div>
            <div>
              <InputLabel htmlFor="email" value="Email" />
              <TextInput
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                className="mt-1 block w-full"
                required
              />
              <InputError message={errors.email} className="mt-2" />
            </div>
            <div>
              <InputLabel htmlFor="id_pegawai" value="ID Pegawai" />
              <TextInput
                id="id_pegawai"
                value={data.id_pegawai}
                onChange={(e) => setData('id_pegawai', e.target.value)}
                className="mt-1 block w-full"
                required
              />
              <InputError message={errors.id_pegawai} className="mt-2" />
            </div>

            {isEditMode && (
              <div>
                <InputLabel htmlFor="role" value="Role" />
                <select
                  id="role"
                  value={data.role}
                  onChange={(e) => setData('role', e.target.value)}
                  className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                >
                  <option value="guru">Guru</option>
                  <option value="koordinator">Koordinator</option>
                </select>
                <InputError message={errors.role} className="mt-2" />
              </div>
            )}

            {!isEditMode && (
              <div>
                <InputLabel htmlFor="role" value="Role" />
                <select
                  id="role"
                  value={data.role}
                  onChange={(e) => setData('role', e.target.value)}
                  className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                >
                  <option value="guru">Guru</option>
                  <option value="koordinator">Koordinator</option>
                </select>
                <InputError message={errors.role} className="mt-2" />
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end">
            <SecondaryButton type="button" onClick={closeModal}>
              Batal
            </SecondaryButton>
            <PrimaryButton className="ms-3" disabled={processing}>
              Simpan
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </AuthenticatedLayout>
  );
}
