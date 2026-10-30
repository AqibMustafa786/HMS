export interface PatientListItem {
  id: string;
  name: string;
  age: number;
  sex: string;
  initials: string;
  phone: string;
  doctor: string;
  lastVisit: string;
  status: string;
  color: string;
}

export interface DoctorListItem {
  id: number;
  name: string;
  specialty: string;
  initials: string;
  rating: string;
  patients: number;
  fee: string;
  seats: number;
  shift: string;
  status: string;
  color: string;
}

export const patients: PatientListItem[] = [];
export const doctors: DoctorListItem[] = [];
