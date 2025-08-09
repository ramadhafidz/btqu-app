export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string;
  role: 'koordinator' | 'guru' | 'superadmin';
}

export interface SchoolClass {
  id: number;
  level: number;
  nama_kelas: string;
}

export interface Teacher {
  id: number;
  id_pegawai: string;
  user: User;
}

export interface StudentProgress {
  id: number;
  jilid: number;
  halaman: number;
  status_kenaikan: string;
  hafalan_juz_id: number | null;
  hafalan_surah_id: number | null;
  hafalan_ayat: string | null;
}

// Tipe data baru yang kemarin kurang
export interface Juz {
  id: number;
  juz_number: number;
}
export interface Surah {
  id: number;
  surah_number: number;
  name_latin: string;
}

export interface Student {
  id: number;
  nisn: string;
  nama_lengkap: string;
  school_class: SchoolClass | null;
  progress: StudentProgress | null;
}

export interface BtqGroup {
  id: number;
  level: number;
  teacher: Teacher | null;
  students: Student[];
}

export interface StudentPromotionReviewLogItem {
  id: number;
  student: { id: number; nama_lengkap: string } | null;
  jilid: number | null;
  decision: 'approved' | 'rejected' | string;
  reviewed_at: string | null;
  reviewer: { id: number; name: string } | null;
  note: string | null;
}

export interface StudentPromotionReviewLogItem {
  id: number;
  student: { id: number; nama_lengkap: string } | null;
  jilid: number | null;
  decision: 'approved' | 'rejected' | string;
  reviewed_at: string | null;
  reviewer: { id: number; name: string } | null;
  note: string | null;
}

export type PageProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
  auth: {
    user: User;
  };
};
