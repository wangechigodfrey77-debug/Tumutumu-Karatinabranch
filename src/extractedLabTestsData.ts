export interface ExtractedLabTest {
  id: string;
  opNo: string;
  name: string;
  labNo: string;
  testName: string;
  result: string;
  date: string;
  performedBy: string;
  fee: number;
}

export const rawLabTests: ExtractedLabTest[] = [
  {
    id: "LB-095654",
    opNo: "OP000301/26",
    name: "Fidel Mbugua Kairu",
    labNo: "095654",
    testName: "KRT Stool O/C",
    result: "Consistency: Loose,Non Mucoid Stool; Microscopy: No O/C Seen",
    date: "2026-05-01",
    performedBy: "Salome Maina",
    fee: 140
  },
  {
    id: "LB-095655",
    opNo: "OP000301/26",
    name: "Fidel Mbugua Kairu",
    labNo: "095655",
    testName: "KRT H.PYLORI TEST (STOOL)",
    result: "Negative",
    date: "2026-05-01",
    performedBy: "Salome Maina",
    fee: 750
  },
  {
    id: "LB-095690",
    opNo: "OP016120/25",
    name: "Agatha Wothaya Wachira",
    labNo: "095690",
    testName: "KRT PREGNANCY TEST",
    result: "Positive",
    date: "2026-05-01",
    performedBy: "Salome Maina",
    fee: 200
  },
  {
    id: "LB-095691",
    opNo: "OP002197/26",
    name: "Dalia Wanjiku Murimi",
    labNo: "095691",
    testName: "KRT RANDOM BLOOD SUGAR",
    result: "4.2",
    date: "2026-05-01",
    performedBy: "Salome Maina",
    fee: 150
  },
  {
    id: "LB-095692",
    opNo: "OP000698/26",
    name: "Peter Njoroge Kimani",
    labNo: "095692",
    testName: "KRT Stool O/C",
    result: "Consistency: Formed,Non Mucoid Stool; Microscopy: Cyst Of E. Histolytica Seen",
    date: "2026-05-01",
    performedBy: "Salome Maina",
    fee: 140
  },
  {
    id: "LB-095693",
    opNo: "OP017774/25",
    name: "Leyla Wangui Mwangi",
    labNo: "095693",
    testName: "KRT Stool O/C",
    result: "Consistency: Formed,Non Mucoid Stool; Microscopy: Cyst Of E.Histolytica Seen",
    date: "2026-05-01",
    performedBy: "Salome Maina",
    fee: 140
  },
  {
    id: "LB-095694",
    opNo: "OP017774/25",
    name: "Leyla Wangui Mwangi",
    labNo: "095694",
    testName: "KRT H.PYLORI TEST (STOOL)",
    result: "Negative",
    date: "2026-05-01",
    performedBy: "Salome Maina",
    fee: 750
  },
  {
    id: "LB-095739",
    opNo: "OP018328/25",
    name: "Andric Wanjiru Githu",
    labNo: "095739",
    testName: "KRT Stool O/C",
    result: "Color: -; Mucus: Absent; Consistency: Formed Stool; Cyst: No Cysts Seen; Pus Cell: No Pus Cells Seen",
    date: "2026-05-02",
    performedBy: "Rosemary kombo",
    fee: 140
  },
  {
    id: "LB-095740",
    opNo: "OP00234718",
    name: "Njeri Kirangi Avril",
    labNo: "095740",
    testName: "KRT H.PYLORI TEST (STOOL)",
    result: "Positive (Weak)",
    date: "2026-05-02",
    performedBy: "Rosemary kombo",
    fee: 750
  },
  {
    id: "LB-095741",
    opNo: "OP00234718",
    name: "Njeri Kirangi Avril",
    labNo: "095741",
    testName: "KRT Stool O/C",
    result: "Color: -; Mucus: Absent; Consistency: Formed Stool; Cyst: No Cysts Seen; Pus Cell: No Pus Cells Seen; Microscopy: Yeast Cells Seen +",
    date: "2026-05-02",
    performedBy: "Rosemary kombo",
    fee: 140
  },
  {
    id: "LB-095742",
    opNo: "OP002220/26",
    name: "Mary Goretti Wanjiku",
    labNo: "095742",
    testName: "KRT Stool O/C",
    result: "Color: -; Mucus: Absent; Consistency: Formed Stool; Cyst: No Cysts Seen; Pus Cell: No Pus Cells Seen",
    date: "2026-05-02",
    performedBy: "Rosemary kombo",
    fee: 140
  },
  {
    id: "LB-095745",
    opNo: "OP002213/26",
    name: "Wanjohi Purity Wambui",
    labNo: "095745",
    testName: "KRT Stool O/C",
    result: "Color: -; Mucus: Absent; Consistency: Formed Stool; Cyst: No Cysts Seen; Pus Cell: No Pus Cells Seen",
    date: "2026-05-02",
    performedBy: "Rosemary kombo",
    fee: 140
  },
  {
    id: "LB-095818",
    opNo: "OP002217/26",
    name: "Damian Jayson Kibugi",
    labNo: "095818",
    testName: "KRT Stool O/C",
    result: "Color: -; Mucus: Absent; Consistency: Formed Stool; Cyst: No Cysts Seen; Pus Cell: No Pus Cells Seen",
    date: "2026-05-03",
    performedBy: "Rosemary kombo",
    fee: 140
  },
  {
    id: "LB-095838",
    opNo: "WLKN00013471",
    name: "James Karanja",
    labNo: "095838",
    testName: "KRT Stool O/C",
    result: "Color: -; Mucus: Absent; Consistency: Formed Stool; Cyst: No Cysts Seen; Pus Cell: No Pus Cells Seen",
    date: "2026-05-03",
    performedBy: "MARY GICHEHA",
    fee: 140
  },
  {
    id: "LB-095839",
    opNo: "WLKN00013472",
    name: "Brayden Muchiri",
    labNo: "095839",
    testName: "KRT Stool O/C",
    result: "Color: -; Mucus: Absent; Consistency: Loose Stool; Cyst: No Cysts Seen; Pus Cell: No Pus Cells Seen",
    date: "2026-05-03",
    performedBy: "MARY GICHEHA",
    fee: 140
  },
  {
    id: "LB-095912",
    opNo: "OP00241242",
    name: "Musomba Muli Xavier",
    labNo: "095912",
    testName: "KRT URINALYSIS(MICRO & DSTICK)",
    result: "Specific Gravity: 1.015; Ph: 6.0; Appearance: Pale Yellow; Bilirubin: Nil; Blood: Nil; Glucose: Nil; Ketones: Nil; Leucoytes: Nil; Nitrite: Nil; Protein: Nil; Urobilinogen: Nil; Microscopy: No Pus Cells Seen",
    date: "2026-05-04",
    performedBy: "MARY GICHEHA",
    fee: 200
  },
  {
    id: "LB-095913",
    opNo: "OP016861/25",
    name: "Wachira Anthony Maina",
    labNo: "095913",
    testName: "KRT Stool O/C",
    result: "Color: -; Mucus: Absent; Consistency: Formed Stool; Cyst: No Cysts Seen; Pus Cell: No Pus Cells Seen",
    date: "2026-05-04",
    performedBy: "MARY GICHEHA",
    fee: 140
  },
  {
    id: "LB-095914",
    opNo: "OP016978/25",
    name: "Eunice Muthoni Macharia",
    labNo: "095914",
    testName: "KRT RANDOM BLOOD SUGAR",
    result: "5.8",
    date: "2026-05-04",
    performedBy: "MARY GICHEHA",
    fee: 150
  },
  {
    id: "LB-095915",
    opNo: "OP00241258",
    name: "Kariuki Mary Nyawira",
    labNo: "095915",
    testName: "KRT RANDOM BLOOD SUGAR",
    result: "4.5",
    date: "2026-05-04",
    performedBy: "MARY GICHEHA",
    fee: 150
  },
  {
    id: "LB-095916",
    opNo: "OP00241258",
    name: "Kariuki Mary Nyawira",
    labNo: "095916",
    testName: "KRT MALARIA PARASITES(MPS)",
    result: "No Malaria Parasites Seen",
    date: "2026-05-04",
    performedBy: "MARY GICHEHA",
    fee: 100
  },
  {
    id: "LB-095917",
    opNo: "OP00241315",
    name: "Wambui Mercy Wangare",
    labNo: "095917",
    testName: "KRT MALARIA PARASITES(MPS)",
    result: "No Malaria Parasites Seen",
    date: "2026-05-04",
    performedBy: "MARY GICHEHA",
    fee: 100
  },
  {
    id: "LB-095918",
    opNo: "OP00241315",
    name: "Wambui Mercy Wangare",
    labNo: "095918",
    testName: "KRT PREGNANCY TEST",
    result: "Negative",
    date: "2026-05-04",
    performedBy: "MARY GICHEHA",
    fee: 200
  },
  {
    id: "LB-095983",
    opNo: "WLKN00013496",
    name: "Jesse Muita",
    labNo: "095983",
    testName: "KRT URINALYSIS(MICRO & DSTICK)",
    result: "Specific Gravity: 1.025; Ph: 5.5; Appearance: Amber; Bilirubin: Nil; Blood: Nil; Glucose: Nil; Ketones: Nil; Leucoytes: Nil; Nitrite: Nil; Protein: Nil; Urobilinogen: Nil; Microscopy: Yeast Cells Seen +, Scanty Pus Cells Seen",
    date: "2026-05-05",
    performedBy: "MARY GICHEHA",
    fee: 200
  },
  {
    id: "LB-096101",
    opNo: "WLKN00013512",
    name: "Keyshah Wanjiku",
    labNo: "096101",
    testName: "KRT H.PYLORI TEST (STOOL)",
    result: "Negative",
    date: "2026-05-06",
    performedBy: "MARY GICHEHA",
    fee: 750
  },
  {
    id: "LB-096102",
    opNo: "WLKN00013512",
    name: "Keyshah Wanjiku",
    labNo: "096102",
    testName: "KRT Stool O/C",
    result: "Color: -; Mucus: Absent; Consistency: Formed Stool; Cyst: No Cysts Seen; Pus Cell: No Pus Cells Seen",
    date: "2026-05-06",
    performedBy: "MARY GICHEHA",
    fee: 140
  },
  {
    id: "LB-096121",
    opNo: "WLKN00013513",
    name: "Namulondo Halima",
    labNo: "096121",
    testName: "KRT HEPATITIS B ANTIGEN",
    result: "Negative",
    date: "2026-05-06",
    performedBy: "MARY GICHEHA",
    fee: 500
  },
  {
    id: "LB-096122",
    opNo: "WLKN00013513",
    name: "Namulondo Halima",
    labNo: "096122",
    testName: "KRT URINALYSIS(MICRO & DSTICK)",
    result: "Specific Gravity: 1.025; Ph: 5.0; Appearance: Turbid; Bilirubin: Nil; Blood: Nil; Glucose: Nil; Ketones: Nil; Leucoytes: Nil; Nitrite: Nil; Protein: +, Urobilinogen: Nil; Microscopy: Pus Cells Seen 10-15/Hpf",
    date: "2026-05-06",
    performedBy: "MARY GICHEHA",
    fee: 200
  },
  {
    id: "LB-096277",
    opNo: "OP001791/26",
    name: "Purity Njeri Ngunu",
    labNo: "096277",
    testName: "KRT MALARIA PARASITES(MPS)",
    result: "No Malaria Parasites Seen",
    date: "2026-05-08",
    performedBy: "MARY GICHEHA",
    fee: 100
  },
  {
    id: "LB-096278",
    opNo: "OP00241280",
    name: "Kamau James Njuguna",
    labNo: "096278",
    testName: "KRT URINALYSIS(MICRO & DSTICK)",
    result: "Specific Gravity: 1.020; Ph: 6.0; Appearance: Turbid; Bilirubin: Nil; Blood: +, Glucose: Nil; Ketones: Nil; Leucoytes: Nil; Nitrite: Nil; Protein: +, Urobilinogen: Nil; Microscopy: Red Blood Cells Seen 3-5/Hpf, Scanty Pus Cells Seen",
    date: "2026-05-08",
    performedBy: "MARY GICHEHA",
    fee: 200
  },
  {
    id: "LB-096520",
    opNo: "WLKN00013564",
    name: "Angel Wema",
    labNo: "096520",
    testName: "KRT URINALYSIS(MICRO & DSTICK)",
    result: "Specific Gravity: 1.025; Ph: 6.5; Appearance: Amber; Bilirubin: Nil; Blood: Nil; Glucose: Nil; Ketones: Nil; Leucoytes: Nil; Nitrite: Nil; Protein: Nil; Urobilinogen: Nil; Microscopy: No Pus Cells Seen",
    date: "2026-05-12",
    performedBy: "MARY GICHEHA",
    fee: 200
  },
  {
    id: "LB-096598",
    opNo: "WLKN00013575",
    name: "Stephen Maina",
    labNo: "096598",
    testName: "KRT Stool O/C",
    result: "Color: -; Mucus: Absent; Consistency: Formed Stool; Cyst: No Cysts Seen; Pus Cell: No Pus Cells Seen",
    date: "2026-05-13",
    performedBy: "MARY GICHEHA",
    fee: 140
  },
  {
    id: "LB-096733",
    opNo: "WLKN00013595",
    name: "Ephraim Githae",
    labNo: "096733",
    testName: "KRT URINALYSIS(MICRO & DSTICK)",
    result: "Specific Gravity: 1.025; Ph: 6.0; Appearance: Amber; Bilirubin: Nil; Blood: Nil; Glucose: Nil; Ketones: Nil; Leucoytes: Nil; Nitrite: Nil; Protein: Nil; Urobilinogen: Nil; Microscopy: No Pus Cells Seen",
    date: "2026-05-14",
    performedBy: "MARY GICHEHA",
    fee: 200
  },
  {
    id: "LB-096932",
    opNo: "WLKN00013616",
    name: "Ann Wanjiru",
    labNo: "096932",
    testName: "KRT URINALYSIS(MICRO & DSTICK)",
    result: "Specific Gravity: 1.020; Ph: 5.5; Appearance: Pale Yellow; Bilirubin: Nil; Blood: Nil; Glucose: Nil; Ketones: Nil; Leucoytes: Nil; Nitrite: Nil; Protein: Nil; Urobilinogen: Nil; Microscopy: No Pus Cells Seen",
    date: "2026-05-17",
    performedBy: "MARY GICHEHA",
    fee: 200
  },
  {
    id: "LB-096936",
    opNo: "WLKN00013617",
    name: "Shantel Njeri",
    labNo: "096936",
    testName: "KRT SALMONELLA ANTIGEN TEST",
    result: "Salmonella Typhi 'O' 1:160, Salmonella Typhi 'H' 1:160",
    date: "2026-05-17",
    performedBy: "MARY GICHEHA",
    fee: 750
  },
  {
    id: "LB-096937",
    opNo: "WLKN00013617",
    name: "Shantel Njeri",
    labNo: "096937",
    testName: "KRT H.PYLORI TEST (STOOL)",
    result: "Positive",
    date: "2026-05-17",
    performedBy: "MARY GICHEHA",
    fee: 750
  },
  {
    id: "LB-096938",
    opNo: "WLKN00013617",
    name: "Shantel Njeri",
    labNo: "096938",
    testName: "KRT Stool O/C",
    result: "Color: -; Mucus: Absent; Consistency: Formed Stool; Cyst: No Cysts Seen; Pus Cell: No Pus Cells Seen",
    date: "2026-05-17",
    performedBy: "MARY GICHEHA",
    fee: 140
  },
  {
    id: "LB-097061",
    opNo: "OP001934/26",
    name: "Eunice Waithira Muthui",
    labNo: "097061",
    testName: "KRT URINALYSIS(MICRO & DSTICK)",
    result: "Specific Gravity: 1.005; Ph: 6.0; Appearance: Pale Yellow; Bilirubin: Nil; Blood: Nil; Glucose: -, Ketones: Nil; Leucoytes: Nil; Nitrite: Nil; Protein: Nil; Urobilinogen: Nil; Microscopy: No Pus Cells Seen",
    date: "2026-05-20",
    performedBy: "sammy gichohi",
    fee: 200
  },
  {
    id: "LB-097148",
    opNo: "OP002621/26",
    name: "Pauline Thuguri Mathenge",
    labNo: "097148",
    testName: "KRT BLOOD GROUPING ONLY",
    result: "Blood Group: 'O' Positive",
    date: "2026-05-20",
    performedBy: "sammy gichohi",
    fee: 250
  },
  {
    id: "LB-097150",
    opNo: "OP002621/26",
    name: "Pauline Thuguri Mathenge",
    labNo: "097150",
    testName: "KRT UREA ELECTROLYTES AND CREATININE",
    result: "Urea: 5.6 Mmol/L, Sodium: 142.0 Mmol/L, Potassium: 4.1 Mmol/L, Chloride: 102 Mmol/L, Creatinine: 72 Umol/L",
    date: "2026-05-20",
    performedBy: "sammy gichohi",
    fee: 1600
  },
  {
    id: "LB-097206",
    opNo: "WLKN00013651",
    name: "Charles Githua",
    labNo: "097206",
    testName: "KRT KHANVDRL TEST",
    result: "Non Reactive",
    date: "2026-05-21",
    performedBy: "sammy gichohi",
    fee: 300
  },
  {
    id: "LB-097210",
    opNo: "WLKN00013652",
    name: "Evans",
    labNo: "097210",
    testName: "KRT Stool O/C",
    result: "Color: -; Mucus: Absent; Consistency: Formed Stool; Cyst: No Cysts Seen; Pus Cell: No Pus Cells Seen",
    date: "2026-05-21",
    performedBy: "sammy gichohi",
    fee: 140
  },
  {
    id: "LB-097213",
    opNo: "WLKN00013654",
    name: "Pamela Gatwiri",
    labNo: "097213",
    testName: "KRT Stool O/C",
    result: "Color: -; Mucus: Absent; Consistency: Loose Stool; Cyst: No Cysts Seen; Pus Cell: No Pus Cells Seen",
    date: "2026-05-21",
    performedBy: "sammy gichohi",
    fee: 140
  },
  {
    id: "LB-097214",
    opNo: "WLKN00013654",
    name: "Pamela Gatwiri",
    labNo: "097214",
    testName: "KRT MALARIA PARASITES(MPS)",
    result: "No Malaria Parasites Seen",
    date: "2026-05-21",
    performedBy: "sammy gichohi",
    fee: 100
  },
  {
    id: "LB-097346",
    opNo: "OP002622/26",
    name: "Thua Millicent Wambui",
    labNo: "097346",
    testName: "KRT H.PYLORI TEST (STOOL)",
    result: "Negative",
    date: "2026-05-23",
    performedBy: "Simon Maina",
    fee: 750
  },
  {
    id: "LB-097347",
    opNo: "OP002622/26",
    name: "Thua Millicent Wambui",
    labNo: "097347",
    testName: "KRT Stool O/C",
    result: "Color: -; Mucus: Absent; Consistency: Loose Mucoid Stool; Cyst: No Cysts Seen; Pus Cell: Pus Cells Seen; Microscopy: No Rbcs Seen",
    date: "2026-05-23",
    performedBy: "Simon Maina",
    fee: 140
  },
  {
    id: "LB-097343",
    opNo: "WLKN00013680",
    name: "Faith Gakii",
    labNo: "097343",
    testName: "KRT URINALYSIS(MICRO & DSTICK)",
    result: "Specific Gravity: 1.025; Ph: 5.5; Appearance: Amber; Bilirubin: Nil; Blood: Nil; Glucose: Nil; Ketones: Nil; Leucoytes: Nil; Nitrite: Nil; Protein: Nil; Urobilinogen: Nil; Microscopy: Scanty Pus Cells Seen 1-2/Hpf",
    date: "2026-05-23",
    performedBy: "Simon Maina",
    fee: 200
  },
  {
    id: "LB-097381",
    opNo: "WLKN00013681",
    name: "Mary Ngetha",
    labNo: "097381",
    testName: "KRT TSH (Thyroid Function Test)",
    result: "TSH Finecare: 2.1 UIU/ml",
    date: "2026-05-23",
    performedBy: "Simon Maina",
    fee: 600
  },
  {
    id: "LB-097396",
    opNo: "WLKN00013686",
    name: "Valentine Njeri",
    labNo: "097396",
    testName: "KRT PREGNANCY TEST",
    result: "Negative",
    date: "2026-05-24",
    performedBy: "Simon Maina",
    fee: 200
  },
  {
    id: "LB-097418",
    opNo: "WLKN00013689",
    name: "Elias Wambui",
    labNo: "097418",
    testName: "KRT Stool O/C",
    result: "Color: -; Mucus: Absent; Consistency: Formed Stool; Cyst: No Cysts Seen; Pus Cell: No Pus Cells Seen",
    date: "2026-05-25",
    performedBy: "Simon Maina",
    fee: 140
  },
  {
    id: "LB-097430",
    opNo: "WLKN00013692",
    name: "Loise Njeri Mwangi",
    labNo: "097430",
    testName: "KRT CALCIUM TEST",
    result: "Calcium: 2.45 Mmol/L",
    date: "2026-05-25",
    performedBy: "Simon Maina",
    fee: 700
  },
  {
    id: "LB-097548",
    opNo: "WLKN00013721",
    name: "Jesee Muita",
    labNo: "097548",
    testName: "KRT URINALYSIS(MICRO & DSTICK)",
    result: "Specific Gravity: 1.025; Ph: 6.0; Appearance: Amber; Bilirubin: Nil; Blood: Nil; Glucose: Nil; Ketones: Nil; Leucoytes: Nil; Nitrite: Nil; Protein: Nil; Urobilinogen: Nil; Microscopy: Scanty Pus Cells Seen 1-3/Hpf",
    date: "2026-05-27",
    performedBy: "JAMES KIRIIRI",
    fee: 200
  },
  {
    id: "LB-097587",
    opNo: "OP002686/26",
    name: "Joseph Maina Ngonjo",
    labNo: "097587",
    testName: "KRT RANDOM BLOOD SUGAR",
    result: "7.1",
    date: "2026-05-27",
    performedBy: "JAMES KIRIIRI",
    fee: 150
  },
  {
    id: "LB-097597",
    opNo: "OP002689/26",
    name: "Olivia Wambui Kanja",
    labNo: "097597",
    testName: "KRT URINALYSIS(MICRO & DSTICK)",
    result: "Specific Gravity: 1.025; Ph: 6.0; Appearance: Amber; Bilirubin: Nil; Blood: Nil; Glucose: Nil; Ketones: Nil; Leucoytes: Nil; Nitrite: Nil; Protein: Nil; Urobilinogen: Nil; Microscopy: No Pus Cells Seen",
    date: "2026-05-27",
    performedBy: "JAMES KIRIIRI",
    fee: 200
  },
  {
    id: "LB-097731",
    opNo: "WLKN00013747",
    name: "Joseph Wamai",
    labNo: "097731",
    testName: "KRT HAEMOGLOBIN LEVEL",
    result: "Haemoglobin: 13.8 g/Dl",
    date: "2026-05-29",
    performedBy: "JAMES KIRIIRI",
    fee: 200
  },
  {
    id: "LB-097875",
    opNo: "WLKN00013760",
    name: "Rose Maria",
    labNo: "097875",
    testName: "KRT PREGNANCY TEST",
    result: "Negative",
    date: "2026-05-31",
    performedBy: "JAMES KIRIIRI",
    fee: 200
  }
];
