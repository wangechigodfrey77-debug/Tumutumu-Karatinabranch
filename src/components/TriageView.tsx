import React, { useState } from 'react';
import { 
  Heart, 
  Search, 
  User, 
  Settings, 
  Thermometer, 
  Activity, 
  Gauge, 
  Clock, 
  Scale, 
  TrendingUp, 
  Plus, 
  AlertTriangle,
  Flame,
  Droplet,
  UserCheck,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { Patient, PatientVitals } from '../types';

interface TriageViewProps {
  patients: Patient[];
  userEmail: string;
  userName: string;
  onUpdatePatientVitals: (patientId: string, vitals: PatientVitals) => Promise<void>;
}

export function TriageView({
  patients,
  userEmail,
  userName,
  onUpdatePatientVitals
}: TriageViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  
  // Form Vitals States
  const [temp, setTemp] = useState<number | ''>('');
  const [systolic, setSystolic] = useState<number | ''>('');
  const [diastolic, setDiastolic] = useState<number | ''>('');
  const [pulse, setPulse] = useState<number | ''>('');
  const [respRate, setRespRate] = useState<number | ''>('');
  const [spo2, setSpo2] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [bloodSugar, setBloodSugar] = useState<number | ''>('');
  const [urgency, setUrgency] = useState<'Emergent' | 'Urgent' | 'Normal' | 'Routine'>('Normal');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter patients based on query
  const filteredPatients = searchQuery ? patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      (p.opNumber && p.opNumber.toLowerCase().includes(q)) ||
      (p.phone && p.phone.includes(q))
    );
  }) : [];

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // Clear Form
  const resetForm = () => {
    setTemp('');
    setSystolic('');
    setDiastolic('');
    setPulse('');
    setRespRate('');
    setSpo2('');
    setWeight('');
    setHeight('');
    setBloodSugar('');
    setUrgency('Normal');
    setChiefComplaint('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedPatient) {
      alert('Please select a patient first.');
      return;
    }

    if (temp === '' || systolic === '' || diastolic === '' || pulse === '') {
      alert('Core vitals (Temperature, Blood Pressure & Pulse Rate) are required.');
      return;
    }

    setIsSubmitting(true);
    const vitalsId = `VIT-${Math.floor(Math.random() * 100000)}`;
    const newVitals: PatientVitals = {
      id: vitalsId,
      temperature: Number(temp),
      bpSystolic: Number(systolic),
      bpDiastolic: Number(diastolic),
      pulse: Number(pulse),
      respRate: respRate !== '' ? Number(respRate) : undefined,
      spo2: spo2 !== '' ? Number(spo2) : undefined,
      weight: weight !== '' ? Number(weight) : undefined,
      height: height !== '' ? Number(height) : undefined,
      bloodSugar: bloodSugar !== '' ? Number(bloodSugar) : undefined,
      urgency,
      chiefComplaint: chiefComplaint.trim() || 'No active complaints registered.',
      recordedAt: new Date().toISOString(),
      recordedBy: userName,
      recordedByEmail: userEmail
    };

    try {
      await onUpdatePatientVitals(selectedPatientId, newVitals);
      alert(`Vital signs saved successfully for ${selectedPatient.name}.`);
      resetForm();
    } catch (error) {
      console.error(error);
      alert('Error saving vital signs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper range-check functions
  const getTempWarning = (t: number) => {
    if (t > 38.0) return { label: 'High Fever', color: 'text-red-600 bg-red-50 border-red-200' };
    if (t > 37.3) return { label: 'Low Grade Fever', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    if (t < 35.5) return { label: 'Hypothermia', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    return null;
  };

  const getBpWarning = (sys: number, dia: number) => {
    if (sys >= 160 || dia >= 100) return { label: 'Hypertensive Crisis / Stage 2', color: 'text-red-600 bg-red-50 border-red-200' };
    if (sys >= 140 || dia >= 90) return { label: 'Hypertension Stage 1', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    if (sys < 90 || dia < 60) return { label: 'Hypotension (Low BP)', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    return null;
  };

  const getPulseWarning = (p: number) => {
    if (p > 100) return { label: 'Tachycardia (High)', color: 'text-red-400 bg-rose-50' };
    if (p < 60) return { label: 'Bradycardia (Low)', color: 'text-blue-500 bg-blue-50' };
    return null;
  };

  const getSpo2Warning = (s: number) => {
    if (s < 92) return { label: 'Severe Hypoxia (Critically Low SpO2)', color: 'text-red-600 bg-red-50 border-red-200 animate-pulse' };
    if (s < 95) return { label: 'Mild Hypoxia', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    return null;
  };

  return (
    <div className="space-y-6">
      {/* SECTION HEADER CARD */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-3xs">
              <Heart className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 tracking-tight flex items-center gap-2">
                Triage & Physiological Vitals Desk
              </h2>
              <p className="text-xs text-stone-500 max-w-xl leading-normal mt-0.5">
                Record, track, and analyze crucial baseline vital measurements, assess patient urgency level, and capture chief symptoms. Vitals are synced globally for instantaneous physician viewing.
              </p>
            </div>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 shrink-0 text-left md:text-right">
            <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block">Logged In Triage Officer</span>
            <span id="triage-officer-lbl" className="text-xs font-bold text-stone-800 flex items-center gap-1.5 md:justify-end">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> {userName}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Patient Lookup & Historical Lists */}
        <div className="space-y-6 lg:col-span-1">
          {/* LOOKUP PATIENT CARD */}
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" /> 1. Search Register Patient
            </h3>
            
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-stone-400" />
              <input
                id="triage-patient-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, Phone, ID or OP number..."
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:ring-1 focus:ring-rose-500 focus:bg-white outline-hidden font-sans"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-[10px] text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 rounded px-1.5 py-0.5 font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Patients List Results */}
            {searchQuery && (
              <div className="border border-stone-100 rounded-lg max-h-48 overflow-y-auto divide-y divide-stone-100 text-xs shadow-3xs bg-white">
                {filteredPatients.length === 0 ? (
                  <div className="p-3 text-center text-stone-400 text-[11px]">
                    No matching patients found in clinical register.
                  </div>
                ) : (
                  filteredPatients.map((pat) => (
                    <button
                      key={pat.id}
                      type="button"
                      id={`triage-select-pat-${pat.id}`}
                      onClick={() => {
                        setSelectedPatientId(pat.id);
                        setSearchQuery('');
                      }}
                      className={`w-full text-left p-2.5 hover:bg-rose-50/50 transition-colors flex flex-col gap-0.5 ${
                        selectedPatientId === pat.id ? 'bg-rose-50 border-l-3 border-rose-500' : ''
                      }`}
                    >
                      <div className="font-bold text-stone-800 flex justify-between items-center">
                        <span>{pat.name}</span>
                        <span className="text-[10px] font-mono text-stone-400">{pat.id}</span>
                      </div>
                      <div className="text-[10px] text-stone-500 flex items-center justify-between">
                        <span>Age: {pat.age} {pat.ageUnit || 'Years'} • {pat.gender}</span>
                        {pat.opNumber && <span className="font-mono bg-stone-100 px-1 rounded text-stone-500">{pat.opNumber}</span>}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Current Selected Patient Bio Summary */}
            {selectedPatient ? (
              <div id="triage-selected-bio" className="p-4 bg-stone-50 rounded-lg border border-stone-200 space-y-3.5">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-stone-950 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-stone-500" /> {selectedPatient.name}
                    </h4>
                    <span className="text-[10px] text-stone-400 font-mono tracking-wider block mt-0.5">ID: {selectedPatient.id}</span>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedPatientId('');
                      resetForm();
                    }}
                    className="text-[10px] text-rose-600 hover:underline hover:text-rose-700 bg-transparent border-0 cursor-pointer font-semibold"
                  >
                    Change
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] py-2 border-y border-stone-200/60 font-medium text-stone-600">
                  <div>Age/Sex: <span className="text-stone-900 font-bold">{selectedPatient.age} {selectedPatient.ageUnit || 'Years'} / {selectedPatient.gender}</span></div>
                  <div>Phone: <span className="text-stone-900 font-mono font-bold">{selectedPatient.phone || 'N/A'}</span></div>
                  <div>Reg Category: <span className="text-stone-900 font-bold">{selectedPatient.category}</span></div>
                  {selectedPatient.opNumber && <div>OP Number: <span className="text-stone-900 font-mono font-bold">{selectedPatient.opNumber}</span></div>}
                </div>

                {selectedPatient.vitals ? (
                  <div className="bg-emerald-50/50 p-2.5 rounded border border-emerald-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1.5">
                      <Settings className="w-3 h-3 text-emerald-600" /> Active Vitals State (Synced)
                    </span>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px] text-stone-700 font-mono">
                      <div>Temp: <strong className="text-stone-900">{selectedPatient.vitals.temperature}°C</strong></div>
                      <div>BP: <strong className="text-stone-900">{selectedPatient.vitals.bpSystolic}/{selectedPatient.vitals.bpDiastolic}</strong></div>
                      <div>Pulse: <strong className="text-stone-900">{selectedPatient.vitals.pulse} bpm</strong></div>
                    </div>
                    {selectedPatient.vitals.urgency && (
                      <div className="flex items-center gap-1.5 pt-1 text-[10px]">
                        <span className="text-stone-500 font-medium">Triage Priority:</span>
                        <span className={`px-1.5 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                          selectedPatient.vitals.urgency === 'Emergent' ? 'bg-red-500 text-white' :
                          selectedPatient.vitals.urgency === 'Urgent' ? 'bg-amber-500 text-white' :
                          selectedPatient.vitals.urgency === 'Normal' ? 'bg-yellow-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {selectedPatient.vitals.urgency}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-amber-50 p-2.5 rounded border border-amber-100 text-[10px] text-amber-800 font-medium flex items-start gap-1.5 leading-normal">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>No vitals are currently registered for this visit session. Please capture current Physiological details to complete triage.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-stone-400 bg-stone-50 rounded-lg border border-dashed border-stone-200 text-xs">
                Search and select a patient from the hospital directory to record vital baseline readings or review histories.
              </div>
            )}
          </div>

          {/* COLOR CODED TRIAGE GUIDELINES KEY */}
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-3 text-xs">
            <h4 className="font-bold text-stone-800 uppercase tracking-wide text-[10px] flex items-center gap-1 text-stone-500">
              <Layers className="w-3.5 h-3.5" /> Urgency Level Guidance (WHO TRIAGE)
            </h4>
            <div className="space-y-2">
              <div className="flex gap-2 items-start text-[10px] leading-relaxed">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 shrink-0 animate-pulse"></span>
                <div>
                  <strong className="text-red-700 font-bold block">Emergent (Red Category)</strong>
                  <span>Immediate critical care (Severe airway/breathing crisis, active seizures, severe hemorrhages, cardiac event, SpO2 &lt; 92%).</span>
                </div>
              </div>
              <div className="flex gap-2 items-start text-[10px] leading-relaxed">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0"></span>
                <div>
                  <strong className="text-amber-700 font-bold block">Urgent (Orange Category)</strong>
                  <span>High priority parameters (High fever, severe trauma, respiratory stress, unmanageable pain). Route immediately to Clinician.</span>
                </div>
              </div>
              <div className="flex gap-2 items-start text-[10px] leading-relaxed">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 mt-1 shrink-0"></span>
                <div>
                  <strong className="text-stone-800 font-bold block">Normal (Yellow Category)</strong>
                  <span>Standard outpatient consultations (Mild symptoms, stable vitals metrics, chronic therapy check-ups).</span>
                </div>
              </div>
              <div className="flex gap-2 items-start text-[10px] leading-relaxed">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
                <div>
                  <strong className="text-emerald-700 font-bold block">Routine (Green Category)</strong>
                  <span>Non-urgent baseline investigations/screens, local physical assessments, medical wellness consults.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE & RIGHT: Input Form and History Logs */}
        <div className="lg:col-span-2 space-y-6">
          {selectedPatient ? (
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="text-sm font-bold text-stone-950 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-500" /> Record Vitals for: {selectedPatient.name}
                </h3>
                <span className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold py-1 px-2.5 rounded-lg border border-rose-200">
                  Standard Triage Form
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Core Vitals Section */}
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase font-bold text-stone-500 tracking-wider flex items-center gap-1 border-b border-stone-100 pb-1">
                    <Thermometer className="w-3.5 h-3.5 text-stone-500" /> Core Bio-Metrics (Required)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Temperature */}
                    <div className="space-y-1">
                      <label htmlFor="temp" className="block text-[11px] font-bold text-stone-600">Body Temp (°C) *</label>
                      <div className="relative">
                        <input
                          id="temp"
                          type="number"
                          step="0.1"
                          required
                          min={30}
                          max={45}
                          value={temp}
                          onChange={(e) => setTemp(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="e.g. 36.8"
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-rose-500 outline-hidden font-mono"
                        />
                        <span className="absolute right-2.5 top-2 text-[10px] text-stone-400 font-bold">°C</span>
                      </div>
                      {temp !== '' && getTempWarning(Number(temp)) && (
                        <span className={`text-[9px] px-1 rounded block ${getTempWarning(Number(temp))?.color} font-medium`}>
                          {getTempWarning(Number(temp))?.label}
                        </span>
                      )}
                    </div>

                    {/* Blood Pressure Systolic */}
                    <div className="space-y-1">
                      <label htmlFor="systolic" className="block text-[11px] font-bold text-stone-600">BP Systolic (mmHg) *</label>
                      <div className="relative">
                        <input
                          id="systolic"
                          type="number"
                          required
                          min={50}
                          max={250}
                          value={systolic}
                          onChange={(e) => setSystolic(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="e.g. 120"
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-rose-500 outline-hidden font-mono"
                        />
                        <span className="absolute right-2.5 top-2 text-[10px] text-stone-400 font-bold">sys</span>
                      </div>
                    </div>

                    {/* Blood Pressure Diastolic */}
                    <div className="space-y-1">
                      <label htmlFor="diastolic" className="block text-[11px] font-bold text-stone-600">BP Diastolic (mmHg) *</label>
                      <div className="relative">
                        <input
                          id="diastolic"
                          type="number"
                          required
                          min={30}
                          max={150}
                          value={diastolic}
                          onChange={(e) => setDiastolic(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="e.g. 80"
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-rose-500 outline-hidden font-mono"
                        />
                        <span className="absolute right-2.5 top-2 text-[10px] text-stone-400 font-bold">dia</span>
                      </div>
                      {systolic !== '' && diastolic !== '' && getBpWarning(Number(systolic), Number(diastolic)) && (
                        <span className={`text-[9px] px-1 rounded block ${getBpWarning(Number(systolic), Number(diastolic))?.color} font-medium`}>
                          {getBpWarning(Number(systolic), Number(diastolic))?.label}
                        </span>
                      )}
                    </div>

                    {/* Pulse Rate */}
                    <div className="space-y-1">
                      <label htmlFor="pulse" className="block text-[11px] font-bold text-stone-600">Pulse / Heart Rate *</label>
                      <div className="relative">
                        <input
                          id="pulse"
                          type="number"
                          required
                          min={30}
                          max={220}
                          value={pulse}
                          onChange={(e) => setPulse(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="e.g. 72"
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-rose-500 outline-hidden font-mono"
                        />
                        <span className="absolute right-2 text-[10px] text-stone-400 font-bold">bpm</span>
                      </div>
                      {pulse !== '' && getPulseWarning(Number(pulse)) && (
                        <span className="text-[9px] text-amber-600 bg-amber-50 px-1 rounded block font-medium">
                          {getPulseWarning(Number(pulse))?.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Secondary Vitals Parameters */}
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase font-bold text-stone-500 tracking-wider flex items-center gap-1 border-b border-stone-100 pb-1">
                    <Gauge className="w-3.5 h-3.5 text-stone-500" /> Secondary Vitals Parameters (Optional but Recommended)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Respiratory Rate */}
                    <div className="space-y-1">
                      <label htmlFor="resp-rate" className="block text-[11px] font-bold text-stone-600">Resp Rate (/min)</label>
                      <div className="relative">
                        <input
                          id="resp-rate"
                          type="number"
                          min={5}
                          max={60}
                          value={respRate}
                          onChange={(e) => setRespRate(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="e.g. 16"
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-rose-500 outline-hidden font-mono"
                        />
                      </div>
                    </div>

                    {/* Oxygen Saturation (SpO2) */}
                    <div className="space-y-1">
                      <label htmlFor="spo2" className="block text-[11px] font-bold text-stone-600">SpO2 (Oxygen %)</label>
                      <div className="relative">
                        <input
                          id="spo2"
                          type="number"
                          min={40}
                          max={100}
                          value={spo2}
                          onChange={(e) => setSpo2(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="e.g. 98"
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-rose-500 outline-hidden font-mono"
                        />
                        <span className="absolute right-2.5 top-2 text-[10px] text-stone-400 font-bold">%</span>
                      </div>
                      {spo2 !== '' && getSpo2Warning(Number(spo2)) && (
                        <span className={`text-[9px] px-1 rounded block ${getSpo2Warning(Number(spo2))?.color} font-semibold`}>
                          {getSpo2Warning(Number(spo2))?.label}
                        </span>
                      )}
                    </div>

                    {/* Weight */}
                    <div className="space-y-1">
                      <label htmlFor="weight" className="block text-[11px] font-bold text-stone-600">Weight (kg)</label>
                      <div className="relative">
                        <input
                          id="weight"
                          type="number"
                          step="0.1"
                          min={1}
                          max={300}
                          value={weight}
                          onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="e.g. 74.5"
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-rose-500 outline-hidden font-mono"
                        />
                        <span className="absolute right-2.5 top-2 text-[10px] text-stone-400 font-bold">kg</span>
                      </div>
                    </div>

                    {/* Height */}
                    <div className="space-y-1">
                      <label htmlFor="height" className="block text-[11px] font-bold text-stone-600">Height (cm)</label>
                      <div className="relative">
                        <input
                          id="height"
                          type="number"
                          min={30}
                          max={250}
                          value={height}
                          onChange={(e) => setHeight(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="e.g. 172"
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-rose-500 outline-hidden font-mono"
                        />
                        <span className="absolute right-2.5 top-2 text-[10px] text-stone-400 font-bold">cm</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Random Blood Sugar (RBS) */}
                    <div className="space-y-1">
                      <label htmlFor="blood-sugar" className="block text-[11px] font-bold text-stone-600">Random Blood Sugar (mmol/L)</label>
                      <div className="relative">
                        <input
                          id="blood-sugar"
                          type="number"
                          step="0.1"
                          min={1}
                          max={50}
                          value={bloodSugar}
                          onChange={(e) => setBloodSugar(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="e.g. 6.2"
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-rose-500 outline-hidden font-mono"
                        />
                        <span className="absolute right-2.5 top-2 text-[10px] text-stone-400 font-bold">mmol/L</span>
                      </div>
                    </div>

                    {/* Triage Urgency level */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-stone-600">Physiology Triage Category</label>
                      <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setUrgency('Emergent')}
                          className={`py-1.5 text-[10px] rounded-lg font-bold border transition-all ${
                            urgency === 'Emergent' 
                              ? 'bg-red-500 border-red-600 text-white shadow-2xs' 
                              : 'bg-stone-50 hover:bg-red-50 border-stone-200 text-red-600'
                          }`}
                        >
                          Emergent
                        </button>
                        <button
                          type="button"
                          onClick={() => setUrgency('Urgent')}
                          className={`py-1.5 text-[10px] rounded-lg font-bold border transition-all ${
                            urgency === 'Urgent' 
                              ? 'bg-amber-500 border-amber-600 text-white shadow-2xs' 
                              : 'bg-stone-50 hover:bg-amber-50 border-stone-200 text-amber-600'
                          }`}
                        >
                          Urgent
                        </button>
                        <button
                          type="button"
                          onClick={() => setUrgency('Normal')}
                          className={`py-1.5 text-[10px] rounded-lg font-bold border transition-all ${
                            urgency === 'Normal' 
                              ? 'bg-yellow-400 border-yellow-500 text-stone-900 shadow-2xs' 
                              : 'bg-stone-50 hover:bg-yellow-50 border-stone-200 text-stone-700'
                          }`}
                        >
                          Normal
                        </button>
                        <button
                          type="button"
                          onClick={() => setUrgency('Routine')}
                          className={`py-1.5 text-[10px] rounded-lg font-bold border transition-all ${
                            urgency === 'Routine' 
                              ? 'bg-emerald-500 border-emerald-600 text-white shadow-2xs' 
                              : 'bg-stone-50 hover:bg-emerald-50 border-stone-200 text-emerald-600'
                          }`}
                        >
                          Routine
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Complaint / Clinical Notes */}
                <div className="space-y-1">
                  <label htmlFor="complaint" className="block text-[11px] font-bold text-stone-600">Chief Symptoms / Manifest Complaints</label>
                  <textarea
                    id="complaint"
                    rows={3}
                    required
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder="Enter patient primary symptoms, timeline, pain severity, localized physical metrics, or comments..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-rose-500 outline-hidden font-sans"
                  />
                </div>

                {/* Submit button */}
                <button
                  id="btn-triage-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-4 rounded-lg text-xs tracking-wider uppercase transition-transform transform active:scale-99 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {isSubmitting ? 'Saving Vitals Sync...' : 'Save & Route Patient Vitals'}
                </button>
              </form>
            </div>
          ) : null}

          {/* PATIENT VITALS CHRONOLOGICAL HISTORY LEDGER */}
          {selectedPatient ? (
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Patient Physiological Vitals Ledger History
              </h3>

              {!selectedPatient.vitalsHistory || selectedPatient.vitalsHistory.length === 0 ? (
                <div className="text-center py-8 bg-stone-50 rounded-lg border border-dashed border-stone-200 text-xs text-stone-500">
                  No previous baseline vitals logged for this patient.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-stone-100 text-stone-400 font-semibold bg-stone-50/50">
                        <th className="p-3">Record Date</th>
                        <th className="p-3">Vitals Values</th>
                        <th className="p-3">Urgency</th>
                        <th className="p-3">Symptom Summary</th>
                        <th className="p-3">Officer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-medium">
                      {selectedPatient.vitalsHistory.map((vit) => (
                        <tr key={vit.id} className="hover:bg-stone-50/40">
                          <td className="p-3 text-stone-500 whitespace-nowrap">
                            {new Date(vit.recordedAt).toLocaleString('en-KE', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </td>
                          <td className="p-3 space-y-0.5">
                            <div className="flex flex-wrap gap-2 text-[11px] font-mono font-semibold">
                              <span className="bg-stone-100 text-stone-700 px-1 py-0.5 rounded">T: {vit.temperature}°C</span>
                              <span className="bg-stone-100 text-stone-700 px-1 py-0.5 rounded">BP: {vit.bpSystolic}/{vit.bpDiastolic}</span>
                              <span className="bg-stone-100 text-stone-700 px-1 py-0.5 rounded">PR: {vit.pulse}bpm</span>
                              {vit.spo2 && <span className="bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded">SpO2: {vit.spo2}%</span>}
                              {vit.weight && <span className="bg-amber-50 text-amber-700 px-1 py-0.5 rounded">{vit.weight}kg</span>}
                            </div>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                              vit.urgency === 'Emergent' ? 'bg-red-500 text-white animate-pulse' :
                              vit.urgency === 'Urgent' ? 'bg-amber-500 text-white' :
                              vit.urgency === 'Normal' ? 'bg-yellow-100 text-amber-800' :
                              'bg-emerald-100 text-emerald-800'
                            }`}>
                              {vit.urgency}
                            </span>
                          </td>
                          <td className="p-3 text-stone-600 max-w-xs truncate" title={vit.chiefComplaint}>
                            {vit.chiefComplaint}
                          </td>
                          <td className="p-3 text-stone-500 font-mono whitespace-nowrap">
                            {vit.recordedBy}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* DEFAULT DASHBOARD WITH SUMMARY COUNTS WHEN NO PATIENT SELECTED */
            <div className="bg-white p-8 rounded-xl border border-stone-200 shadow-2xs flex flex-col items-center justify-center space-y-4 text-center min-h-[350px]">
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 animate-pulse border border-rose-100">
                <Heart className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="font-bold text-stone-900 text-sm tracking-tight">Physiological Triage Hub Pending Patient Selection</h3>
                <p className="text-xs text-stone-500 leading-normal">
                  Capture vital statistics of outpatients before active clinical diagnosis sessions begin. This prevents errors and assists clinical officers in expediting severe medical conditions.
                </p>
              </div>
              <div className="text-[11px] text-stone-400 font-mono pt-4 flex gap-4">
                <span>⚡ Karatina Satellite Branch Clinical Desk</span>
                <span>•</span>
                <span>🕒 Live-sync active</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
