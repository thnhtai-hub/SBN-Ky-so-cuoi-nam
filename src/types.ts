export type Role = 'teacher' | 'principal' | 'clerk';

export type TabType = 'initialization' | 'input' | 'signature' | 'view';

export type SigningStatus = 
  | 'pending_create' 
  | 'created' 
  | 'signed_teacher' 
  | 'signed_principal' 
  | 'signed_clerk';

export interface Student {
  id: string;
  stt: number;
  studentId: string;
  name: string;
  group: string;
  className: string;
  bookId: string | null;
  status: SigningStatus;
}
