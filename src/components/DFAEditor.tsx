import React, { useState } from 'react';
import { DFA } from '../types/dfa';
import { PRESET_DFAS } from '../utils/dfaPresets';
import { validateDFA } from '../utils/dfaMinimizer';
import { RotateCcw, Sparkles, AlertCircle, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface DFAEditorProps {
  currentDFA: DFA;
  onApplyDFA: (dfa: DFA) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const DFAEditor: React.FC<DFAEditorProps> = ({
  currentDFA,
  onApplyDFA,
  isOpen,
  onClose,
}) => {
  // Working copy in editor state
  const [statesInput, setStatesInput] = useState<string>(currentDFA.states.join(', '));
  const [alphabetInput, setAlphabetInput] = useState<string>(currentDFA.alphabet.join(', '));
  const [startState, setStartState] = useState<string>(currentDFA.startState);
  const [acceptStates, setAcceptStates] = useState<string[]>([...currentDFA.acceptStates]);
  const [transitions, setTransitions] = useState<Record<string, Record<string, string>>>(
    JSON.parse(JSON.stringify(currentDFA.transitions))
  );

  const [selectedPresetId, setSelectedPresetId] = useState<string>('toc_default');

  if (!isOpen) return null;

  // Parsed arrays
  const parsedStates = statesInput
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const parsedAlphabet = alphabetInput
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Build candidate DFA
  const candidateDFA: DFA = {
    states: parsedStates,
    alphabet: parsedAlphabet,
    startState,
    acceptStates,
    transitions,
  };

  const validation = validateDFA(candidateDFA);

  // Transition cell change
  const handleTransitionChange = (fromState: string, symbol: string, toState: string) => {
    setTransitions((prev) => {
      const copy = { ...prev };
      if (!copy[fromState]) copy[fromState] = {};
      copy[fromState] = {
        ...copy[fromState],
        [symbol]: toState,
      };
      return copy;
    });
  };

  // Toggle accept state
  const toggleAcceptState = (state: string) => {
    setAcceptStates((prev) =>
      prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]
    );
  };

  // Add new state helper
  const handleAddState = () => {
    let nextIdx = parsedStates.length;
    let newName = `q${nextIdx}`;
    while (parsedStates.includes(newName)) {
      nextIdx++;
      newName = `q${nextIdx}`;
    }
    const updatedStates = [...parsedStates, newName];
    setStatesInput(updatedStates.join(', '));

    // Default self loops
    setTransitions((prev) => {
      const copy = { ...prev };
      copy[newName] = {};
      parsedAlphabet.forEach((sym) => {
        copy[newName][sym] = newName;
      });
      return copy;
    });
  };

  // Remove state helper
  const handleRemoveState = (stateToRemove: string) => {
    const updatedStates = parsedStates.filter((s) => s !== stateToRemove);
    setStatesInput(updatedStates.join(', '));
    setAcceptStates((prev) => prev.filter((s) => s !== stateToRemove));
    if (startState === stateToRemove && updatedStates.length > 0) {
      setStartState(updatedStates[0]);
    }

    setTransitions((prev) => {
      const copy = { ...prev };
      delete copy[stateToRemove];
      // clean targets pointing to stateToRemove
      Object.keys(copy).forEach((st) => {
        Object.keys(copy[st]).forEach((sym) => {
          if (copy[st][sym] === stateToRemove) {
            copy[st][sym] = updatedStates[0] || '';
          }
        });
      });
      return copy;
    });
  };

  // Load preset
  const handleLoadPreset = (presetId: string) => {
    const preset = PRESET_DFAS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPresetId(presetId);
    setStatesInput(preset.dfa.states.join(', '));
    setAlphabetInput(preset.dfa.alphabet.join(', '));
    setStartState(preset.dfa.startState);
    setAcceptStates([...preset.dfa.acceptStates]);
    setTransitions(JSON.parse(JSON.stringify(preset.dfa.transitions)));
  };

  // Generate random DFA
  const handleGenerateRandom = () => {
    const numStates = 4 + Math.floor(Math.random() * 2); // 4 or 5 states
    const states = Array.from({ length: numStates }, (_, i) => `q${i}`);
    const alphabet = ['0', '1'];
    const sStart = states[0];

    // Pick 1 or 2 random accept states
    const numAccept = 1 + Math.floor(Math.random() * 2);
    const shuffled = [...states].sort(() => 0.5 - Math.random());
    const sAccept = shuffled.slice(0, numAccept);

    const trans: Record<string, Record<string, string>> = {};
    states.forEach((s) => {
      trans[s] = {};
      alphabet.forEach((sym) => {
        const randTarget = states[Math.floor(Math.random() * states.length)];
        trans[s][sym] = randTarget;
      });
    });

    setStatesInput(states.join(', '));
    setAlphabetInput(alphabet.join(', '));
    setStartState(sStart);
    setAcceptStates(sAccept);
    setTransitions(trans);
    setSelectedPresetId('custom');
  };

  // Submit
  const handleSave = () => {
    if (!validation.valid) return;
    onApplyDFA(candidateDFA);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Configure DFA Specification</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Define the 5-tuple: (Q, Σ, δ, q₀, F) or load predefined classroom examples.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold px-2 py-1 rounded"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Preset Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Predefined Educational DFAs</label>
              <button
                type="button"
                onClick={handleGenerateRandom}
                className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Generate Random DFA
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_DFAS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleLoadPreset(preset.id)}
                  className={`text-left p-2.5 rounded-lg border text-xs transition-colors ${
                    selectedPresetId === preset.id
                      ? 'border-indigo-600 bg-indigo-50/60 font-medium text-indigo-950'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="font-semibold text-slate-900">{preset.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* States Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                States Set Q (comma-separated)
              </label>
              <input
                type="text"
                value={statesInput}
                onChange={(e) => setStatesInput(e.target.value)}
                placeholder="q0, q1, q2, q3"
                className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                <span>{parsedStates.length} states entered</span>
                <button
                  type="button"
                  onClick={handleAddState}
                  className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add State
                </button>
              </div>
            </div>

            {/* Alphabet Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alphabet Σ (comma-separated)
              </label>
              <input
                type="text"
                value={alphabetInput}
                onChange={(e) => setAlphabetInput(e.target.value)}
                placeholder="0, 1"
                className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <div className="text-[11px] text-slate-500 mt-1">
                Symbols: {parsedAlphabet.join(', ')}
              </div>
            </div>
          </div>

          {/* Start State & Accept States */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start State q₀
              </label>
              <select
                value={startState}
                onChange={(e) => setStartState(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                {parsedStates.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Accepting / Final States F (click to toggle)
              </label>
              <div className="flex flex-wrap gap-1.5 p-1.5 border border-slate-200 rounded-lg min-h-[38px] bg-white">
                {parsedStates.map((s) => {
                  const isAcc = acceptStates.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleAcceptState(s)}
                      className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                        isAcc
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {isAcc ? `✓ ${s}` : s}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Transition Function Table (δ) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Transition Function Table δ(State, Symbol)
              </label>
              <span className="text-[11px] text-slate-500">
                Select target destination for each transition
              </span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                    <th className="py-2 px-3 font-semibold">State</th>
                    {parsedAlphabet.map((sym) => (
                      <th key={sym} className="py-2 px-3 font-semibold font-mono">
                        Input '{sym}'
                      </th>
                    ))}
                    <th className="py-2 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedStates.map((state) => {
                    const isStart = state === startState;
                    const isAcc = acceptStates.includes(state);

                    return (
                      <tr key={state} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 font-mono font-medium text-slate-800 whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            {isStart && (
                              <span className="text-[10px] text-indigo-600 font-sans font-bold">
                                →
                              </span>
                            )}
                            {state}
                            {isAcc && (
                              <span className="text-[10px] text-emerald-600 font-sans font-bold">
                                *
                              </span>
                            )}
                          </span>
                        </td>
                        {parsedAlphabet.map((sym) => {
                          const currentTarget = transitions[state]?.[sym] || '';
                          return (
                            <td key={sym} className="py-1.5 px-3">
                              <select
                                value={currentTarget}
                                onChange={(e) =>
                                  handleTransitionChange(state, sym, e.target.value)
                                }
                                className={`w-full font-mono text-xs px-2 py-1 border rounded focus:outline-hidden ${
                                  parsedStates.includes(currentTarget)
                                    ? 'border-slate-200 text-slate-800'
                                    : 'border-rose-300 text-rose-600 bg-rose-50'
                                }`}
                              >
                                <option value="">-- select --</option>
                                {parsedStates.map((target) => (
                                  <option key={target} value={target}>
                                    {target}
                                  </option>
                                ))}
                              </select>
                            </td>
                          );
                        })}
                        <td className="py-1.5 px-2 text-right">
                          {parsedStates.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveState(state)}
                              title="Delete State"
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Validation Feedback */}
          {!validation.valid ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Please fix the following DFA configuration issues:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-rose-700 pl-1">
                {validation.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>DFA specification is valid and ready for simulation.</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={() => handleLoadPreset('toc_default')}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Default TOC Example
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!validation.valid}
              className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors ${
                validation.valid
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-xs'
                  : 'bg-slate-300 cursor-not-allowed text-slate-500'
              }`}
            >
              Apply & Start Simulator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
