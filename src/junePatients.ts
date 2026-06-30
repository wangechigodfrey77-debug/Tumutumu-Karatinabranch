export interface RawRow {
  no: number;
  opNumber: string;
  name: string;
  age: number;
  ageUnit: 'Years' | 'Months';
  gender: 'Male' | 'Female' | 'Other';
  diagnosis: string;
  date: string;
  timeRegistered: string;
  timeSeen: string;
  seenBy: string;
}

export const junePatients: RawRow[] = [
  { no: 1, opNumber: "OP002774/26", name: "Alpha Wanjohi Kirethi", age: 6, ageUnit: "Years", gender: "Male", diagnosis: "Diarrhea And Gastroenteritis Of Presumed Infectious Origin", date: "2026-06-01", timeRegistered: "07:57:51", timeSeen: "08:33:35", seenBy: "jimmwangi" },
  { no: 2, opNumber: "OP016978/25", name: "Eunice Muthoni Macharia", age: 86, ageUnit: "Years", gender: "Female", diagnosis: "Essential (Primary) Hypertension", date: "2026-06-01", timeRegistered: "08:52:05", timeSeen: "09:53:53", seenBy: "jimmwangi" },
  { no: 3, opNumber: "OP002776/26", name: "Peter Nderitu Kibii", age: 59, ageUnit: "Years", gender: "Male", diagnosis: "Ulcer Of Penis", date: "2026-06-01", timeRegistered: "09:44:01", timeSeen: "10:03:40", seenBy: "jimmwangi" },
  { no: 4, opNumber: "OP000742/23", name: "Bernad Mwangi Muteithia", age: 85, ageUnit: "Years", gender: "Male", diagnosis: "Ankylosing Spondylitis", date: "2026-06-01", timeRegistered: "10:41:20", timeSeen: "11:05:49", seenBy: "jimmwangi" },
  { no: 5, opNumber: "OP002779/26", name: "Jayden Gerald Kiragu", age: 7, ageUnit: "Months", gender: "Male", diagnosis: "Other Bacterial Pneumonia", date: "2026-06-01", timeRegistered: "11:24:12", timeSeen: "11:45:22", seenBy: "jimmwangi" },
  { no: 6, opNumber: "OP00253839", name: "Nderitu Kagwiri Kaiden", age: 4, ageUnit: "Years", gender: "Male", diagnosis: "Diarrhea And Gastroenteritis Of Presumed Infectious Origin", date: "2026-06-01", timeRegistered: "11:36:43", timeSeen: "11:59:49", seenBy: "jimmwangi" },
  { no: 7, opNumber: "OP019175/25", name: "Justus Mwangi Kihara", age: 78, ageUnit: "Years", gender: "Male", diagnosis: "Mononeuropathy Of Upper Limb, Unspecified", date: "2026-06-01", timeRegistered: "11:54:48", timeSeen: "12:20:28", seenBy: "jimmwangi" },
  { no: 8, opNumber: "OP001760/23", name: "Jane Wangui Mwangi", age: 78, ageUnit: "Years", gender: "Female", diagnosis: "Essential (Primary) Hypertension", date: "2026-06-01", timeRegistered: "12:03:02", timeSeen: "12:25:24", seenBy: "jimmwangi" },
  { no: 9, opNumber: "OP00203371", name: "Irungu Weru Alvin", age: 7, ageUnit: "Years", gender: "Male", diagnosis: "Acute Upper Respiratory Infection, Unspecified", date: "2026-06-01", timeRegistered: "12:42:29", timeSeen: "13:36:51", seenBy: "jimmwangi" },
  { no: 10, opNumber: "OP00200678", name: "Nyaguthii Ccc Faith", age: 46, ageUnit: "Years", gender: "Male", diagnosis: "-", date: "2026-06-01", timeRegistered: "13:28:20", timeSeen: "", seenBy: "" },
  { no: 11, opNumber: "OP002783/26", name: "Beatrice Murugi Mwangi", age: 50, ageUnit: "Years", gender: "Female", diagnosis: "-", date: "2026-06-01", timeRegistered: "15:07:37", timeSeen: "15:24:56", seenBy: "jimmwangi" },
  { no: 12, opNumber: "OP002786/26", name: "Christine Muthoni Muchiri", age: 42, ageUnit: "Years", gender: "Male", diagnosis: "-", date: "2026-06-01", timeRegistered: "16:02:13", timeSeen: "", seenBy: "" },
  { no: 13, opNumber: "OP002795/26", name: "George Wangombe Maina", age: 14, ageUnit: "Years", gender: "Male", diagnosis: "Upper Respiratory Tract, Part Unspecified", date: "2026-06-02", timeRegistered: "09:51:25", timeSeen: "10:01:50", seenBy: "eunah" },
  { no: 14, opNumber: "OP002801/26", name: "Eunice Waithera Muthui", age: 74, ageUnit: "Years", gender: "Female", diagnosis: "Malignant Neoplasm Of Breast", date: "2026-06-02", timeRegistered: "10:53:25", timeSeen: "11:43:19", seenBy: "jkariithi" },
  { no: 15, opNumber: "OP002802/26", name: "Alice Wanjiku Muthee", age: 51, ageUnit: "Years", gender: "Female", diagnosis: "-", date: "2026-06-02", timeRegistered: "11:09:00", timeSeen: "", seenBy: "" },
  { no: 16, opNumber: "OP017820/25", name: "Purity Munene Ngima", age: 57, ageUnit: "Years", gender: "Female", diagnosis: "Other Acute Gastritis", date: "2026-06-02", timeRegistered: "13:32:51", timeSeen: "13:03:26", seenBy: "eunah" },
  { no: 17, opNumber: "OP000103/26", name: "Adline Mercy Egwa", age: 24, ageUnit: "Years", gender: "Female", diagnosis: "Other Migraine", date: "2026-06-02", timeRegistered: "13:57:04", timeSeen: "14:23:47", seenBy: "polly" },
  { no: 18, opNumber: "OP016598/25", name: "Robert Wachira Weru", age: 77, ageUnit: "Years", gender: "Male", diagnosis: "Urinary Tract Infection, Site Not Specified", date: "2026-06-02", timeRegistered: "14:35:52", timeSeen: "15:24:47", seenBy: "polly" },
  { no: 19, opNumber: "OP00021997", name: "Wang,Ombe Epantus Maina", age: 64, ageUnit: "Years", gender: "Female", diagnosis: "-", date: "2026-06-02", timeRegistered: "15:37:26", timeSeen: "", seenBy: "" },
  { no: 20, opNumber: "OP00199716", name: "Ngure Wambura Esther", age: 70, ageUnit: "Years", gender: "Female", diagnosis: "Other Acute Gastritis", date: "2026-06-03", timeRegistered: "08:10:16", timeSeen: "08:24:25", seenBy: "jimmwangi" },
  { no: 21, opNumber: "OP012296/25", name: "Joyce Njoki Wachira", age: 49, ageUnit: "Years", gender: "Female", diagnosis: "-", date: "2026-06-03", timeRegistered: "08:33:27", timeSeen: "", seenBy: "" },
  { no: 22, opNumber: "OP00148065", name: "Jecinta Wangechi Ngirigacha", age: 80, ageUnit: "Years", gender: "Female", diagnosis: "Essential (Primary) Hypertension", date: "2026-06-03", timeRegistered: "10:02:31", timeSeen: "10:25:48", seenBy: "jimmwangi" },
  { no: 23, opNumber: "OP002815/26", name: "Grace Nyambura Karugu", age: 14, ageUnit: "Years", gender: "Female", diagnosis: "Other Bacterial Pneumonia", date: "2026-06-03", timeRegistered: "10:03:49", timeSeen: "10:41:17", seenBy: "jimmwangi" },
  { no: 24, opNumber: "OP011983/25", name: "Melissa Muthoni Wambura", age: 1, ageUnit: "Years", gender: "Female", diagnosis: "Pneumonia, Organism Unspecified", date: "2026-06-03", timeRegistered: "10:11:14", timeSeen: "10:52:35", seenBy: "jimmwangi" },
  { no: 25, opNumber: "OP00241524", name: "Mwatha Muriuki Peter", age: 31, ageUnit: "Years", gender: "Male", diagnosis: "Unspecified Acute Lower Respiratory Infection", date: "2026-06-03", timeRegistered: "12:16:00", timeSeen: "12:42:25", seenBy: "jimmwangi" },
  { no: 26, opNumber: "OP001840/26", name: "Phineas Karugu Muriuki", age: 2, ageUnit: "Months", gender: "Male", diagnosis: "Pneumonia In Other Diseases Classified Elsewhere", date: "2026-06-03", timeRegistered: "12:17:00", timeSeen: "12:36:49", seenBy: "jimmwangi" },
  { no: 27, opNumber: "OP002822/26", name: "Zipporah Wambui Njoroge", age: 27, ageUnit: "Years", gender: "Female", diagnosis: "Superficial Injuries Involving Head With Neck", date: "2026-06-03", timeRegistered: "12:18:00", timeSeen: "13:17:46", seenBy: "jimmwangi" },
  { no: 28, opNumber: "OP002826/26", name: "Lucy Wamaitha Maganjo", age: 29, ageUnit: "Years", gender: "Female", diagnosis: "Spondylolisthesis", date: "2026-06-03", timeRegistered: "13:06:13", timeSeen: "15:11:19", seenBy: "jimmwangi" },
  { no: 29, opNumber: "OP00023402", name: "Nungo Muriuki Joseph", age: 58, ageUnit: "Years", gender: "Female", diagnosis: "Other Bacterial Pneumonia", date: "2026-06-03", timeRegistered: "15:03:22", timeSeen: "15:28:45", seenBy: "jimmwangi" },
  { no: 30, opNumber: "OP00142271", name: "Maina Wangechi Alice", age: 56, ageUnit: "Years", gender: "Male", diagnosis: "Amebiasis", date: "2026-06-03", timeRegistered: "15:50:06", timeSeen: "16:30:08", seenBy: "jimmwangi" },
];
