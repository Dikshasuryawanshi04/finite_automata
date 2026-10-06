import React, { useState } from 'react';
import { DFA, EquivalenceClass } from '../types/dfa';
import { DFAGraph } from './DFAGraph';
import { CheckCircle2, ArrowRight, Layers, Sparkles, RefreshCw } from 'lucide-react';

interface SideBySideComparisonProps {
  originalDFA: DFA;
  minimizedDFA: DFA;
  stateMapping: Record<string, string>; // original -> min
  finalPartition: EquivalenceClass[];
  reachableStates: string[];
  onResetOrChangeDFA: () => void;
}

export const SideBySideComparison: React.FC<SideBySideComparisonProps> = ({
  originalDFA,
  minimizedDFA,
  stateMapping,
  finalPartition,
  reachableStates,
  onResetOrChangeDFA,
}) => {
  const [hoveredMinState, setHoveredMinState] = useState<string | null>(null);

  // States corresponding to hovered min state
  const highlightedOriginalStates = hoveredMinState
    ? Object.keys(stateMapping).filter((orig) => stateMapping[orig] === hoveredMinState)
    : [];

  const originalCount = originalDFA.states.length;
  const reachableCount = reachableStates.length;
  const minimizedCount = minimizedDFA.states.length;
  const eliminatedCount = originalCount - minimizedCount;

  return (
    <div className="space-y-6">
      {/* Learning Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Original States
          </div>
          <div className="text-2xl font-bold font-mono text-slate-800 mt-1 tabular-nums">
            {originalCount}
          </div>
          <div className="text-[11px] text-slate-600 mt-0.5">
            Set: {'{' + originalDFA.states.join(', ') + '}'}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Reachable States
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-700 mt-1 tabular-nums">
            {reachableCount}
          </div>
          <div className="text-[11px] text-slate-600 mt-0.5">
            {originalCount - reachableCount > 0
              ? `${originalCount - reachableCount} unreachable removed`
              : 'All reachable'}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Final Equivalence Classes
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
            {finalPartition.length}
          </div>
          <div className="text-[11px] text-slate-600 mt-0.5">
            Stable partition blocks
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Minimized States
          </div>
          <div className="text-2xl font-bold font-mono text-sky-700 mt-1 tabular-nums">
            {minimizedCount}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            {eliminatedCount > 0 ? `${eliminatedCount} states eliminated` : 'Already minimal'}
          </div>
        </div>
      </div>

      {/* Side-by-Side DFA Graph Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Original DFA */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
            <span>Original DFA Graph</span>
            <span className="text-slate-500 font-normal">
              Hover over a merged class to highlight
            </span>
          </div>
          <div className="h-[400px]">
            <DFAGraph
              dfa={originalDFA}
              title="Original DFA"
              highlightStates={highlightedOriginalStates}
              equivalentGroups={finalPartition}
              stateMapping={stateMapping}
            />
          </div>
        </div>

        {/* Right: Minimized DFA */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
            <span>Minimized DFA Graph</span>
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Canonical Minimal Form
            </span>
          </div>
          <div className="h-[400px]">
            <DFAGraph
              dfa={minimizedDFA}
              title="Minimized DFA"
              isMinimized={true}
              hoveredState={hoveredMinState}
              onHoverState={(st) => setHoveredMinState(st)}
            />
          </div>
        </div>
      </div>

      {/* State Merging Mapping & Minimized Transition Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mapping Cards */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>State Merging Map</span>
          </div>

          <div className="space-y-2">
            {finalPartition.map((cls, idx) => {
              const minName = minimizedDFA.states[idx] || `M${idx}`;
              const isStart = cls.states.includes(originalDFA.startState);
              const isAccept = cls.states.some((s) => originalDFA.acceptStates.includes(s));
              const isHovered = hoveredMinState === minName;

              return (
                <div
                  key={cls.id}
                  onMouseEnter={() => setHoveredMinState(minName)}
                  onMouseLeave={() => setHoveredMinState(null)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                    isHovered
                      ? 'border-indigo-500 bg-indigo-50/70 shadow-xs'
                      : 'border-slate-200/70 bg-slate-50/40 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cls.color }}
                    />
                    <span className="font-mono text-xs font-medium text-slate-700">
                      {cls.states.join(' + ')}
                    </span>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {minName}
                    </span>
                    {isStart && (
                      <span className="text-[10px] font-sans font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                        start
                      </span>
                    )}
                    {isAccept && (
                      <span className="text-[10px] font-sans font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        accepting
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Minimized Transition Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">
              Minimized Transition Table δ_min
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Alphabet: {'{' + minimizedDFA.alphabet.join(', ') + '}'}
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200/70 rounded-lg">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <th className="py-2 px-3 font-semibold">State</th>
                  {minimizedDFA.alphabet.map((sym) => (
                    <th key={sym} className="py-2 px-3 font-semibold font-mono">
                      Input '{sym}'
                    </th>
                  ))}
                  <th className="py-2 px-3 font-semibold">Properties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {minimizedDFA.states.map((st) => {
                  const isStart = st === minimizedDFA.startState;
                  const isAccept = minimizedDFA.acceptStates.includes(st);
                  const isHovered = hoveredMinState === st;

                  return (
                    <tr
                      key={st}
                      onMouseEnter={() => setHoveredMinState(st)}
                      onMouseLeave={() => setHoveredMinState(null)}
                      className={`font-mono transition-colors ${
                        isHovered ? 'bg-indigo-50/60' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="py-2 px-3 font-bold text-slate-900">{st}</td>
                      {minimizedDFA.alphabet.map((sym) => (
                        <td key={sym} className="py-2 px-3 text-slate-700">
                          {minimizedDFA.transitions[st]?.[sym] || '—'}
                        </td>
                      ))}
                      <td className="py-2 px-3 font-sans text-[11px] text-slate-600">
                        {isStart && <span className="mr-1.5 text-indigo-700 font-medium">Start</span>}
                        {isAccept && <span className="text-emerald-700 font-medium">Accepting</span>}
                        {!isStart && !isAccept && <span className="text-slate-400">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Final Learning Conclusion Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Minimization Complete</h4>
          </div>
          <button
            onClick={onResetOrChangeDFA}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Run Again With Another DFA
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl font-sans">
          States in the same final equivalence class are equivalent and can be merged into a single
          state. The resulting DFA accepts exactly the same regular language as the original DFA,
          with the absolute minimum number of states guaranteed by the Myhill-Nerode theorem.
        </p>
      </div>
    </div>
  );
};
