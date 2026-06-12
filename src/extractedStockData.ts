import { PharmacyItem } from './types';

export const rawExtractedStock: [string, string, number, number][] = [
  // Page 1
  ['ANNE00001', 'Omega 3 Caps 4gm (Samega)', 75.00, 39.27],
  ['ANNE00003', 'Tramadol Caps 50 Mg', 494.00, 3.52],
  ['ANNE00004', 'Montelukast And Levocetrizine Tabs 10/5mg( Meftal Plus)', 155.00, 35.40],
  ['ANNE00006', 'Gripe Water 100ml', 18.00, 41.00],
  ['ANNE00007', 'Gripe Water 60ml', 20.00, 31.00],
  ['ANNE00008', 'Montel Dt (Montelu/ Levocet 4/2.5mg)', 35.00, 29.90],
  ['ANNE00009', 'Normalsaline 0.9%/500mls', 37.00, 120.00],
  ['ANNE00015', 'Surgical Gloves Size 7.5', 66.00, 26.00],
  ['ANNE00018', 'Pregabalin Caps 75mg', 254.00, 11.27],
  ['ANNE00020', 'Gloves Rubber(Pair)', 1925.00, 10.00],
  ['ANNE00022', 'Frusemide Injection 20mg/Ml', 10.00, 9.00],
  ['ANNE00023', 'Cough Expectorant(Ascoril) (100ml)', 21.00, 200.00],
  ['ANNE00024', 'Surgical Gloves Size 8.0', 98.00, 28.18],
  ['ANNE00039', 'Amoxicilin 500mg', 1191.00, 4.73],
  ['ANNE00040', 'Atovastatin 10mg', 1614.00, 2.21],
  ['ANNE00041', 'Carbamazepine Tabs 200mg', 49.00, 4.32],
  ['ANNE00042', 'Chlopromazine Hcl Tabs 25mg', 100.00, 3.00],
  ['ANNE00043', 'Chlopromazine Hcl Tabs 100mg', 50.00, 2.19],
  ['ANNE00045', 'Duphaston 10mg Tablets', 40.00, 47.50],
  ['ANNE00046', 'Fluconazole Caps 200 Mg', 90.00, 11.82],
  ['ANNE00047', 'Frusemide Tabs 40mg', 109.00, 0.82],
  ['ANNE00048', 'Griseofulvin 250 Mg', 500.00, 4.97],
  ['ANNE00049', 'Griseofulvin 500mg Tablets', 365.00, 9.43],
  ['ANNE00050', 'Hyoscine N-Butylbromide Tabs10mg', 151.00, 2.27],
  ['ANNE00051', 'Methyldopa Tabs 250mg (Aldomet)', 577.00, 6.45],
  ['ANNE00052', 'Metoclopramide Hcl Tabs 10mg', 120.00, 2.30],
  ['ANNE00054', 'Propranolol Hcl Tabs 40mg', 52.00, 0.60],
  ['ANNE00055', 'Spironolactone Tabs 25mg', 756.00, 4.20],
  ['ANNE00056', 'Multivitamin Tabs', 190.00, 0.48],
  ['ANNE00057', 'Atropine Injection 1mg/Ml', 30.00, 9.00],
  ['ANNE00059', 'Ceftazidime Inj 1gm', 9.00, 120.00],
  ['ANNE00061', 'Saline Nasal Drops 0.9%(10 Mls)', 1.00, 23.00],
  ['ANNE00062', 'Paracetamol( Paeds )Suppositories 125mg', 45.00, 7.40],
  ['ANNE00063', 'I.V.Cannular Size 20', 159.00, 12.00],
  ['ANNE00064', 'Oxygen Mask Nasal Paed', 7.00, 62.00],
  ['ANNE00065', 'Etoricoxib 90mg', 237.00, 14.93],
  ['ANNE00071', 'Tetracycline Eye Ointment', 12.00, 35.00],
  ['ANNE00072', 'Amlodipine 10 Mg', 718.00, 1.79],
  ['ANNE00074', 'Amoxycillin&Clavulanate Pottasium 1000mg', 194.00, 47.10],
  ['ANNE00075', 'Atenolol Tabs 50mg', 891.00, 1.79],
  ['ANNE00076', 'Esomeprazole 40mg Nexpro Injection', 35.00, 275.00],
  ['ANNE00078', 'Losartan 50mg Hctz 12.5mg', 2420.00, 2.64],
  ['ANNE00079', 'Cefuroxime Injection 750mg', 10.00, 154.00],
  ['ANNE00080', 'Calcium Plus Tabs(Calcium Citratemagnesiumzinc&Vitamin D3)- Saracal', 328.00, 14.66],
  ['ANNE00082', 'H.Pylori Antigen (Strips)-20 Testsfeaces', 75.00, 152.00],
  ['ANNE00088', 'Bonnisan Syrup', 4.00, 431.00],
  ['ANNE00089', 'Sitagliptin 50 Metformin 1000', 140.00, 47.11],
  ['ANNE00091', 'Levoflaxacin Tabs 750mg', 180.00, 6.80],
  ['ANNE00095', 'Nystatin Oral Drops', 18.00, 66.63],

  // Page 2
  ['ANNE00097', 'H.Pylori Kit (Surekit) Pack', 6.00, 659.00],
  ['ANNE00098', 'Wooden Spatula', 60.00, 3.63],
  ['ANNE00100', 'Lactulose Solution 4 Mg/Ml', 4.00, 396.00],
  ['ANNE00101', 'Felodipine 5mg (Plendil)', 1.00, 74.71],
  ['ANNE00103', 'Hydrochlorothiazide 50mg', 75.00, 0.92],
  ['ANNE00104', 'Cefuroxime 500mg tabletes', 570.00, 31.00],
  ['ANNE00105', 'Metformin 1gm', 318.00, 9.57],
  ['ANNE00106', 'Metformin 850 Mg', 420.00, 2.50],
  ['ANNE00107', 'Syringe 5ml', 602.00, 5.20],
  ['ANNE00109', 'Sodium Chromoglycate 2.0% Eye Drops', 9.00, 226.00],
  ['ANNE00111', 'Microfilter (Soluset-Paediatric)', 13.00, 180.00],
  ['ANNE00113', 'Aclosara-Mr', 120.00, 33.20],
  ['ANNE00115', 'Le Sure Kit', 10.00, 1290.00],
  ['ANNE00120', 'Gauze Roll 1.5 Grams', 604.00, 6.67],
  ['ANNE00123', 'Thiozone (Paracetamol 325mg/Thiocolchicoside2mg) Tabs', 112.00, 34.20],
  ['ANNE00124', 'Chlorpheninamine Maleate Tabs 4mg', 458.00, 0.36],
  ['ANNE00125', 'Cetrizine Dihydrochloride Tabs 10mg', 649.00, 0.56],
  ['ANNE00126', 'Amoxycillin Dispersible Tablets 250mg', 638.00, 3.42],
  ['ANNE00127', 'Azithromycin 500mg', 1.00, 55.36],
  ['ANNE00128', 'Adrenaline Injection 1mg/Ml', 8.00, 10.20],
  ['ANNE00129', 'Folic Acid Tabs 5mg', 413.00, 0.43],
  ['ANNE00130', 'Ibuprofen Tabs 200mg', 611.00, 0.83],
  ['ANNE00132', 'Domperidone 10mg', 825.00, 1.21],
  ['ANNE00136', 'Ibuprofen Tablets 400mg', 782.00, 1.24],
  ['ANNE00139', 'Crepe Bandage 4inch', 18.00, 35.00],
  ['ANNE00140', 'Urine Bag Adult', 9.00, 60.00],
  ['ANNE00141', 'Rivaroxaban 20mg', 16.00, 72.03],
  ['ANNE00143', 'Crepe Bandage 6inch piece', 28.00, 60.00],
  ['ANNE00144', 'Felodipine 10mg (Plendil)', 119.00, 84.11],
  ['ANNE00147', 'Betapad 10cm X 20cm', 3.00, 46.60],
  ['ANNE00149', 'Cough Suppressant (Dextromethorphan) Dacof 100ml', 74.00, 63.00],
  ['ANNE00152', 'Omeprazole 40mg Injection', 1.00, 118.80],
  ['ANNE00158', 'Ondansetron 4 Mg Tab(Emadon)', 32.00, 38.44],
  ['ANNE00162', 'Tamiton Plus (Tamsulosin 0.4 Dutasteride 0.5)', 30.00, 36.66],
  ['ANNE00177', 'Antacid (Viscid Gel)', 2.00, 150.00],
  ['ANNE00178', 'Cosflora Probiotics', 43.00, 55.82],
  ['ANNE00183', 'Cefuroxime Suspension 125mg', 1.00, 212.00],
  ['ANNE00185', 'Atorvastatin 20mg', 1492.00, 2.32],
  ['ANNE00188', 'Hydroxychloroquine Sulphate- Tabs. 200mg', 27.00, 16.00],
  ['ANNE00189', 'Flucloxacillin Syrup 125mg/5mls (100mls)', 9.00, 69.00],
  ['ANNE00190', 'Celecoxib 200mg', 30.00, 11.60],
  ['ANNE00196', 'Dextrose Injection 10% W/V 500 Mls', 10.00, 82.00],
  ['ANNE00199', 'Candid B', 2.00, 189.90],
  ['ANNE00200', 'Candid Plain', 1.00, 250.17],
  ['ANNE00205', 'Losartan Tabs (Carditan) 50mg', 138.00, 2.07],
  ['ANNE00206', 'H.Pylori Kit(Sign Kit) 7 Pack', 150.00, 1996.50],
  ['ANNE00207', 'Haematinic Caps (Iron Dex)', 60.00, 4.00],
  ['ANNE00211', 'Desloratadine Tabs', 95.00, 29.92],
  ['ANNE00214', 'Ebastine Syrup(Histy) 5mg/5ml', 21.00, 411.00],

  // Page 3
  ['ANNE00216', 'Cough Exp (Tripacoff)', 42.00, 117.00],
  ['ANNE00217', 'Cough Exp (Chesty)', 48.00, 36.00],
  ['ANNE00220', 'Celestamine Tabs(Celabet)', 2.00, 12.87],
  ['ANNE00221', 'Antihistamin Cream', 2.00, 25.00],
  ['ANNE00224', 'Oxygen Mask-Non Rebreath (Adult)', 6.00, 102.00],
  ['ANNE00228', 'Aclosara P Syrup', 2.00, 459.00],
  ['ANNE00232', 'Ranferon Syrup/ Saferon Syrup', 2.00, 230.00],
  ['ANNE00233', 'Trust Condoms', 99.00, 25.75],
  ['ANNE00235', 'Candid V Pess - 3', 10.00, 378.00],
  ['ANNE00239', 'Candid V Pess - 6', 9.00, 425.00],
  ['ANNE00242', 'Safe72', 22.00, 27.00],
  ['ANNE00243', 'Scott Emulsion', 5.00, 464.00],
  ['ANNE00244', 'Trust Studded', 74.00, 42.08],
  ['ANNE00245', 'Femiplan Cycle', 6.00, 91.00],
  ['ANNE00246', 'Myospaz (Paracetamol 500/Chlorzo250mg) Tabs', 278.00, 13.72],
  ['ANNE00247', 'Zuru Mr (Aceclo+Para=Chlorzoxazole)', 462.00, 39.00],
  ['ANNE00248', 'Myonac Mr Tabs(Aceclofenac 100mg/PCM 325mg/Chlorzoxazone 500mg)', 30.00, 15.53],
  ['ANNE00249', 'Clotrimazole Pess 1s 500mg', 2.00, 46.00],
  ['ANNE00250', 'Saracal-M Caps', 200.00, 50.80],
  ['ANNE00253', 'Gabacare Tabs 300/500mg', 192.00, 56.37],
  ['ANNE00254', 'Brustan Tabs(Brufen+Paracet)', 6.00, 9.80],
  ['ANNE00255', 'Meloxicam Tabs 15mg', 172.00, 4.54],
  ['ANNE00257', 'Paracetamol Susp (Cetamol) 100ml', 3.00, 52.00],
  ['ANNE00266', 'Syringe 60ml-Catheter Tip', 7.00, 116.00],
  ['ANNE00270', 'Lonoflam 8mg Plain', 268.00, 25.42],
  ['ANNE00278', 'Clindamycin(Myclin) 100s', 158.00, 12.00],
  ['ANNE00279', 'Diclomol Sr 100mg 100s', 113.00, 4.35],
  ['ANNE00280', 'Gocid Susp 100ml', 10.00, 36.00],
  ['ANNE00281', 'Ibugesic Syp 100ml', 3.00, 81.00],
  ['ANNE00284', 'Benzyl Penicilline Injection 1.0mu', 15.00, 18.00],
  ['ANNE00285', 'Benzyl Penicilline Injection 5.0mu', 97.00, 44.00],
  ['ANNE00287', 'Clotrimazole Cream 1 20gms', 18.00, 23.00],
  ['ANNE00289', 'I.V.Cannular Size 18', 82.00, 12.03],
  ['ANNE00290', 'Oxygen Tubing Adults', 6.00, 40.00],
  ['ANNE00297', 'Nebulizer Mask Adult', 3.00, 84.00],
  ['ANNE00298', 'Oxygen Mask Non-Rebreath(1way Valve)Paed', 1.00, 101.00],
  ['ANNE00300', 'Sodium Valproate 500mg Chrono Tabs', 75.00, 18.70],
  ['ANNE00306', 'Cyclopam Suspension', 10.00, 155.00],
  ['ANNE00307', 'Acirax Cream 10g', 3.00, 57.00],
  ['ANNE00309', 'Burn Cream Bernox Cream 20gm', 15.00, 27.00],
  ['ANNE00310', 'Cophydrex 100ml', 2.00, 40.00],
  ['ANNE00312', 'Tridex 100ml', 16.00, 53.00],
  ['ANNE00314', 'Albendazole Olworm', 29.00, 44.10],
  ['ANNE00316', 'Loperamide Caps 6s', 75.00, 11.00],
  ['ANNE00317', 'Magnacid Gel 100 Ml', 8.00, 48.00],
  ['ANNE00320', 'Prednisolone 5mg (Zain) White 100s', 459.00, 0.58],
  ['ANNE00322', 'Cephalexin 250mg Bp 100s Gen', 70.00, 5.95],
  ['ANNE00323', 'Cephalexin Gen 500mg 100s', 165.00, 6.33],
  ['ANNE00327', 'Promethazine (Largan) 60mls', 7.00, 19.00],

  // Page 4
  ['ANNE00328', 'Secnid Ds 2s', 2.00, 30.75],
  ['ANNE00330', 'Tagera Forte 2s', 8.00, 70.00],
  ['ANNE00331', 'Tinidazole (Tinisky) 500mg 4s', 320.00, 12.00],
  ['ANNE00333', 'Carvedilol 12.5mgs', 1114.00, 2.21],
  ['ANNE00334', 'Aclosara-Sp(Paracetamol 325mgs Serratiopeptidase 15mgs Tabs)', 24.00, 68.40],
  ['ANNE00335', 'Augmentin Suspension 457 Mg-70mls', 2.00, 1055.00],
  ['ANNE00336', 'Amlodipine 5 Mg Tabs', 444.00, 1.46],
  ['ANNE00338', 'Vacutainers( Red Top)', 200.00, 10.00],
  ['ANNE00343', 'I.V.Cannular Size 22', 111.00, 10.87],
  ['ANNE00344', 'Cotton Wool Balls', 700.00, 1.59],
  ['ANNE00346', 'Cefuroxime (My Dawa) 125mg 100ml', 5.00, 215.00],
  ['ANNE00348', 'Dazel Kit', 3.00, 360.00],
  ['ANNE00349', 'Deep Heat Spray 150ml', 1.00, 695.00],
  ['ANNE00350', 'Fludex C Tablets 10s', 4.00, 9.90],
  ['ANNE00352', 'Flugone Dm 60ml', 10.00, 172.05],
  ['ANNE00353', 'Flugone P 60ml', 279.00, 172.05],
  ['ANNE00355', 'Amoxicillin 250mg Bp 100s', 1150.00, 2.90],
  ['ANNE00356', 'Amoxicillin Moxacil Ds Syp 100ml', 1.00, 73.00],
  ['ANNE00357', 'Cephalexin (Leocef) Syp 100ml', 18.00, 68.00],
  ['ANNE00362', 'Needles G21 Each', 528.00, 2.00],
  ['ANNE00366', 'Methylated Spirit (Ml)', 7000.00, 0.20],
  ['ANNE00369', 'Mediven Cream', 9.00, 45.00],
  ['ANNE00370', 'Microscope Slides 76x22mm - 72pcs(Frosted)', 6.00, 250.00],
  ['ANNE00373', 'Pharmasal Oint', 3.00, 48.00],
  ['ANNE00375', 'Treviamet Tabs 50 500mg 35s', 66.00, 42.83],
  ['ANNE00384', 'Ebastine 10mg Tabs', 180.00, 32.26],
  ['ANNE00387', 'Paracetamol Infusion 1gm', 97.00, 250.00],
  ['ANNE00395', 'H.Pyroli Kit(Hikit)', 8.00, 1500.00],
  ['ANNE00398', 'Surgical Spirit 90%', 5310.00, 0.20],
  ['ANNE00402', 'Diazepam Injection 5mg/Ml', 6.00, 41.80],
  ['ANNE00404', 'Annusol Cream', 5.00, 269.00],
  ['ANNE00407', 'Symbicort(Budesonide 160/4.5 Mcgs)', 12.00, 1039.00],
  ['ANNE00420', 'Hydrocortisone Skin Ointment', 1212.00, 35.00],
  ['ANNE00423', 'Telmisartan 80/Amlodip 5 Mg(Telmigood)', 61.00, 49.50],
  ['ANNE00426', 'Nebivolol 5mg Nebigood 5', 133.00, 39.60],
  ['ANNE00427', 'Dapagood Sm (Dapa/Sita/Met)', 48.00, 80.85],
  ['ANNE00437', 'Phenobarbitone Tabs 30mg', 240.00, 0.52],
  ['ANNE00439', 'Dexamethasone Sodium Phosphate Injection 8 Mg/2 Ml', 1.00, 0.00],
  ['ANNE00440', 'Oxygen Tubing Paeds', 12.00, 41.00],
  ['ANNE00441', 'Metformin 500mg+Glibenclamide Tabs 5mg', 2477.00, 5.79],
  ['ANNE00442', 'Metformin 500mg', 2527.00, 2.32],
  ['ANNE00458', 'Track Mr (Diclo, Para, Chlorzoxazone 500/50/250mg)', 45.00, 14.19],
  ['ANNE00486', 'Gliclazide 80mg', 24.00, 21.04],
  ['ANNE00492', 'Hydrocortisone Sodium Succ. Inj 100mg', 18.00, 30.00],
  ['ANNE00493', 'Augmentin 228mg/5mls', 236.00, 341.55],
  ['ANNE00499', 'Augmentin Injection (1.2 Gram)', 4.00, 233.75],
  ['ANNE00504', 'Wheel Chair Standard', 2.00, 22000.00],
  ['ANNE00524', 'Empagliflozin Tabs 25 Mg', 12.00, 81.59],
  ['ANNE00527', 'Ondansetron Syrup', 2.00, 302.42],

  // Page 5
  ['ANNE00528', 'Hydrochlorothiazide 25 Mg', 1170.00, 0.70],
  ['ANNE00540', 'Saracal Syrup', 137.00, 508.00],
  ['ANNE00550', 'Valsartan And Sacubitril 50mg', 60.00, 56.67],
  ['ANNE00559', 'Uric Acid Test Strips', 196.00, 6468.00],
  ['ANNE00560', 'Tetracycline Skin Ointment', 2.00, 25.00],
  ['ANNE00568', 'Adhesive Strapping (Transparent) 1inch', 32.00, 150.00],
  ['ANNE00572', 'Albendazole Syrup 20mls', 1.00, 44.08],
  ['ANNE00573', 'Adhesive Zinc Oxide 3inch (Strapping)', 1.00, 81.00],
  ['ANNE00585', 'Amitriptyline Tabs 25mg', 90.00, 0.60],
  ['ANNE00600', 'Autoclaving Tape-1/2 Roll', 1.00, 192.00],
  ['ANNE00622', 'Calamine Lotion/L (100mls)', 9.00, 44.00],
  ['ANNE00635', 'Cetirizine 5mg Syrup 60ml', 10.00, 30.00],
  ['ANNE00650', 'Coartem Tablet -20/120 Mg Tabs', 48.00, 74.00],
  ['ANNE00663', 'Diazepam Tabs 5mgs', 4.00, 0.63],
  ['ANNE00674', 'Edta Vaccutainers(100)', 301.00, 10.00],
  ['ANNE00694', 'Etoricoxib 60mg And Paracetamol 325mg Tabs', 196.00, 30.00],
  ['ANNE00719', 'Ketoconazole Tabs 200mg', 93.00, 3.22],
  ['ANNE00730', 'Liquid Paraffin (100mls)', 4.00, 24.53],
  ['ANNE00737', 'Metolazone', 15.00, 46.97],
  ['ANNE00739', 'Metformin Tabs 500mg -Xr', 284.00, 9.54],
  ['ANNE00741', 'Nifedipine Tabs 20mg', 615.00, 0.90],
  ['ANNE00746', 'Naproxen + Esomeprazole Tabs (Napro Es) 500', 3.00, 63.55],
  ['ANNE00754', 'Nylon No2 Cutting Needle 40mm-Non Absorbable', 8.00, 204.00],
  ['ANNE00767', 'Pop 8*', 2.00, 350.00],
  ['ANNE00779', 'Rabeprazole Sodium Tabs 20mg+Domperidone 30mg', 104.00, 41.25],
  ['ANNE00833', 'Valsartan And Sacubitril 100mg', 60.00, 60.00],
  ['ANNE00844', 'Vicryl No 2/0 Round Body 35mm Absorbable (Polyglactin)', 20.00, 387.00],
  ['ANNE00863', 'Acyclovir Cream Tube', 5.00, 150.00],
  ['ANNE00869', 'H.V.S.Swabs', 10.00, 10.00],
  ['ANNE00873', 'Aceclofenac 200mg Tabs', 62.00, 24.20],
  ['ANNE00886', 'Aminophylline Injection 250mg', 15.00, 154.00],
  ['ANNE00894', 'Glibenclamide Tabs 5mg', 1226.00, 2.82],
  ['ANNE00895', 'Bisacodyl Tabs 5mg', 1182.00, 0.72],
  ['ANNE00898', 'Gentamycin Injection 20mg/2ml', 7.00, 37.40],
  ['ANNE00900', 'Rivaroxaban 10mg', 99.00, 49.09],
  ['ANNE00901', 'Nylon 2/0 Cutting Needle', 12.00, 140.00],
  ['ANNE00904', 'Salmonella Antigen (25 Tests) (Stool)', 15.00, 221.84],
  ['ANNE00916', 'Flucloxacillin 250mg Capsules', 481.00, 4.97],
  ['ANNE00921', 'Losartan Potassium 50mg Tabs', 870.00, 3.40],
  ['ANNE00925', 'Metronidazole Injection 500mg/100mls', 41.00, 55.00],
  ['ANNE00926', 'Norfloxacin Tabs 400mg', 10.00, 3.54],
  ['ANNE00927', 'Surgical Blade Size 23', 99.00, 4.74],
  ['ANNE00931', 'Erythromycin 250 Mg Tablets', 200.00, 4.80],
  ['ANNE00934', 'Oxygen Tubings Paed /Adult', 3.00, 42.00],
  ['ANNE00944', 'Coscof C', 3.00, 148.00],
  ['ANNE00948', 'Annusol Suppositories', 55.00, 45.60],
  ['ANNE00951', 'Foley Catheter Size 18 2way', 4.00, 70.00],
  ['ANNE00965', 'Co-Trimoxazole 960 Mg', 2880.00, 3.26],

  // Page 6
  ['ANNE00968', 'Combivent Respirator (Salbutamol+Ipratropium Bromide)', 11.00, 145.20],
  ['ANNE00969', 'Cover Slips/100(22*22mm)', 100.00, 5.04],
  ['ANNE00975', 'Glucose Test Strips(Medisign)', 300.00, 14.42],
  ['ANNE00985', 'Pioglitazone Tablets 30mg', 42.00, 4.36],
  ['ANNE00998', 'Amoxicillin Suspension 125mg/5ml (100mls)', 12.00, 51.00],
  ['ANNE01000', 'Clob B Cream', 16.00, 52.00],
  ['ANNE01001', 'Ceftriaxone 1gm+Salbactam 500mg (Cefgold) Injection', 20.00, 336.00],
  ['ANNE01029', 'Beecox Plus Caps(Celecoxib+PCM Tabs 325mg)', 96.00, 53.80],
  ['ANNE01030', 'Cartimove-D Tablets', 290.00, 86.00],
  ['ANNE01038', 'Hartmanns Solution 500mls', 15.00, 80.00],
  ['ANNE01039', 'Hemisamic Injection 500mg', 88.00, 184.00],
  ['ANNE01042', 'Stool Container(Cupped W/Spoon)', 300.00, 17.00],
  ['ANNE01046', 'Saline Hypertonic Solution Inj. Bp 3% (100mls)', 1.00, 378.00],
  ['ANNE01054', 'Omeprazole Caps 20mg', 680.00, 0.98],
  ['ANNE01066', 'Vicryl No 3/0 Cutting Needle 26mm Absorbable', 7.00, 203.00],
  ['ANNE01074', 'Blood Lancets 100pack', 5.00, 108.00],
  ['ANNE01081', 'Mupiban Oint % Cream', 1.00, 535.40],
  ['ANNE01082', 'Carbimazole Tabs 5 Mg', 120.00, 4.06],
  ['ANNE01083', 'Hyoscine N-Butylbromide Injection 20mg/Ml', 10.00, 21.40],
  ['ANNE01093', 'Glycerine Suppositories', 29.00, 77.63],
  ['ANNE01097', 'Saferon Capsules', 83.00, 9.54],
  ['ANNE01098', 'Dextrose Injection 5% W/V 500 Mls', 30.00, 80.00],
  ['ANNE01105', 'Soluble Insulin Inject 10ml - Actrapid (100 Units)', 1.00, 460.00],
  ['ANNE01108', 'Diclofenac Gel Ointment', 18.00, 23.35],
  ['ANNE01109', 'Clotrimazole Vaginal Pessaries 200mg (Pack Of 3)', 22.00, 47.00],
  ['ANNE01110', 'Paracetamol Syrup 100mls (Curamol)', 41.00, 46.69],
  ['ANNE01111', 'Lonoflam Mr Tabs', 125.00, 80.41],
  ['ANNE01112', 'Needles G23 Each', 668.00, 2.00],
  ['ANNE01113', 'Tranexamic Acid 500mg Caps', 134.00, 23.65],
  ['ANNE01119', 'Benzhexol Hydrochloride Tabs 5mg', 300.00, 1.15],
  ['ANNE01122', 'Bottle Small (120ml)', 13.00, 10.46],
  ['ANNE01134', 'Amoxicillin Suspension 250mg/5mls (100mls)', 15.00, 77.00],
  ['ANNE01135', 'Chlorhexidine 0.2% Mouth Wash - 100mls', 7.00, 252.00],
  ['ANNE01136', 'Sharp Containers Paper 5lts', 2.00, 118.00],
  ['ANNE01138', 'Cerebroprotein Hydrolysate 90mg Tabs', 100.00, 115.00],
  ['ANNE01139', 'Amoxicillin 500mg Clavanic Acid 125mg (Clavulin)', 63.00, 12.50],
  ['ANNE01141', 'Cartimove Tabs', 415.00, 51.17],
  ['ANNE01144', 'Clomiphene Citrate 50mg (Ovulet)', 9.00, 23.20],
  ['ANNE01146', 'Charcoal Activated Tablets', 47.00, 6.60],
  ['ANNE01151', 'Cefuroxime Tabs 250mg', 615.00, 36.40],
  ['ANNE01152', 'Co-Trimoxazole Suspension 240mg/5ml (100mls)', 19.00, 45.00],
  ['ANNE01154', 'Ceftriaxone Injection 1gm', 59.00, 73.70],
  ['ANNE01158', 'Doxycycline Hcl Caps 100 Mg', 138.00, 3.06],

  // Page 7
  ['ANNE01159', 'Drug Envelopes (1000)-Paper', 1500.00, 0.72],
  ['ANNE01160', 'Chlorpheniramine Maleate 2mg/Ml 60ml', 21.00, 19.00],
  ['ANNE01163', 'Dapagliflozin 10mg', 180.00, 79.00],
  ['ANNE01165', 'Carvedilol Tabs 6.25mg', 1061.00, 2.04],
  ['ANNE01166', 'Esomeprazole 40mg Tablets', 209.00, 21.28],
  ['ANNE01170', 'Erythromycin Ethylsuccinate (Syrup) 100mls', 9.00, 81.00],
  ['ANNE01178', 'Dexamethasone Tabs 0.5mg', 308.00, 1.25],
  ['ANNE01184', 'Etoflam Gel (Etoricoxib/Linseed Oil/Methylsalicylate/Menthol) 50g', 3.00, 495.00],
  ['ANNE01193', 'Diloxanide 125 Mg + Metronidazole 100 Mg Syrup', 22.00, 88.00],
  ['ANNE01194', 'Foley Catheter Size 16 2way', 11.00, 50.60],
  ['ANNE01206', 'Ky-Jelly', 3.00, 210.00],
  ['ANNE01210', 'I.V.Giving Sets', 77.00, 166.00],
  ['ANNE01214', 'Neuro Forte Tabs', 126.00, 16.50],
  ['ANNE01217', 'Ifaas (Ferrous Sulphate 200mg & Folic Acid 400mg)', 1880.00, 1.16],
  ['ANNE01219', 'Ibuprofen Syrup 100mg/5ml', 9.00, 38.00],
  ['ANNE01220', 'Jik Solution (Hypochlorite Disinfectant Mls)', 2000.00, 0.08],
  ['ANNE01221', 'I.V Canula G.26', 68.00, 15.00],
  ['ANNE01223', 'Insulin Syringes', 60.00, 20.00],
  ['ANNE01227', 'Opsite Dressing 6.5*5.5', 164.00, 17.47],
  ['ANNE01229', 'Nimodipine 30mg Tab', 100.00, 91.90],
  ['ANNE01233', 'Nitrofurantoin Sodium Tabs 100mg', 46.00, 1.87],
  ['ANNE01237', 'Lignocaine Hcl 2% (Per 1 Ml)', 120.00, 1.33],
  ['ANNE01239', 'Sabezole It (Rabeprazole 20mg + Itopride 150mg)', 24.00, 106.10],
  ['ANNE01247', 'Paracetamol (Adult) Suppositories 250mg', 16.00, 12.50],
  ['ANNE01249', 'Oxygen Mask- Adult', 3.00, 65.00],
  ['ANNE01250', 'Nervoplex Tabs', 14.00, 107.53],
  ['ANNE01251', 'Ondansetron 4mg/2ml Inj.', 116.00, 82.57],
  ['ANNE01252', 'Lonoflam (Lornoxicam And Paracetamol 325 Mgs)', 105.00, 44.97],
  ['ANNE01258', 'Rivaroxaban 15mg Tabs', 84.00, 61.84],
  ['ANNE01272', 'Salbutamol Nebulizer 2.5mg/2.5ml (Vial)', 38.00, 138.77],
  ['ANNE01274', 'Povidone Iodine Dressing 10% (Mls)', 8993.00, 0.73],
  ['ANNE01275', 'Prostaflo-F (Tamsulosin Hydrochloride Sr + Finasteride Caps)', 103.00, 46.00],
  ['ANNE01276', 'Syringe 2ml', 338.00, 4.00],
  ['ANNE01277', 'Sodium Valproate 200mg Tabs', 40.00, 10.35],
  ['ANNE01279', 'Primapore (Original) 10cm By 25cm', 40.00, 150.00],
  ['ANNE01287', 'Tranexamic Acid Caps 250mg', 3.00, 12.90],
  ['ANNE01288', 'Tramadol Inj. 100mg', 11.00, 33.60],
  ['ANNE01293', 'Clopidogrel 75 Mg', 2.00, 3.80],
  ['ANNE01304', 'Nosic Tabs (Doxylamine + Pyridoxine 10/10mg)', 5.00, 13.75],
  ['ANNE01306', 'Water For Injection', 17.00, 3.94],
  ['ANNE01313', 'Pyridoxine Tabs 50mg', 672.00, 0.78],
  ['ANNE01314', 'Erythromycin Stearate Tabs 500mg', 317.00, 10.44],
  ['ANNE01316', 'I.V.Cannular Size 24', 130.00, 11.49],
  ['ANNE01317', 'Ciprofloxacin Tabs 500mg', 380.00, 3.94],
  ['ANNE01319', 'Haloperidol Tabs 5mg', 88.00, 1.26],
  ['ANNE01321', 'Dexamethasone Sodium Phos. Injection 4mg/Ml', 24.00, 9.30],

  // Page 8
  ['ANNE01323', 'Salbutamol Tabs 4mg', 185.00, 0.94],
  ['ANNE01324', 'Norethisterone 5mg Tabs (Primolut)', 163.00, 10.56],
  ['ANNE01325', 'Enalapril Tabs 5mg', 506.00, 1.23],
  ['ANNE01332', 'Gentamycin Injection 80mg/2ml', 57.00, 9.40],
  ['ANNE01334', 'Metronidazole Suspension 100ml', 22.00, 53.00],
  ['ANNE01338', 'Thyroxine 100 Mcg', 15.00, 9.73],
  ['ANNE01340', 'Vaseline Gauzes (Sterile) Dressing Pad', 16.00, 50.00],
  ['ANNE01342', 'Methylprednisolone Acetate Injection 40mg', 2.00, 700.70],
  ['ANNE01343', 'Oral Rehydration Salt (Sachet)', 168.00, 9.00],
  ['ANNE01345', 'Syringe 10ml', 194.00, 10.00],
  ['ANNE01349', 'Montebasto (Ebastine 2.5mg + Montelukast Sodium 4mg Tabs)', 257.00, 68.30],
  ['ANNE01350', 'Meloxicam 7.5mg', 40.00, 2.48],
  ['ANNE01353', 'Metronidazole Tabs 200 Mg', 643.00, 0.74],
  ['ANNE01358', 'Metronidazole Tabs 400 Mg', 269.00, 1.39],
  ['ANNE01363', 'Zinc Sulphate 20mg', 80.00, 1.10],
  ['ANNE01364', 'Zinc Sulphate Syrup 20mg/5ml', 5.00, 69.00],
  ['ANNE03087', 'Paracetamol Injection 150mg/Ml', 20.00, 17.80],
  ['ANNE03088', 'Paracetamol Tabs 500mg', 978.00, 0.78],
  ['ANNE03089', 'Paracetamol Syrup (60mls)', 62.00, 27.00],
  ['ANNE03090', 'Room Thermometer', 1.00, 1.00],
  ['ANNE03091', 'Telmisartan 40mg/Amlodip 5mg (Telgood 40am)', 219.00, 42.90],
  ['ANNE03093', 'Acecor Mr', 9.00, 21.60],
  ['ANNE03094', 'Acecor P', 12.00, 17.00],
  ['ANNE03095', 'Acecor Sp', 20.00, 21.60],
  ['ANNE03096', 'Combicor (Olfox + Ornidazole)', 100.00, 37.50],
  ['ANNE03097', 'Corclav 228', 14.00, 385.00],
  ['ANNE03099', 'Diclofenac Inj 75mg', 49.00, 20.00],
  ['ANNE03100', 'Dyzol Ds', 30.00, 16.30],
  ['ANNE03101', 'Flumox 500mg', 3.00, 38.57],
  ['ANNE03102', 'Flumox Syrup 250mg', 5.00, 392.70],
  ['ANNE03128', 'Cuticor Cream', 4.00, 190.00],
  ['ANNE03142', 'Montelukast 4mg (Myteka) Sachets', 110.00, 23.00],
  ['ANNE03158', 'Antacid (Alugel)', 2.00, 66.00],
  ['ANNE03168', 'Cough Exp (Herbigor Htc)', 1.00, 238.00],
  ['ANNE03296', 'Montelukast (Myteka) 10mg', 140.00, 21.79],
  ['ANNE03298', 'Flucloxacillin 500mg', 265.00, 7.97],
  ['ANNE03299', 'Maxitrol Eye Drops', 1.00, 227.00],
  ['ANTI03141', 'Beecox Mr (Celecoxib 200, PCM 325, Chlorzoxazone 250)', 90.00, 88.00],
  ['ANTI03250', 'Candid Powder', 2.00, 258.50]
];

// Helper to map tuples into typed PharmacyItems
export function getExtractedPharmacyStock(): PharmacyItem[] {
  return rawExtractedStock.map(([id, name, qty, price]) => {
    // Dynamically categorize
    let category = 'Tablets / Capsules';
    const lower = name.toLowerCase();
    
    if (
      lower.includes('inj') || 
      lower.includes('injection') || 
      lower.includes('vial') || 
      lower.includes('amp') ||
      lower.includes('infusion') ||
      lower.includes('water for injection')
    ) {
      category = 'Injections & Infusions';
    } else if (
      lower.includes('syringe') ||
      lower.includes('needle') ||
      lower.includes('gloves') ||
      lower.includes('spatula') ||
      lower.includes('cannula') ||
      lower.includes('bandage') ||
      lower.includes('gauze') ||
      lower.includes('tape') ||
      lower.includes('mask') ||
      lower.includes('bag') ||
      lower.includes('tube') ||
      lower.includes('blade') ||
      lower.includes('catheter') ||
      lower.includes('strap') ||
      lower.includes('container') ||
      lower.includes('wheel chair') ||
      lower.includes('dressing') ||
      lower.includes('slips') ||
      lower.includes('slides') ||
      lower.includes('lancet')
    ) {
      category = 'Surgicals & Non-Pharmaceuticals';
    } else if (lower.includes('drop') || lower.includes('nasal')) {
      category = 'Ophthalmic / Otic / Nasal Drops';
    } else if (
      lower.includes('syrup') ||
      lower.includes('syp') ||
      lower.includes('suspension') ||
      lower.includes('susp') ||
      lower.includes('water 100ml') ||
      lower.includes('water 60ml') ||
      lower.includes('elixir') ||
      lower.includes('expe') ||
      lower.includes('liquid') ||
      lower.includes('emulsion')
    ) {
      category = 'Oral Liquids & Suspensions';
    } else if (
      lower.includes('cream') ||
      lower.includes('ointment') ||
      lower.includes('gel') ||
      lower.includes('jelly') ||
      lower.includes('rub')
    ) {
      category = 'Topical Creams & Ointments';
    } else if (lower.includes('pess') || lower.includes('supp')) {
      category = 'Suppositories & Pessaries';
    } else if (lower.includes('test') || lower.includes('antigen') || lower.includes('strip')) {
      category = 'Diagnostic Tests & Strips';
    }

    return {
      id,
      name,
      stockQuantity: qty,
      price,
      category,
      minThreshold: 20
    };
  });
}
