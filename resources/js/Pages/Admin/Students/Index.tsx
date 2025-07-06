import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { PageProps } from "@/types";
import { FormEventHandler, useEffect, useState, useMemo } from "react";
import axios from "axios";
import Modal from "@/Components/Modal";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import DangerButton from "@/Components/DangerButton";

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
}
interface ValidationErrors {
    nisn?: string[];
    nama_lengkap?: string[];
    school_class_id?: string[];
}

export default function Index({ auth }: PageProps) {
    const [students, setStudents] = useState<Student[]>([]);
    const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentStudent, setCurrentStudent] = useState<Student | null>(null);

    const [formData, setFormData] = useState({
        nisn: "",
        nama_lengkap: "",
        school_class_id: "",
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});

    const [selectedLevel, setSelectedLevel] = useState<string>("");
    const [filteredClasses, setFilteredClasses] = useState<SchoolClass[]>([]);

    const uniqueLevels = useMemo(() => {
        const levels = schoolClasses.map((sc) => sc.level);
        return [...new Set(levels)].sort((a, b) => a - b);
    }, [schoolClasses]);

    const fetchStudents = () => {
        axios
            .get(route("admin.api.students.index"))
            .then((response) => setStudents(response.data));
    };

    useEffect(() => {
        fetchStudents();
        axios
            .get(route("admin.api.all-school-classes"))
            .then((response) => setSchoolClasses(response.data));
    }, []);

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
        if (level) {
            setFilteredClasses(
                schoolClasses.filter((sc) => sc.level.toString() === level)
            );
        } else {
            setFilteredClasses([]);
        }
        setFormData((prev) => ({ ...prev, school_class_id: "" }));
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const openAddModal = () => {
        setIsEditMode(false);
        setFormData({ nisn: "", nama_lengkap: "", school_class_id: "" });
        setSelectedLevel("");
        setFilteredClasses([]);
        setIsModalOpen(true);
    };

    const openEditModal = (student: Student) => {
        setIsEditMode(true);
        setCurrentStudent(student);
        setFormData({
            nisn: student.nisn,
            nama_lengkap: student.nama_lengkap,
            school_class_id: student.school_class?.id.toString() || "",
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
            ? route("admin.api.students.update", currentStudent?.id)
            : route("admin.api.students.store");
        const method = isEditMode ? "put" : "post";

        axios({ method, url, data: formData })
            .then(() => {
                closeModal();
                fetchStudents();
            })
            .catch((error) => {
                if (error.response?.status === 422) {
                    setErrors(error.response.data.errors);
                }
            })
            .finally(() => setProcessing(false));
    };

    // --- FUNGSI BARU UNTUK HAPUS ---
    const deleteStudent = (student: Student) => {
        if (
            !window.confirm(
                `Yakin ingin menghapus siswa ${student.nama_lengkap}?`
            )
        ) {
            return;
        }
        axios
            .delete(route("admin.api.students.destroy", student.id))
            .then(() => fetchStudents());
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
                    <div className="flex justify-end mb-4">
                        <PrimaryButton onClick={openAddModal}>
                            Tambah Siswa
                        </PrimaryButton>
                    </div>
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <table className="w-full whitespace-nowrap">
                                <thead>
                                    <tr className="text-left font-bold">
                                        <th className="pb-4 pt-6 px-6">NISN</th>
                                        <th className="pb-4 pt-6 px-6">
                                            Nama Lengkap
                                        </th>
                                        <th className="pb-4 pt-6 px-6">
                                            Kelas
                                        </th>
                                        <th className="pb-4 pt-6 px-6">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student) => (
                                        <tr
                                            key={student.id}
                                            className="hover:bg-gray-100 focus-within:bg-gray-100"
                                        >
                                            <td className="border-t items-center px-6 py-4">
                                                {student.nisn}
                                            </td>
                                            <td className="border-t items-center px-6 py-4">
                                                {student.nama_lengkap}
                                            </td>
                                            <td className="border-t items-center px-6 py-4">
                                                {student.school_class
                                                    ? `${student.school_class.level} ${student.school_class.nama_kelas}`
                                                    : "N/A"}
                                            </td>
                                            <td className="border-t items-center px-6 py-4">
                                                <PrimaryButton
                                                    onClick={() =>
                                                        openEditModal(student)
                                                    }
                                                >
                                                    Edit
                                                </PrimaryButton>
                                                <DangerButton
                                                    className="ms-2"
                                                    onClick={() =>
                                                        deleteStudent(student)
                                                    }
                                                >
                                                    Hapus
                                                </DangerButton>
                                            </td>
                                        </tr>
                                    ))}
                                    {students.length === 0 && (
                                        <tr>
                                            <td
                                                className="px-6 py-4 border-t"
                                                colSpan={4}
                                            >
                                                Tidak ada data siswa.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={isModalOpen} onClose={closeModal}>
                {/* ... Form modal tidak ada perubahan ... */}
                <form onSubmit={submit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        {isEditMode ? "Edit Siswa" : "Tambah Siswa Baru"}
                    </h2>
                    <div className="mt-6">
                        <InputLabel htmlFor="nisn" value="NISN" />
                        <TextInput
                            id="nisn"
                            name="nisn"
                            value={formData.nisn}
                            className="mt-1 block w-full"
                            onChange={handleInputChange}
                            required
                        />
                        <InputError
                            message={errors.nisn?.[0]}
                            className="mt-2"
                        />
                    </div>
                    <div className="mt-4">
                        <InputLabel
                            htmlFor="nama_lengkap"
                            value="Nama Lengkap"
                        />
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
                    <div className="mt-4">
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
                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal}>
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
