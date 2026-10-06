import React from 'react';
import { SimulationStep, DFA } from '../types/dfa';
import { ArrowRight, Split, CheckCircle2, Info } from 'lucide-react';

interface PartitionRefinementTableProps {
  currentStep: SimulationStep;
  dfa: DFA;
  onSelectState?: (state: string) => void;
  selectedState?: string | null;
}

export const PartitionRefinementTable: React.FC<PartitionRefinementTableProps> = ({
  currentStep,
  dfa,
  onSelectState,
  selectedState,
}) => {
  const { currentPartition, stateSignatures, splitEvent, stage } = currentStep;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-4 shadow-xs">
      {/* Partition Formula Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Current Equivalence Classes
          </div>
          <div className="text-sm font-mono font-bold text-indigo-700 mt-0.5">
            {currentStep.partitionFormula}
          </div>
        </div>

        {/* Classes Pill Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {currentPartition.map((cls) => (
            <div
              key={cls.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium border"
              style={{
                borderColor: `${cls.color}40`,
                backgroundColor: `${cls.color}10`,
                color: cls.color,
              }}
            >
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: cls.color }}
              />
              <span className="font-bold">{cls.label}:</span>
              <span>{`{${cls.states.join(', ')}}`}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Split Alert / Reason Banner */}
      {splitEvent && (
        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-amber-900">
            <Split className="w-4 h-4 text-amber-600" />
            <span>
              Partition Split Detected in Class {splitEvent.parentClassLabel}
            </span>
          </div>
          <p className="text-slate-700 leading-relaxed font-sans">
            {splitEvent.reason}
          </p>
          <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
            {splitEvent.subClasses.map((sub) => (
              <span
                key={sub.label}
                className="px-2 py-0.5 bg-white border border-amber-200 rounded text-amber-900"
              >
                <strong>{sub.label}</strong> = {`{${sub.states.join(', ')}}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stable Notification */}
      {stage === 'stable' && (
        <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-xs flex items-start gap-2 text-emerald-900">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-emerald-950">
              Refinement Complete — Partition is Stable
            </div>
            <p className="text-slate-700 mt-0.5 leading-relaxed">
              No further refinement is possible because all states within each group have identical
              transition signatures. Two consecutive partitions are identical: Pₖ₊₁ = Pₖ.
            </p>
          </div>
        </div>
      )}

      {/* State Signatures Matrix Table */}
      {stateSignatures && stateSignatures.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-700 font-medium">
            <span>State Transition Signatures</span>
            <span className="text-[11px] text-slate-600">
              States with identical target classes share a signature
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200/70 rounded-lg">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <th className="py-2 px-3 font-semibold">State</th>
                  <th className="py-2 px-3 font-semibold">Current Class</th>
                  {dfa.alphabet.map((sym) => (
                    <th key={sym} className="py-2 px-3 font-semibold font-mono">
                      δ(s, '{sym}') → Target Class
                    </th>
                  ))}
                  <th className="py-2 px-3 font-semibold font-mono">Full Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stateSignatures.map((sig) => {
                  const currentClass = currentPartition.find((c) =>
                    c.states.includes(sig.state)
                  );
                  const isSelected = selectedState === sig.state;
                  const isExamining = currentStep.examiningStates?.includes(sig.state);

                  return (
                    <tr
                      key={sig.state}
                      onClick={() => onSelectState && onSelectState(sig.state)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-amber-50/70'
                          : isExamining
                          ? 'bg-rose-50/40 hover:bg-rose-50/60'
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full inline-block"
                            style={{ backgroundColor: currentClass?.color || '#94a3b8' }}
                          />
                          {sig.state}
                        </span>
                      </td>

                      <td className="py-2 px-3 font-mono text-slate-700">
                        <span
                          className="px-1.5 py-0.5 rounded text-[11px] font-semibold"
                          style={{
                            backgroundColor: `${currentClass?.color || '#94a3b8'}20`,
                            color: currentClass?.color || '#475569',
                          }}
                        >
                          {currentClass?.label || '—'}
                        </span>
                      </td>

                      {dfa.alphabet.map((sym) => {
                        const target = sig.transitions[sym];
                        return (
                          <td key={sym} className="py-2 px-3 font-mono text-slate-700">
                            <span className="text-slate-500">{target?.targetState}</span>
                            <ArrowRight className="inline w-3 h-3 mx-1 text-slate-400" />
                            <span className="font-semibold text-slate-800">
                              {target?.targetClassLabel}
                            </span>
                          </td>
                        );
                      })}

                      <td className="py-2 px-3 font-mono text-slate-600 font-medium">
                        ({Object.values(sig.transitions)
                          .map((t) => t.targetClassLabel)
                          .join(', ')})
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
