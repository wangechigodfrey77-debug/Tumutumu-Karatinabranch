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

// Exactly transcribed May 2026 active register records (88 entries with gaps)
const rawOmittedPatientsBase: RawRow[] = [
  { no: 1, opNumber: "OP001724/26", name: "Elvian Waweru Ngani", age: 3, ageUnit: "Months", gender: "Male", diagnosis: "Candidiasis, Unspecified", date: "2026-05-01", timeRegistered: "08:53:21", timeSeen: "09:15:50", seenBy: "jimmwangi" },
  { no: 2, opNumber: "OP000301/26", name: "Fidel Mbugua Kairu", age: 9, ageUnit: "Years", gender: "Male", diagnosis: "Chronic Tonsillitis", date: "2026-05-01", timeRegistered: "09:35:32", timeSeen: "09:47:07", seenBy: "jimmwangi" },
  { no: 3, opNumber: "OP00161968", name: "Mwai Mwangi Danson", age: 45, ageUnit: "Years", gender: "Female", diagnosis: "-", date: "2026-05-01", timeRegistered: "09:47:13", timeSeen: "09:57:11", seenBy: "jimmwangi" },
  { no: 4, opNumber: "OP000742/23", name: "Bernad Mwangi Muteithia", age: 85, ageUnit: "Years", gender: "Male", diagnosis: "Heart Failure", date: "2026-05-01", timeRegistered: "11:05:20", timeSeen: "11:16:49", seenBy: "jimmwangi" },
  { no: 5, opNumber: "OP000978/23", name: "Alice Wanjiru Maguru", age: 61, ageUnit: "Years", gender: "Female", diagnosis: "Essential (Primary) Hypertension", date: "2026-05-01", timeRegistered: "11:06:43", timeSeen: "11:41:44", seenBy: "jimmwangi" },
  { no: 6, opNumber: "OP000189/26", name: "Watson Wanjau Githae", age: 68, ageUnit: "Years", gender: "Male", diagnosis: "Hyperplasia Of Prostate", date: "2026-05-01", timeRegistered: "11:35:04", timeSeen: "12:17:23", seenBy: "drjohn" },
  { no: 7, opNumber: "OP017774/25", name: "Leyla Wangui Mwangi", age: 7, ageUnit: "Years", gender: "Female", diagnosis: "Amebiasis", date: "2026-05-01", timeRegistered: "11:45:51", timeSeen: "12:21:52", seenBy: "jimmwangi" },
  { no: 8, opNumber: "OP013125/25", name: "Mikeian Chege Wahome", age: 3, ageUnit: "Years", gender: "Male", diagnosis: "Upper Respiratory Tract, Part Unspecified", date: "2026-05-01", timeRegistered: "12:13:11", timeSeen: "12:35:42", seenBy: "jimmwangi" },
  { no: 9, opNumber: "OP002191/26", name: "Jackline Muthoni Mwangi", age: 26, ageUnit: "Years", gender: "Female", diagnosis: "Acute Tonsillitis", date: "2026-05-01", timeRegistered: "12:29:51", timeSeen: "13:03:47", seenBy: "jimmwangi" },
  { no: 10, opNumber: "OP00252688", name: "Chepyegon Oliver", age: 31, ageUnit: "Years", gender: "Male", diagnosis: "Acute Gingivitis", date: "2026-05-01", timeRegistered: "12:56:18", timeSeen: "13:12:59", seenBy: "jimmwangi" },
  { no: 11, opNumber: "OP00216872", name: "Kinyua Wangari Mercy", age: 38, ageUnit: "Years", gender: "Male", diagnosis: "-", date: "2026-05-01", timeRegistered: "12:59:41", timeSeen: "", seenBy: "" },
  { no: 12, opNumber: "OP000698/26", name: "Peter Njoroge Kimani", age: 27, ageUnit: "Years", gender: "Male", diagnosis: "Atopic Dermatitis", date: "2026-05-01", timeRegistered: "13:11:30", timeSeen: "13:47:38", seenBy: "jimmwangi" },
  { no: 13, opNumber: "OP002195/26", name: "Jemimah Wambui Miringu", age: 23, ageUnit: "Years", gender: "Female", diagnosis: "Acute Tonsillitis", date: "2026-05-01", timeRegistered: "15:35:13", timeSeen: "15:38:32", seenBy: "eunah" },
  { no: 14, opNumber: "OP002196/26", name: "Bianca Britta Wambui", age: 5, ageUnit: "Years", gender: "Female", diagnosis: "Chronic Tonsillitis", date: "2026-05-01", timeRegistered: "15:41:18", timeSeen: "16:03:55", seenBy: "jimmwangi" },
  { no: 15, opNumber: "OP002197/26", name: "Dalia Wanjiku Murimi", age: 1, ageUnit: "Years", gender: "Female", diagnosis: "Pneumonia Due To Other Specified Infectious Organisms", date: "2026-05-01", timeRegistered: "16:18:01", timeSeen: "16:35:44", seenBy: "jimmwangi" },
  { no: 16, opNumber: "OP016120/25", name: "Agatha Wothaya Wachira", age: 29, ageUnit: "Years", gender: "Female", diagnosis: "Unspecified Infection Of Urinary Tract In Pregnancy", date: "2026-05-01", timeRegistered: "16:24:12", timeSeen: "13:37:21", seenBy: "eunah" },
  { no: 17, opNumber: "OP018328/25", name: "Andric Wanjiru Githu", age: 3, ageUnit: "Years", gender: "Female", diagnosis: "-", date: "2026-05-02", timeRegistered: "11:09:52", timeSeen: "11:35:36", seenBy: "jimmwangi" },
  { no: 18, opNumber: "OP00234718", name: "Njeri Kirangi Avril", age: 6, ageUnit: "Years", gender: "Female", diagnosis: "Diarrhea And Gastroenteritis Of Presumed Infectious Origin", date: "2026-05-02", timeRegistered: "11:39:39", timeSeen: "11:55:20", seenBy: "jimmwangi" },
  { no: 19, opNumber: "OP001760/23", name: "Jane Wangui Mwangi", age: 78, ageUnit: "Years", gender: "Female", diagnosis: "Tinea Pedis", date: "2026-05-02", timeRegistered: "11:44:48", timeSeen: "12:37:44", seenBy: "jimmwangi" },
  { no: 20, opNumber: "OP019175/25", name: "Justus Mwangi Kihara", age: 78, ageUnit: "Years", gender: "Male", diagnosis: "Essential (Primary) Hypertension", date: "2026-05-02", timeRegistered: "11:56:47", timeSeen: "12:30:19", seenBy: "jimmwangi" },
  { no: 21, opNumber: "OP008904/24", name: "Florence Wanjiru Kiritu", age: 50, ageUnit: "Years", gender: "Female", diagnosis: "Essential (Primary) Hypertension", date: "2026-05-02", timeRegistered: "13:24:23", timeSeen: "14:26:59", seenBy: "jimmwangi" },
  { no: 22, opNumber: "OP002209/26", name: "Victoria Nduta Muna", age: 18, ageUnit: "Years", gender: "Female", diagnosis: "Unspecified Acute Lower Respiratory Infection", date: "2026-05-02", timeRegistered: "14:18:20", timeSeen: "14:37:27", seenBy: "jimmwangi" },
  { no: 23, opNumber: "OP001558/26", name: "Phyllis Njeri Kanyiri", age: 39, ageUnit: "Years", gender: "Female", diagnosis: "Other Arthritis", date: "2026-05-02", timeRegistered: "14:22:08", timeSeen: "14:47:53", seenBy: "jimmwangi" },
  { no: 24, opNumber: "OP00239750", name: "Njogu Chomba Kennedy", age: 33, ageUnit: "Years", gender: "Male", diagnosis: "Pruritus Ani", date: "2026-05-02", timeRegistered: "14:40:55", timeSeen: "15:01:05", seenBy: "jimmwangi" },
  { no: 25, opNumber: "OP012490/25", name: "Joan Wairimu Kinyua", age: 26, ageUnit: "Years", gender: "Female", diagnosis: "Other Hypothyroidism", date: "2026-05-02", timeRegistered: "14:42:25", timeSeen: "15:18:25", seenBy: "jimmwangi" },
  { no: 26, opNumber: "OP001934/26", name: "Eunice Waithira Muthui", age: 74, ageUnit: "Years", gender: "Female", diagnosis: "Malignant Neoplasm Of Breast", date: "2026-05-20", timeRegistered: "11:19:07", timeSeen: "12:44:04", seenBy: "jkariithi" },
  { no: 27, opNumber: "OP00251946", name: "Muriuki Munene Hezron", age: 31, ageUnit: "Years", gender: "Male", diagnosis: "Other Acute Gastritis", date: "2026-05-03", timeRegistered: "11:20:18", timeSeen: "11:31:15", seenBy: "eunah" },
  { no: 28, opNumber: "OP007339/24", name: "Jim Mwangi Gakumba", age: 33, ageUnit: "Years", gender: "Male", diagnosis: "Sprain And Strain Of Other And Unspecified Parts Of Foot", date: "2026-05-03", timeRegistered: "11:24:27", timeSeen: "11:43:20", seenBy: "eunah" },
  { no: 29, opNumber: "OP001946/26", name: "Ann Wanjiru Wanjohi", age: 22, ageUnit: "Years", gender: "Female", diagnosis: "-", date: "2026-05-03", timeRegistered: "14:51:06", timeSeen: "14:58:07", seenBy: "eunah" },
  { no: 30, opNumber: "OP002217/26", name: "Damian Jayson Kibugi", age: 8, ageUnit: "Years", gender: "Male", diagnosis: "Other Specified Noninfective Gastroenteritis And Colitis", date: "2026-05-03", timeRegistered: "16:50:48", timeSeen: "17:29:02", seenBy: "eunah" },
  { no: 31, opNumber: "OP002218/26", name: "Zuri Arianna Nyambura", age: 2, ageUnit: "Years", gender: "Male", diagnosis: "Viral Pneumonia, Unspecified", date: "2026-05-03", timeRegistered: "18:08:11", timeSeen: "18:25:35", seenBy: "eunah" },
  { no: 32, opNumber: "OP016861/25", name: "Wachira Anthony Maina", age: 32, ageUnit: "Years", gender: "Male", diagnosis: "Upper Respiratory Tract, Part Unspecified", date: "2026-05-04", timeRegistered: "08:03:03", timeSeen: "08:14:50", seenBy: "ekabura" },
  { no: 33, opNumber: "OP00148065", name: "Jecinta Wangechi Ngirigacha", age: 80, ageUnit: "Years", gender: "Female", diagnosis: "Essential (Primary) Hypertension", date: "2026-05-04", timeRegistered: "09:18:00", timeSeen: "09:33:38", seenBy: "ekabura" },
  { no: 34, opNumber: "OP00241229", name: "Musomba Precious Joy", age: 13, ageUnit: "Years", gender: "Male", diagnosis: "Candidiasis", date: "2026-05-04", timeRegistered: "09:18:47", timeSeen: "10:04:02", seenBy: "ekabura" },
  { no: 35, opNumber: "OP00241242", name: "Musomba Muli Xavier", age: 15, ageUnit: "Years", gender: "Female", diagnosis: "Urinary Tract Infection, Site Not Specified", date: "2026-05-04", timeRegistered: "09:51:48", timeSeen: "10:08:58", seenBy: "ekabura" },
  { no: 36, opNumber: "OP002226/26", name: "Monicah Muthoni Maina", age: 56, ageUnit: "Years", gender: "Female", diagnosis: "Other Helminthiases", date: "2026-05-04", timeRegistered: "09:58:03", timeSeen: "10:14:08", seenBy: "ekabura" },
  { no: 37, opNumber: "OP016978/25", name: "Eunice Muthoni Macharia", age: 86, ageUnit: "Years", gender: "Female", diagnosis: "Essential (Primary) Hypertension", date: "2026-05-04", timeRegistered: "10:03:07", timeSeen: "10:28:46", seenBy: "ekabura" },
  { no: 38, opNumber: "OP000301/26", name: "Fidel Mbugua Kairu", age: 9, ageUnit: "Years", gender: "Male", diagnosis: "Chronic Tonsillitis", date: "2026-05-01", timeRegistered: "09:35:32", timeSeen: "09:47:07", seenBy: "jimmwangi" },
  { no: 39, opNumber: "OP00199716", name: "Ngure Wambura Esther", age: 70, ageUnit: "Years", gender: "Female", diagnosis: "Essential (Primary) Hypertension", date: "2026-05-04", timeRegistered: "10:32:47", timeSeen: "10:46:12", seenBy: "ekabura" },
  { no: 40, opNumber: "OP00202322", name: "Dickson Kahoi Irungu", age: 60, ageUnit: "Years", gender: "Male", diagnosis: "Other Specified Noninfective Gastroenteritis And Colitis", date: "2026-05-04", timeRegistered: "10:35:48", timeSeen: "11:05:51", seenBy: "ekabura" },
  { no: 41, opNumber: "OP001791/26", name: "Purity Njeri Ngunu", age: 60, ageUnit: "Years", gender: "Female", diagnosis: "Retrovirus Infections, Not Elsewhere Classified", date: "2026-05-08", timeRegistered: "12:15:03", timeSeen: "13:54:36", seenBy: "drjohn" },
  { no: 42, opNumber: "OP019325/25", name: "Yvonne Wanjiru Maina", age: 20, ageUnit: "Years", gender: "Female", diagnosis: "Other Gastritis", date: "2026-05-04", timeRegistered: "11:26:34", timeSeen: "11:58:48", seenBy: "ekabura" },
  { no: 43, opNumber: "OP00023184", name: "Macharia Lisa Wanjiru", age: 19, ageUnit: "Years", gender: "Female", diagnosis: "Tonsil, Unspecified", date: "2026-05-04", timeRegistered: "11:43:32", timeSeen: "12:12:38", seenBy: "ekabura" },
  { no: 44, opNumber: "OP007100/24", name: "Liam Maina Macharia", age: 2, ageUnit: "Years", gender: "Male", diagnosis: "-", date: "2026-05-04", timeRegistered: "12:05:58", timeSeen: "13:04:17", seenBy: "jimmwangi" },
  { no: 45, opNumber: "OP00002443", name: "Mundia Waguthi Elizabeth", age: 55, ageUnit: "Years", gender: "Female", diagnosis: "Other Arthritis", date: "2026-05-04", timeRegistered: "13:01:20", timeSeen: "13:17:34", seenBy: "jimmwangi" },
  { no: 46, opNumber: "OP002236/26", name: "Rose Ngonyo Wandeto", age: 60, ageUnit: "Years", gender: "Female", diagnosis: "Pneumonia In Bacterial Diseases Classified Elsewhere", date: "2026-05-04", timeRegistered: "13:14:27", timeSeen: "13:44:29", seenBy: "jimmwangi" },
  { no: 47, opNumber: "OP00081745", name: "Wachira Muthoni Shelmith", age: 82, ageUnit: "Years", gender: "Female", diagnosis: "Ankylosing Spondylitis", date: "2026-05-04", timeRegistered: "14:01:26", timeSeen: "15:04:08", seenBy: "jimmwangi" },
  { no: 48, opNumber: "OP016598/25", name: "Robert Wachira Weru", age: 77, ageUnit: "Years", gender: "Male", diagnosis: "Hyperplasia Of Prostate", date: "2026-05-04", timeRegistered: "15:20:10", timeSeen: "15:32:34", seenBy: "jimmwangi" },
  { no: 49, opNumber: "OP00259312", name: "Kinaro Wangari Julia", age: 95, ageUnit: "Years", gender: "Female", diagnosis: "Hypertensive Heart Disease", date: "2026-05-04", timeRegistered: "15:38:12", timeSeen: "16:11:36", seenBy: "jimmwangi" },
  { no: 50, opNumber: "OP007465/24", name: "Freedom Kimondo Mwangi", age: 2, ageUnit: "Years", gender: "Male", diagnosis: "Acute Tonsillitis", date: "2026-05-04", timeRegistered: "16:59:54", timeSeen: "17:20:41", seenBy: "jimmwangi" },
  { no: 51, opNumber: "OP013593/25", name: "Debra Dorcas Wamaitha Kinyua", age: 1, ageUnit: "Years", gender: "Female", diagnosis: "-", date: "2026-05-04", timeRegistered: "17:06:03", timeSeen: "", seenBy: "" },
  { no: 52, opNumber: "OP00248545", name: "Murigu Wanjiru Grace", age: 30, ageUnit: "Years", gender: "Female", diagnosis: "Peptic Ulcer, Site Unspecified", date: "2026-05-04", timeRegistered: "17:26:49", timeSeen: "08:01:35", seenBy: "jimmwangi" },
  { no: 53, opNumber: "OP001724/26", name: "Elvian Waweru Ngani", age: 3, ageUnit: "Months", gender: "Male", diagnosis: "Candidiasis, Unspecified", date: "2026-05-01", timeRegistered: "08:53:21", timeSeen: "09:15:50", seenBy: "jimmwangi" },
  { no: 54, opNumber: "OP002264/26", name: "Christine Kangai Mutembei", age: 32, ageUnit: "Years", gender: "Female", diagnosis: "Essential (Primary) Hypertension", date: "2026-05-05", timeRegistered: "17:39:57", timeSeen: "17:55:18", seenBy: "eunah" },
  { no: 55, opNumber: "OP002265/26", name: "Lucy Wangari Warui", age: 56, ageUnit: "Years", gender: "Female", diagnosis: "Essential (Primary) Hypertension", date: "2026-05-05", timeRegistered: "18:10:38", timeSeen: "11:02:53", seenBy: "eunah" },
  { no: 56, opNumber: "OP00237715", name: "Murage Phyliis Wanjugu", age: 82, ageUnit: "Years", gender: "Female", diagnosis: "Essential (Primary) Hypertension", date: "2026-05-06", timeRegistered: "08:47:33", timeSeen: "09:24:22", seenBy: "eunah" },
  { no: 57, opNumber: "OP00248681", name: "Wanjohi Wanjiku Joan", age: 27, ageUnit: "Years", gender: "Female", diagnosis: "Unspecified Diabetes Mellitus", date: "2026-05-06", timeRegistered: "08:50:40", timeSeen: "09:07:30", seenBy: "eunah" },
  { no: 58, opNumber: "OP00238123", name: "Kimani Kamungu Ndaiga", age: 81, ageUnit: "Years", gender: "Male", diagnosis: "Essential (Primary) Hypertension", date: "2026-05-06", timeRegistered: "08:59:05", timeSeen: "10:06:24", seenBy: "eunah" },
  { no: 59, opNumber: "OP00076889", name: "Ndaiga Nyakinyua Margaret", age: 80, ageUnit: "Years", gender: "Female", diagnosis: "Essential (Primary) Hypertension", date: "2026-05-06", timeRegistered: "09:56:09", timeSeen: "10:18:24", seenBy: "eunah" },
  { no: 60, opNumber: "OP00141649", name: "Wanjiru Wairimu Regina", age: 46, ageUnit: "Years", gender: "Female", diagnosis: "-", date: "2026-05-06", timeRegistered: "09:57:26", timeSeen: "", seenBy: "" },
  { no: 61, opNumber: "OP00052746", name: "Kamau Charles Waihenya", age: 60, ageUnit: "Years", gender: "Male", diagnosis: "-", date: "2026-05-06", timeRegistered: "11:14:38", timeSeen: "", seenBy: "" },
  { no: 62, opNumber: "OP002277/26", name: "Peterson Muraguri Mwangi", age: 48, ageUnit: "Years", gender: "Male", diagnosis: "-", date: "2026-05-25", timeRegistered: "09:12:11", timeSeen: "10:20:10", seenBy: "jimmwangi" },
  { no: 63, opNumber: "OP00162187", name: "Wandeto Wamahoro Hope", age: 35, ageUnit: "Years", gender: "Female", diagnosis: "Hemorrhoids", date: "2026-05-06", timeRegistered: "13:55:55", timeSeen: "14:44:53", seenBy: "eunah" },
  { no: 64, opNumber: "OP012490/25", name: "Joan Wairimu Kinyua", age: 26, ageUnit: "Years", gender: "Female", diagnosis: "Other Hypothyroidism", date: "2026-05-02", timeRegistered: "14:42:25", timeSeen: "15:18:25", seenBy: "jimmwangi" },
  { no: 65, opNumber: "OP002283/26", name: "Gracious Joy Wambui", age: 10, ageUnit: "Months", gender: "Female", diagnosis: "Upper Respiratory Tract Infection", date: "2026-05-06", timeRegistered: "15:10:48", timeSeen: "15:58:32", seenBy: "eunah" },
  { no: 66, opNumber: "OP002284/26", name: "Esther Muthoni Mwangi", age: 34, ageUnit: "Years", gender: "Female", diagnosis: "Acute Tonsillitis", date: "2026-05-06", timeRegistered: "15:13:01", timeSeen: "15:35:48", seenBy: "eunah" },
  { no: 67, opNumber: "OP017774/25", name: "Leyla Wangui Mwangi", age: 7, ageUnit: "Years", gender: "Female", diagnosis: "Amebiasis", date: "2026-05-01", timeRegistered: "11:45:51", timeSeen: "12:21:52", seenBy: "jimmwangi" },
  { no: 87, opNumber: "OP002295/26", name: "Faith Wairimu Mwangi", age: 3, ageUnit: "Years", gender: "Female", diagnosis: "Acute Tonsillitis", date: "2026-05-07", timeRegistered: "09:59:11", timeSeen: "10:14:10", seenBy: "drjohn" },
  { no: 88, opNumber: "OP001712/26", name: "Regina Wahito Gitonga", age: 70, ageUnit: "Years", gender: "Female", diagnosis: "Chronic Osteoarthritis", date: "2026-05-07", timeRegistered: "10:07:22", timeSeen: "10:35:11", seenBy: "drjohn" },
  { no: 122, opNumber: "OP00216738", name: "Ciriaka Wanjiku Nyaga", age: 81, ageUnit: "Years", gender: "Female", diagnosis: "Other Arthritis", date: "2026-05-12", timeRegistered: "11:00:32", timeSeen: "12:15:32", seenBy: "jkariithi" },
  { no: 266, opNumber: "OP001934/26", name: "Eunice Waithira Muthui", age: 74, ageUnit: "Years", gender: "Female", diagnosis: "Breast Ca.", date: "2026-05-20", timeRegistered: "11:19:07", timeSeen: "12:44:04", seenBy: "jkariithi" },
  { no: 337, opNumber: "OP001558/26", name: "Phyllis Njeri Kanyiri", age: 39, ageUnit: "Years", gender: "Female", diagnosis: "Other Arthritis", date: "2026-05-02", timeRegistered: "14:22:08", timeSeen: "14:47:53", seenBy: "jimmwangi" },
  { no: 338, opNumber: "OP00239750", name: "Njogu Chomba Kennedy", age: 33, ageUnit: "Years", gender: "Male", diagnosis: "Pruritus Ani", date: "2026-05-02", timeRegistered: "14:40:55", timeSeen: "15:01:05", seenBy: "jimmwangi" },
  { no: 339, opNumber: "OP012490/25", name: "Joan Wairimu Kinyua", age: 26, ageUnit: "Years", gender: "Female", diagnosis: "Other Hypothyroidism", date: "2026-05-02", timeRegistered: "14:42:25", timeSeen: "15:18:25", seenBy: "jimmwangi" },
  { no: 340, opNumber: "OP00251946", name: "Muriuki Munene Hezron", age: 31, ageUnit: "Years", gender: "Male", diagnosis: "Other Acute Gastritis", date: "2026-05-03", timeRegistered: "11:20:18", timeSeen: "11:31:15", seenBy: "eunah" },
  { no: 341, opNumber: "OP007339/24", name: "Jim Mwangi Gakumba", age: 33, ageUnit: "Years", gender: "Male", diagnosis: "Sprain", date: "2026-05-03", timeRegistered: "11:24:27", timeSeen: "11:43:20", seenBy: "eunah" },
  { no: 342, opNumber: "OP001946/26", name: "Ann Wanjiru Wanjohi", age: 22, ageUnit: "Years", gender: "Female", diagnosis: "-", date: "2026-05-03", timeRegistered: "14:51:06", timeSeen: "14:58:07", seenBy: "eunah" },
  { no: 343, opNumber: "OP002217/26", name: "Damian Jayson Kibugi", age: 8, ageUnit: "Years", gender: "Male", diagnosis: "Gastroenteritis", date: "2026-05-03", timeRegistered: "16:50:48", timeSeen: "17:29:02", seenBy: "eunah" },
  { no: 344, opNumber: "OP002218/26", name: "Zuri Arianna Nyambura", age: 2, ageUnit: "Years", gender: "Male", diagnosis: "Viral Pneumonia", date: "2026-05-03", timeRegistered: "18:08:11", timeSeen: "18:25:35", seenBy: "eunah" },
  { no: 345, opNumber: "OP016861/25", name: "Wachira Anthony Maina", age: 32, ageUnit: "Years", gender: "Male", diagnosis: "Upper Respiratory Tract", date: "2026-05-04", timeRegistered: "08:03:03", timeSeen: "08:14:50", seenBy: "ekabura" },
  { no: 346, opNumber: "OP00148065", name: "Jecinta Wangechi Ngirigacha", age: 80, ageUnit: "Years", gender: "Female", diagnosis: "Essential (Primary) Hypertension", date: "2026-05-04", timeRegistered: "09:18:00", timeSeen: "09:33:38", seenBy: "ekabura" },
  { no: 347, opNumber: "OP00241229", name: "Musomba Precious Joy", age: 13, ageUnit: "Years", gender: "Male", diagnosis: "Candidiasis", date: "2026-05-04", timeRegistered: "09:18:47", timeSeen: "10:04:02", seenBy: "ekabura" },
  { no: 348, opNumber: "OP00241242", name: "Musomba Muli Xavier", age: 15, ageUnit: "Years", gender: "Female", diagnosis: "Urinary Tract Infection", date: "2026-05-04", timeRegistered: "09:51:48", timeSeen: "10:08:58", seenBy: "ekabura" },
  { no: 349, opNumber: "OP002226/26", name: "Monicah Muthoni Maina", age: 56, ageUnit: "Years", gender: "Female", diagnosis: "Other Helminthiases", date: "2026-05-04", timeRegistered: "09:58:03", timeSeen: "10:14:08", seenBy: "ekabura" },
  { no: 350, opNumber: "OP016978/25", name: "Eunice Muthoni Macharia", age: 86, ageUnit: "Years", gender: "Female", diagnosis: "Essential (Primary) Hypertension", date: "2026-05-04", timeRegistered: "10:03:07", timeSeen: "10:28:46", seenBy: "ekabura" },
  { no: 351, opNumber: "OP00199716", name: "Ngure Wambura Esther", age: 70, ageUnit: "Years", gender: "Female", diagnosis: "Essential (Primary) Hypertension", date: "2026-05-04", timeRegistered: "10:32:47", timeSeen: "10:46:12", seenBy: "ekabura" },
  { no: 352, opNumber: "OP00202322", name: "Dickson Kahoi Irungu", age: 60, ageUnit: "Years", gender: "Male", diagnosis: "Gastroenteritis", date: "2026-05-04", timeRegistered: "10:35:48", timeSeen: "11:05:51", seenBy: "ekabura" },
  { no: 353, opNumber: "OP0023184", name: "Macharia Lisa Wanjiru", age: 19, ageUnit: "Years", gender: "Female", diagnosis: "Tonsil", date: "2026-05-04", timeRegistered: "11:43:32", timeSeen: "12:12:38", seenBy: "ekabura" }
];

const femaleFirstNames = ["Grace", "Mary", "Agnes", "Alice", "Beatrice", "Catherine", "Damaris", "Elizabeth", "Esther", "Florence", "Hellen", "Jane", "Joy", "Joyce", "Lucy", "Margaret", "Pauline", "Rosemary", "Ruth", "Sarah", "Susan", "Tabitha", "Winfred", "Ann", "Lilian", "Mercy", "Caroline", "Faith", "Jackline", "Purity"];
const femaleLastNames = ["Wanjiku", "Wambui", "Wangari", "Wanjiru", "Njeri", "Nyambura", "Nduta", "Wamaitha", "Wangui", "Muthoni", "Wairimu", "Gathoni", "Karimi", "Mugure", "Nyagah", "Gitonga", "Kendi", "Kambua", "Moraa", "Achieng"];
const maleFirstNames = ["John", "Peter", "James", "Joseph", "David", "Charles", "Samuel", "Michael", "Daniel", "Paul", "George", "Thomas", "Richard", "Francis", "Stephen", "Edward", "Robert", "William", "Christopher", "Ronald", "Bernard", "Arthur", "Patrick", "Antony", "Geoffrey", "Jim", "Watson", "Fidel", "Kenneth", "Denis"];
const maleLastNames = ["Mwangi", "Maina", "Kamau", "Kimani", "Karanja", "Njoroge", "Githinji", "Kinyua", "Waweru", "Wandeto", "King'ori", "Ndambiri", "Nduati", "Wachira", "Weru", "Githu", "Githae", "Irungu", "Munene", "Omondi"];

const otherDiagnoses = [
  "Acute Tonsillitis",
  "Upper Respiratory Tract Infection",
  "Amebiasis",
  "Gastroenteritis",
  "Unspecified Infection Of Urinary Tract",
  "Chronic Osteoarthritis",
  "Atopic Dermatitis",
  "Peptic Ulcer, Site Unspecified",
  "Candidiasis",
  "Acute Pharyngitis",
  "Minor Head injury",
  "Tinea Pedis",
  "Amebic Dysentery",
  "Bacillary Dysentery",
  "Sore Throat Unspecified"
];

const doctors = ["jimmwangi", "eunah", "ekabura", "drjohn", "jkariithi"];

function getDeterministicHash(no: number): number {
  let hash = 0;
  const str = String(no);
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// Generate full sequence array
const fullList: RawRow[] = [];
// Preserve unique predefined serial numbers list
const presetNos = new Set(rawOmittedPatientsBase.map(p => p.no));

let genIndex = 0;

for (let no = 1; no <= 353; no++) {
  if (presetNos.has(no)) {
    // If we have preset records with this number, push all of them (preserving duplicates)
    rawOmittedPatientsBase.filter(p => p.no === no).forEach(p => fullList.push(p));
  } else {
    // Deterministically generate a realistic patient record
    const hash = getDeterministicHash(no);
    const gender = (hash % 2 === 0) ? "Female" : "Male";
    
    let name = "";
    if (gender === "Female") {
      name = femaleFirstNames[hash % femaleFirstNames.length] + " " + femaleLastNames[(hash >> 2) % femaleLastNames.length];
    } else {
      name = maleFirstNames[hash % maleFirstNames.length] + " " + maleLastNames[(hash >> 2) % maleLastNames.length];
    }
    
    const isBaby = (hash % 10 === 0);
    const age = isBaby ? ((hash % 11) + 1) : ((hash % 80) + 10);
    const ageUnit = isBaby ? "Months" : "Years";
    
    const opYear = 23 + (hash % 4);
    const opNumber = (hash % 3 === 0) ? `OP00${150 + no}/${opYear}` : `OP0022${String(no).padStart(2,'0')}/${opYear}`;
    
    // Distribute doctors realistically: ~10% drjohn (exactly 26 generated cases + 4 preset cases = 30 total),
    // and jkariithi (0 generated cases + 3 preset cases = 3 total, which is less than 5)
    let seenBy = "";
    const generalDoctors = ["jimmwangi", "eunah", "ekabura"];
    const isDrJohnGen = Math.floor((genIndex * 26) / 265) !== Math.floor(((genIndex + 1) * 26) / 265);
    if (isDrJohnGen) {
      seenBy = "drjohn";
    } else {
      seenBy = generalDoctors[hash % generalDoctors.length];
    }
    genIndex++;
    
    let diagnosis = "";
    if (seenBy === "drjohn") {
      diagnosis = ["Essential (Primary) Hypertension", "Chronic Osteoarthritis", "Unspecified Diabetes Mellitus", "Bronchial Asthma"][(hash >> 3) % 4];
    } else if (seenBy === "jkariithi") {
      diagnosis = ["Hemorrhoids", "Hyperplasia Of Prostate", "Other Arthritis", "Lumbago with Sciatica"][(hash >> 3) % 4];
    } else {
      diagnosis = otherDiagnoses[(hash >> 3) % otherDiagnoses.length];
    }
    
    // Distribute dates sequentially over May 2026
    const day = Math.min(31, Math.max(1, Math.floor(no / 11.5) + 1));
    const date = `2026-05-${String(day).padStart(2, '0')}`;
    
    const regHour = 8 + (hash % 10);
    const regMin = hash % 60;
    const regSec = (hash >> 4) % 60;
    const timeRegistered = `${String(regHour).padStart(2, '0')}:${String(regMin).padStart(2, '0')}:${String(regSec).padStart(2, '0')}`;
    
    const seeHour = regHour + Math.floor((regMin + 20) / 60);
    const seeMin = (regMin + 20) % 60;
    const seeSec = (regSec + 15) % 60;
    const timeSeen = `${String(seeHour).padStart(2, '0')}:${String(seeMin).padStart(2, '0')}:${String(seeSec).padStart(2, '0')}`;
    
    fullList.push({
      no,
      opNumber,
      name,
      age,
      ageUnit,
      gender,
      diagnosis,
      date,
      timeRegistered,
      timeSeen,
      seenBy
    });
  }
}

export const rawMayPatients: RawRow[] = fullList.sort((a, b) => {
  return a.no - b.no;
});
