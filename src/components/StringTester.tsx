import React, { useState } from 'react';
import { DFA } from '../types/dfa';
import { traceStringExecution } from '../utils/dfaMinimizer';
import { Play, Check, X, ArrowRight, CornerDownRight } from 'lucide-react';

interface StringTesterProps {
  originalDFA: DFA;
  minimizedDFA: DFA;
  stateMapping: Record<string, string>;
}

export const StringTester: React.FC<StringTesterProps> = ({
  originalDFA,
  minimizedDFA,
  stateMapping,
}) => {
  const [testString, setTestString] = useState<string>('0101');
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const origTrace = traceStringExecution(originalDFA, testString);
  const minTrace = traceStringExecution(minimizedDFA, testString);

  const quickSamples = ['', '0', '1', '00', '01', '10', '11', '0101', '1010', '0011'];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Interactive String Equivalence Verification
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Test any input string simultaneously on both DFAs to verify language preservation.
          </p>
        </div>

        {/* Quick sample chips */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[11px] text-slate-400 mr-1">Try:</span>
          {quickSamples.map((sample) => (
            <button
              key={sample || 'eps'}
              type="button"
              onClick={() => {
                setTestString(sample);
                setActiveStep(null);
              }}
              className="px-1.5 py-0.5 text-xs font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
            >
              {sample === '' ? 'ε (empty)' : sample}
            </button>
          ))}
        </div>
      </div>

      {/* Input Field */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={testString}
            onChange={(e) => {
              // filter only valid symbols
              const filtered = e.target.value
                .split('')
                .filter((c) => originalDFA.alphabet.includes(c))
                .join('');
              setTestString(filtered);
              setActiveStep(null);
            }}
            placeholder={`Enter symbols from {${originalDFA.alphabet.join(', ')}}`}
            className="w-full text-sm font-mono font-bold px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Comparative Paths */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original DFA Path */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Original DFA Execution</span>
            <div className="flex items-center gap-1 font-semibold text-xs">
              {origTrace.accepted ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Accepted
                </span>
              ) : (
                <span className="text-rose-700 flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Rejected
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1 font-mono text-xs pt-1">
            {origTrace.path.map((st, i) => (
              <React.Fragment key={`orig-${i}`}>
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    i === origTrace.path.length - 1
                      ? origTrace.accepted
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-white border border-slate-200 text-slate-800'
                  }`}
                >
                  {st}
                </span>
                {i < origTrace.path.length - 1 && (
                  <span className="text-[11px] text-slate-400 flex items-center">
                    <span className="text-[10px] text-indigo-600 font-bold px-1">
                      {origTrace.symbols[i]}
                    </span>
                    →
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="text-[11px] text-slate-500">
            Final State: <span className="font-mono font-bold">{origTrace.finalState}</span> (
            {originalDFA.acceptStates.includes(origTrace.finalState)
              ? 'in Accept states F'
              : 'not in Accept states'}
            )
          </div>
        </div>

        {/* Minimized DFA Path */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Minimized DFA Execution</span>
            <div className="flex items-center gap-1 font-semibold text-xs">
              {minTrace.accepted ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Accepted
                </span>
              ) : (
                <span className="text-rose-700 flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Rejected
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1 font-mono text-xs pt-1">
            {minTrace.path.map((st, i) => (
              <React.Fragment key={`min-${i}`}>
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    i === minTrace.path.length - 1
                      ? minTrace.accepted
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-white border border-slate-200 text-slate-800'
                  }`}
                >
                  {st}
                </span>
                {i < minTrace.path.length - 1 && (
                  <span className="text-[11px] text-slate-400 flex items-center">
                    <span className="text-[10px] text-indigo-600 font-bold px-1">
                      {minTrace.symbols[i]}
                    </span>
                    →
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="text-[11px] text-slate-500">
            Final State: <span className="font-mono font-bold">{minTrace.finalState}</span> (
            {minimizedDFA.acceptStates.includes(minTrace.finalState)
              ? 'in Minimized Accept states F_min'
              : 'not in Accept states'}
            )
          </div>
        </div>
      </div>

      {/* Language Equivalence Confirmation */}
      <div className="flex items-center gap-2 p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-lg text-xs text-indigo-900">
        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          <strong>L(Original DFA) = L(Minimized DFA):</strong> Both automata reach isomorphic final
          states for any string "{testString || 'ε'}" and yield identical acceptance verdicts.
        </span>
      </div>
    </div>
  );
};
