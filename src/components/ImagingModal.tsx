/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { X, Search, Check, Plus, AlertCircle, Sparkles, Film, Activity, ShieldAlert } from 'lucide-react';
import { ImagingRequestItem } from '../types';

export interface ImagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientId: string;
  onConfirmImagingRequests: (requests: ImagingRequestItem[]) => void;
  existingRequests?: ImagingRequestItem[];
}

interface ImagingPreset {
  modality: 'X-Ray' | 'Ultrasound' | 'CT Scan' | 'MRI';
  title: string;
  fee: number;
  description: string;
}

const IMAGING_CATALOG: ImagingPreset[] = [
  // X-Rays
  { modality: 'X-Ray', title: 'Chest X-Ray (PA & Lateral)', fee: 1200, description: 'Evaluate lungs, cardiac outline, pleural space' },
  { modality: 'X-Ray', title: 'Abdomen X-Ray (Erect & Supine)', fee: 1500, description: 'Assess bowel gas pattern, perforation, obstruction' },
  { modality: 'X-Ray', title: 'Pelvis & Hip X-Ray', fee: 1400, description: 'Evaluate pelvic girdle, joint space, fractures' },
  { modality: 'X-Ray', title: 'Spine X-Ray (Cervical/Lumbar)', fee: 1800, description: 'Assess vertebral alignment, disc degeneration' },
  { modality: 'X-Ray', title: 'Extremity / Joint X-Ray', fee: 1200, description: 'Evaluate long bones, joint dislocation, traumatic injury' },
  { modality: 'X-Ray', title: 'Skull & Facial Bones X-Ray', fee: 1400, description: 'Assess cranial vault, paranasal sinuses' },

  // Ultrasounds
  { modality: 'Ultrasound', title: 'Obstetric / Antenatal Ultrasound', fee: 1500, description: 'Fetal biometry, placental localization, amniotic fluid' },
  { modality: 'Ultrasound', title: 'Abdominopelvic Ultrasound', fee: 2500, description: 'Liver, gallbladder, pancreas, spleen, kidneys, urinary bladder' },
  { modality: 'Ultrasound', title: 'Renal & Urinary Tract Ultrasound', fee: 2000, description: 'Kidneys, ureters, bladder (KUB), post-void residual' },
  { modality: 'Ultrasound', title: 'Thyroid & Neck Ultrasound', fee: 2200, description: 'Evaluate thyroid nodules, cervical lymphadenopathy' },
  { modality: 'Ultrasound', title: 'Breast Ultrasound', fee: 2200, description: 'Targeted assessment of palpable breast masses, cysts' },
  { modality: 'Ultrasound', title: 'Doppler Vascular Ultrasound', fee: 3500, description: 'Assess arterial/venous flow, deep vein thrombosis (DVT)' },

  // CT Scans
  { modality: 'CT Scan', title: 'CT Brain / Head (Non-Contrast)', fee: 8500, description: 'Evaluate stroke, acute hemorrhage, trauma, space-occupying lesion' },
  { modality: 'CT Scan', title: 'CT Brain / Head (Contrast Enhanced)', fee: 11000, description: 'Assess intracranial neoplasm, vascular anomaly, infection' },
  { modality: 'CT Scan', title: 'High-Resolution CT Chest (HRCT)', fee: 11000, description: 'Assess interstitial lung disease, bronchiectasis, pulmonary embolus' },
  { modality: 'CT Scan', title: 'CT Abdomen & Pelvis (Triple Phase)', fee: 13500, description: 'Comprehensive evaluation of visceral organs, acute abdomen' },
  { modality: 'CT Scan', title: 'CT Angiography (CTA)', fee: 16000, description: 'Vascular mapping for aneurysm, occlusion, dissection' },
  { modality: 'CT Scan', title: 'CT Spine (Lumbar / Cervical)', fee: 10000, description: 'Detailed osseous spine architecture, canal stenosis' },

  // MRI
  { modality: 'MRI', title: 'MRI Brain (Non-Contrast / Contrast)', fee: 18000, description: 'High resolution soft tissue cranial imaging' },
  { modality: 'MRI', title: 'MRI Spine (Lumbar / Cervical)', fee: 18000, description: 'Assess cord compression, herniated disc, nerve root impingement' },
  { modality: 'MRI', title: 'MRI Knee / Joint', fee: 16000, description: 'Assess cruciate ligaments, meniscal tears, cartilage' },
  { modality: 'MRI', title: 'MRI Abdomen / Pelvis', fee: 20000, description: 'Detailed soft tissue staging, hepatobiliary MRCP' },
];

export function ImagingModal({
  isOpen,
  onClose,
  patientName,
  patientId,
  onConfirmImagingRequests,
  existingRequests = [],
}: ImagingModalProps) {
  const [activeModality, setActiveModality] = useState<'X-Ray' | 'Ultrasound' | 'CT Scan' | 'MRI'>('X-Ray');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Active Form States
  const [selectedTitle, setSelectedTitle] = useState<string>('Chest X-Ray (PA & Lateral)');
  const [customBodyPart, setCustomBodyPart] = useState<string>('');
  const [clinicalIndication, setClinicalIndication] = useState<string>('');
  const [urgency, setUrgency] = useState<'Routine' | 'Urgent' | 'Emergency'>('Routine');
  const [fee, setFee] = useState<number>(1200);

  // Queued List for this order
  const [queuedRequests, setQueuedRequests] = useState<ImagingRequestItem[]>(existingRequests);

  // Filter Catalog
  const filteredCatalog = useMemo(() => {
    return IMAGING_CATALOG.filter((item) => {
      const matchesModality = item.modality === activeModality;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesModality;
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.modality.toLowerCase().includes(q)
      );
    });
  }, [activeModality, searchQuery]);

  // Handle Preset Click
  const handleSelectPreset = (preset: ImagingPreset) => {
    setSelectedTitle(preset.title);
    setCustomBodyPart('');
    setFee(preset.fee);
    setActiveModality(preset.modality);
  };

  // Add Request to Queue
  const handleAddToQueue = () => {
    const finalBodyPart = customBodyPart.trim() || selectedTitle;
    if (!finalBodyPart) {
      alert('Please select or specify an imaging procedure or body region.');
      return;
    }

    const newRequest: ImagingRequestItem = {
      imagingId: `IMG-${Math.floor(10000 + Math.random() * 90000)}`,
      modality: activeModality,
      bodyPart: finalBodyPart,
      clinicalIndication: clinicalIndication.trim() || 'Clinical evaluation requested by attending doctor',
      urgency,
      fee: Number(fee) || 0,
    };

    setQueuedRequests((prev) => [...prev, newRequest]);

    // Reset entry form fields
    setCustomBodyPart('');
    setClinicalIndication('');
    setUrgency('Routine');
  };

  // Remove Request from Queue
  const handleRemoveFromQueue = (index: number) => {
    setQueuedRequests((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Final Confirmation
  const handleConfirmAll = () => {
    if (queuedRequests.length === 0) {
      alert('Please add at least one imaging request to the queue before confirming.');
      return;
    }
    onConfirmImagingRequests(queuedRequests);
    onClose();
  };

  if (!isOpen) return null;

  const totalFee = queuedRequests.reduce((sum, item) => sum + (Number(item.fee) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden font-sans">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 px-6 flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 text-emerald-400 p-2.5 rounded-xl border border-emerald-500/30">
              <Film className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                Radiology & Imaging Diagnostics Order
              </h2>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                Patient: <strong className="text-white font-semibold">{patientName}</strong> ({patientId})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg transition-all cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-stone-50/50">
          
          {/* Modality Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['X-Ray', 'Ultrasound', 'CT Scan', 'MRI'] as const).map((m) => {
              const isActive = activeModality === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setActiveModality(m);
                    // Set default selection from catalog
                    const firstMatch = IMAGING_CATALOG.find((i) => i.modality === m);
                    if (firstMatch) {
                      setSelectedTitle(firstMatch.title);
                      setFee(firstMatch.fee);
                    }
                  }}
                  className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border cursor-pointer ${
                    isActive
                      ? m === 'X-Ray'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                        : m === 'Ultrasound'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                        : m === 'CT Scan'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                        : 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
                  }`}
                >
                  <span>
                    {m === 'X-Ray' && '🩻'}
                    {m === 'Ultrasound' && '🔊'}
                    {m === 'CT Scan' && '🖥️'}
                    {m === 'MRI' && '🧲'}
                  </span>
                  <span>{m}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Catalog Selector Column */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  {activeModality} Standard Catalog ({filteredCatalog.length})
                </label>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeModality} procedure or indication...`}
                  className="w-full bg-white border border-stone-200 rounded-xl py-2 pl-9 pr-8 text-xs outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Preset Cards List */}
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {filteredCatalog.map((preset, idx) => {
                  const isSelected = selectedTitle === preset.title && !customBodyPart;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer text-left relative ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-500'
                          : 'border-stone-200 bg-white hover:border-emerald-300 hover:bg-stone-50/80'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold text-stone-900">{preset.title}</h4>
                        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md shrink-0 ml-2">
                          Ksh {preset.fee.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-1 leading-normal">{preset.description}</p>
                    </div>
                  );
                })}
                {filteredCatalog.length === 0 && (
                  <div className="text-center py-8 text-stone-400 text-xs bg-white rounded-xl border border-stone-200">
                    No matching procedures found in catalog. Use custom input on the right.
                  </div>
                )}
              </div>
            </div>

            {/* Request Builder Column */}
            <div className="lg:col-span-6 bg-white p-4.5 rounded-xl border border-stone-200 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between border-b border-stone-100 pb-2">
                <span>Customize Order Details</span>
                <span className="text-[10px] text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                  Modality: {activeModality}
                </span>
              </h3>

              {/* Title / Body Region */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Examination / Body Region
                </label>
                <input
                  type="text"
                  value={customBodyPart || selectedTitle}
                  onChange={(e) => setCustomBodyPart(e.target.value)}
                  placeholder="e.g. Chest PA View, Abdomen/Pelvis, Knee Joint PA/Lat"
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs font-medium focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-hidden"
                />
                <span className="text-[10px] text-stone-400 mt-0.5 block">
                  Select from left list or type a custom body region title above.
                </span>
              </div>

              {/* Clinical Indication */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Clinical Indication / Diagnostic Notes
                </label>
                <textarea
                  rows={2}
                  value={clinicalIndication}
                  onChange={(e) => setClinicalIndication(e.target.value)}
                  placeholder="e.g. Rule out fracture, persistent cough 3 weeks, acute severe RIF abdominal pain"
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-hidden"
                ></textarea>
              </div>

              {/* Urgency & Fee */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Urgency Priority</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs font-medium focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value="Routine">Routine</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Emergency">Emergency (STAT)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Standard Fee (Ksh)</label>
                  <input
                    type="number"
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs font-mono font-bold focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Add to Queue Button */}
              <button
                type="button"
                onClick={handleAddToQueue}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Request to Imaging Queue
              </button>
            </div>

          </div>

          {/* Queued Items Table */}
          {queuedRequests.length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span>Queued Imaging Orders ({queuedRequests.length})</span>
                </h3>
                <span className="text-xs font-bold font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  Total Fee: Ksh {totalFee.toLocaleString()}
                </span>
              </div>

              <div className="space-y-2 max-h-[160px] overflow-y-auto">
                {queuedRequests.map((req, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-2.5 bg-stone-50 rounded-lg border border-stone-200 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        req.modality === 'X-Ray' ? 'bg-blue-100 text-blue-900' :
                        req.modality === 'Ultrasound' ? 'bg-purple-100 text-purple-900' :
                        req.modality === 'CT Scan' ? 'bg-amber-100 text-amber-900' :
                        'bg-teal-100 text-teal-900'
                      }`}>
                        {req.modality}
                      </span>
                      <div>
                        <strong className="text-stone-900 font-bold block">{req.bodyPart}</strong>
                        <span className="text-[11px] text-stone-500 italic block">Indication: {req.clinicalIndication}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        req.urgency === 'Emergency' ? 'bg-red-500 text-white animate-pulse' :
                        req.urgency === 'Urgent' ? 'bg-amber-500 text-white' : 'bg-stone-200 text-stone-700'
                      }`}>
                        {req.urgency}
                      </span>
                      <span className="font-mono font-bold text-stone-900">
                        Ksh {req.fee.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromQueue(idx)}
                        className="text-stone-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded transition-all cursor-pointer font-bold"
                        title="Remove order"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-stone-100 p-4 px-6 border-t border-stone-200 flex justify-between items-center shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white border border-stone-300 rounded-xl hover:bg-stone-50 transition-all cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleConfirmAll}
            disabled={queuedRequests.length === 0}
            className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
              queuedRequests.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 border border-emerald-500'
                : 'bg-stone-300 text-stone-500 cursor-not-allowed border border-stone-300'
            }`}
          >
            <Check className="w-4 h-4" />
            Attach {queuedRequests.length} Imaging Order{queuedRequests.length === 1 ? '' : 's'} to Consultation Report
          </button>
        </div>

      </div>
    </div>
  );
}
