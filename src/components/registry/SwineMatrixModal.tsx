import React from 'react';
import { X, Sparkles, Scale, Calendar, CheckCircle2, ChevronRight, Info, AlertTriangle } from 'lucide-react';
import { SWINE_GROWTH_MATRIX, GrowthMatrixStage } from '../../utils/swineMatrixCalculator';
import { SwineType } from '../../types';

interface SwineMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAgeWeeks: number;
  currentWeightKg: number;
  onApplyStage: (category: SwineType, benchmarkWeight: number, defaultAgeWeeks: number) => void;
}

export const SwineMatrixModal: React.FC<SwineMatrixModalProps> = ({
  isOpen,
  onClose,
  currentAgeWeeks,
  currentWeightKg,
  onApplyStage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-stone-200 animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20">
              <Sparkles className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                Philippine Swine Performance Standard
              </span>
              <h3 className="text-xl font-black leading-tight">
                Automated Swine Age, Category & Weight Matrix
              </h3>
              <p className="text-xs text-emerald-200 mt-0.5">
                DA-BAI standardized growth velocity, feeding transitions, and market readiness thresholds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-stone-700">
          {/* Quick Explanatory Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-emerald-950">How the Auto-Calculated Matrix Works:</p>
              <p className="text-emerald-900 leading-relaxed text-[11px]">
                Entering a <strong>Birth Date</strong> or <strong>Age in Weeks</strong> automatically determines the swine's biological life stage, sets the benchmark weight, and computes the current market value (₱) based on prevailing Hinunangan farmgate prices. You can also click <strong>"Apply Stage"</strong> to auto-fill the form with benchmark standards.
              </p>
            </div>
          </div>

          {/* Current Swine Reference Pill */}
          <div className="p-3.5 rounded-2xl bg-stone-100 border border-stone-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-600">Currently Inputted Swine:</span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-800 text-white font-bold text-xs">
                {currentAgeWeeks} Weeks (~{Math.round(currentAgeWeeks * 7)} Days)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-stone-800 text-white font-bold text-xs">
                {currentWeightKg} kg Liveweight
              </span>
            </div>
            <span className="text-[11px] text-stone-500 font-medium">
              Municipal Farmgate Benchmark: <strong>₱180 / kg liveweight</strong>
            </span>
          </div>

          {/* Matrix Stages Grid */}
          <div className="space-y-3">
            <h4 className="font-black text-stone-900 text-sm uppercase tracking-wide">
              Official Swine Growth & Feed Stages
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {SWINE_GROWTH_MATRIX.map((stage: GrowthMatrixStage, index: number) => {
                const isCurrentStage =
                  currentAgeWeeks >= stage.ageWeeksRange[0] &&
                  currentAgeWeeks <= stage.ageWeeksRange[1];

                const medianWeight = Number(
                  ((stage.targetWeightRangeKg[0] + stage.targetWeightRangeKg[1]) / 2).toFixed(1)
                );
                const medianWeeks = Number(
                  ((stage.ageWeeksRange[0] + stage.ageWeeksRange[1]) / 2).toFixed(1)
                );

                return (
                  <div
                    key={index}
                    className={`rounded-2xl p-4 border transition-all ${
                      isCurrentStage
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-sm ring-2 ring-emerald-400/40'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-stone-900 text-sm">
                            {stage.categoryLabel}
                          </span>
                          {isCurrentStage && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px] animate-pulse">
                              Active Match
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-stone-500 font-medium">
                          Age: {stage.ageWeeksRange[0]} - {stage.ageWeeksRange[1]} Weeks ({stage.ageDaysRange[0]} - {stage.ageDaysRange[1]} Days)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onApplyStage(stage.category, medianWeight, medianWeeks);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-emerald-700 text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <span>Apply</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    <p className="text-[11px] text-stone-600 mb-3 leading-relaxed">
                      {stage.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/80 p-2.5 rounded-xl border border-stone-200">
                      <div>
                        <span className="text-stone-400 block font-medium">Target Weight:</span>
                        <span className="font-bold text-stone-900">
                          {stage.targetWeightRangeKg[0]} - {stage.targetWeightRangeKg[1]} kg
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block font-medium">Daily Gain (ADG):</span>
                        <span className="font-bold text-emerald-800">
                          +{stage.benchmarkDailyGainGram} g / day
                        </span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-stone-100">
                        <span className="text-stone-400 block font-medium">Feed Protocol:</span>
                        <span className="font-semibold text-stone-800">
                          {stage.recommendedFeed} (~{stage.feedIntakePerDayKg} kg/day)
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                      <span className="text-stone-500">Market Status:</span>
                      <span
                        className={`font-bold ${
                          stage.category === 'finisher'
                            ? 'text-emerald-700'
                            : 'text-stone-600'
                        }`}
                      >
                        {stage.marketReadiness}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Livestock Tape Measurement Formula Card */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-800" />
              <h5 className="font-bold text-amber-950 text-xs">
                Alternative: DA-BAI Livestock Measuring Tape Formula
              </h5>
            </div>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              When a livestock scale is unavailable in remote barangay puroks, technicians use a measuring tape:
            </p>
            <div className="bg-white/80 p-2.5 rounded-xl border border-amber-300 font-mono text-center text-xs font-bold text-amber-950">
              Liveweight (kg) = (Heart Girth in cm)² × Body Length in cm ÷ 11,877
            </div>
            <p className="text-[10px] text-amber-800">
              * Heart Girth is measured around the body immediately behind the front legs. Length is measured from base of ears along spine to base of tail.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs transition cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
