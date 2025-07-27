import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ForgotPassword({ status }: { status?: string }) {
  const { data, setData, post, processing, errors } = useForm({
    email: '',
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post(route('password.email'));
  };

  return (
    <GuestLayout>
      <Head title="Lupa Password" />

      <div className="mb-4 text-sm text-gray-600">
        Lupa password Anda? Tidak masalah. Masukkan alamat email Anda dan kami
        akan mengirimkan notifikasi ke Superadmin untuk mereset password Anda.
      </div>

      {status && (
        <div className="mb-4 text-sm font-medium text-green-600">{status}</div>
      )}

      <form onSubmit={submit}>
        <TextInput
          id="email"
          type="email"
          name="email"
          value={data.email}
          className="mt-1 block w-full"
          isFocused={true}
          onChange={(e) => setData('email', e.target.value)}
        />
        <InputError message={errors.email} className="mt-2" />
        <div className="mt-4 flex items-center justify-between">
          <Link
            href={route('login')}
            className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none"
          >
            Kembali ke Login
          </Link>
          <PrimaryButton className="ms-4" disabled={processing}>
            Kirim Permintaan Reset
          </PrimaryButton>
        </div>
      </form>
    </GuestLayout>
  );
}
