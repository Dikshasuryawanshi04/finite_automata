import {
  DFA,
  EquivalenceClass,
  SimulationStep,
  StateSignature,
  DistinguishabilityResult,
  TableFillingData,
  TableCellInfo,
} from '../types/dfa';
import { CLASS_PALETTE } from './dfaPresets';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates the DFA definition against TOC requirements.
 */
export function validateDFA(dfa: DFA): ValidationResult {
  const errors: string[] = [];

  if (!dfa.states || dfa.states.length === 0) {
    errors.push('State set cannot be empty.');
    return { valid: false, errors };
  }

  // Check unique states
  const uniqueStates = new Set(dfa.states);
  if (uniqueStates.size !== dfa.states.length) {
    errors.push('Duplicate state names found in the state set.');
  }

  // Check state names format
  for (const s of dfa.states) {
    if (!s || s.trim() === '') {
      errors.push('State names cannot be empty.');
      break;
    }
    if (/\s/.test(s)) {
      errors.push(`State "${s}" contains whitespace. Use alphanumeric names like q0, q1.`);
      break;
    }
  }

  // Check alphabet
  if (!dfa.alphabet || dfa.alphabet.length === 0) {
    errors.push('Alphabet cannot be empty.');
  } else {
    const uniqueSymbols = new Set(dfa.alphabet);
    if (uniqueSymbols.size !== dfa.alphabet.length) {
      errors.push('Duplicate symbols found in the alphabet.');
    }
    for (const sym of dfa.alphabet) {
      if (!sym || sym.trim() === '') {
        errors.push('Alphabet symbols cannot be empty.');
        break;
      }
    }
  }

  // Check start state
  if (!dfa.startState || dfa.startState.trim() === '') {
    errors.push('A start state must be specified.');
  } else if (!uniqueStates.has(dfa.startState)) {
    errors.push(`Start state "${dfa.startState}" is not defined in the state set.`);
  }

  // Check accept states
  if (!dfa.acceptStates || dfa.acceptStates.length === 0) {
    errors.push('At least one accepting/final state is required.');
  } else {
    for (const acc of dfa.acceptStates) {
      if (!uniqueStates.has(acc)) {
        errors.push(`Accepting state "${acc}" is not defined in the state set.`);
      }
    }
  }

  // Check transitions completeness
  for (const s of dfa.states) {
    const stateTransitions = dfa.transitions[s];
    if (!stateTransitions) {
      errors.push(`State "${s}" has no transitions defined.`);
      continue;
    }
    for (const sym of dfa.alphabet) {
      const target = stateTransitions[sym];
      if (target === undefined || target === null || target.trim() === '') {
        errors.push(`Missing transition for state "${s}" on input symbol "${sym}".`);
      } else if (!uniqueStates.has(target)) {
        errors.push(`Unknown destination state "${target}" for transition from "${s}" on "${sym}".`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Step 0: Find all states reachable from the start state using Breadth-First Search.
 */
export function findReachableStates(dfa: DFA): string[] {
  const reachable = new Set<string>();
  const queue: string[] = [];

  if (dfa.states.includes(dfa.startState)) {
    reachable.add(dfa.startState);
    queue.push(dfa.startState);
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const trans = dfa.transitions[current] || {};
    for (const sym of dfa.alphabet) {
      const dest = trans[sym];
      if (dest && dfa.states.includes(dest) && !reachable.has(dest)) {
        reachable.add(dest);
        queue.push(dest);
      }
    }
  }

  // Return reachable states maintaining original order
  return dfa.states.filter((s) => reachable.has(s));
}

/**
 * Removes unreachable states from a DFA, returning a pruned DFA copy.
 */
export function removeUnreachableStates(dfa: DFA): { prunedDFA: DFA; unreachable: string[] } {
  const reachable = findReachableStates(dfa);
  const unreachable = dfa.states.filter((s) => !reachable.includes(s));

  const prunedTransitions: Record<string, Record<string, string>> = {};
  for (const s of reachable) {
    prunedTransitions[s] = {};
    for (const sym of dfa.alphabet) {
      prunedTransitions[s][sym] = dfa.transitions[s]?.[sym];
    }
  }

  const prunedDFA: DFA = {
    states: reachable,
    alphabet: [...dfa.alphabet],
    startState: dfa.startState,
    acceptStates: dfa.acceptStates.filter((s) => reachable.includes(s)),
    transitions: prunedTransitions,
  };

  return { prunedDFA, unreachable };
}

/**
 * Formats a partition into standard mathematical notation: P = { {q0, q1}, {q2} }
 */
export function formatPartitionFormula(partition: EquivalenceClass[], indexLabel: string = 'P'): string {
  if (partition.length === 0) return `${indexLabel} = ∅`;
  const classesStr = partition
    .map((c) => `{${c.states.join(', ')}}`)
    .join(', ');
  return `${indexLabel} = { ${classesStr} }`;
}

/**
 * Computes the state signatures for a given partition.
 */
export function computeSignatures(
  states: string[],
  partition: EquivalenceClass[],
  dfa: DFA
): StateSignature[] {
  const stateToClass = new Map<string, EquivalenceClass>();
  partition.forEach((cls) => {
    cls.states.forEach((s) => stateToClass.set(s, cls));
  });

  return states.map((state) => {
    const transitionsRecord: StateSignature['transitions'] = {};
    const keyParts: string[] = [];

    for (const sym of dfa.alphabet) {
      const targetState = dfa.transitions[state]?.[sym] || '';
      const targetClass = stateToClass.get(targetState);
      const targetClassId = targetClass?.id || 'unknown';
      const targetClassLabel = targetClass?.label || '?';

      transitionsRecord[sym] = {
        targetState,
        targetClassId,
        targetClassLabel,
      };
      keyParts.push(`${sym}:${targetClassLabel}`);
    }

    return {
      state,
      transitions: transitionsRecord,
      signatureKey: keyParts.join(' | '),
    };
  });
}

/**
 * Builds the minimized DFA from the final stable partition.
 */
export function buildMinimizedDFA(
  dfa: DFA,
  stablePartition: EquivalenceClass[]
): {
  minimizedDFA: DFA;
  stateMapping: Record<string, string>;
  classDetails: { label: string; originalStates: string[]; isStart: boolean; isAccept: boolean }[];
} {
  // Label classes with letters: A, B, C, ...
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const stateMapping: Record<string, string> = {};
  const minStates: string[] = [];
  const minAcceptStates: string[] = [];
  let minStartState = '';

  const classDetails: { label: string; originalStates: string[]; isStart: boolean; isAccept: boolean }[] = [];

  stablePartition.forEach((cls, idx) => {
    const minLabel = idx < letters.length ? letters[idx] : `M${idx + 1}`;
    minStates.push(minLabel);

    const isStart = cls.states.includes(dfa.startState);
    if (isStart) {
      minStartState = minLabel;
    }

    const isAccept = cls.states.some((s) => dfa.acceptStates.includes(s));
    if (isAccept) {
      minAcceptStates.push(minLabel);
    }

    cls.states.forEach((s) => {
      stateMapping[s] = minLabel;
    });

    classDetails.push({
      label: minLabel,
      originalStates: [...cls.states],
      isStart,
      isAccept,
    });
  });

  const minTransitions: Record<string, Record<string, string>> = {};
  stablePartition.forEach((cls, idx) => {
    const minLabel = minStates[idx];
    minTransitions[minLabel] = {};

    // Take any representative state from the class
    const repState = cls.states[0];
    for (const sym of dfa.alphabet) {
      const targetOriginal = dfa.transitions[repState]?.[sym];
      minTransitions[minLabel][sym] = targetOriginal ? stateMapping[targetOriginal] : minLabel;
    }
  });

  const minimizedDFA: DFA = {
    states: minStates,
    alphabet: [...dfa.alphabet],
    startState: minStartState || minStates[0] || 'A',
    acceptStates: minAcceptStates,
    transitions: minTransitions,
  };

  return { minimizedDFA, stateMapping, classDetails };
}

/**
 * Generates the full sequence of simulation steps for partition refinement.
 */
export function generateSimulationSteps(rawDFA: DFA): SimulationStep[] {
  const steps: SimulationStep[] = [];

  // Step 0: Find reachable states
  const reachableStates = findReachableStates(rawDFA);
  const unreachableStates = rawDFA.states.filter((s) => !reachableStates.includes(s));

  const hasUnreachable = unreachableStates.length > 0;
  const initialExplanation = hasUnreachable
    ? `Starting from initial state ${rawDFA.startState}, we traverse the transition graph. States {${unreachableStates.join(
        ', '
      )}} cannot be reached by any path. They are removed before minimization.`
    : `Starting from initial state ${rawDFA.startState}, we can reach all states: {${reachableStates.join(
        ', '
      )}}. No unreachable states exist.`;

  // Step 0 Entry: Reachable analysis
  steps.push({
    stepNumber: 0,
    totalSteps: 0, // will patch at end
    stage: 'unreachable',
    stageLabel: 'Step 0: Reachability',
    title: 'Step 0 — Remove Unreachable States',
    shortExplanation: initialExplanation,
    detailedExplanation:
      'Any state that cannot be reached from the start state has zero impact on the recognized language. Removing them first prevents disconnected states from complicating partition refinement.',
    keyTakeaway: 'States that can never be reached on any input string cannot affect language acceptance and are pruned first.',
    partitionFormula: `Q_reachable = { ${reachableStates.join(', ')} }`,
    currentPartition: [
      {
        id: 'initial_all',
        label: 'Q',
        states: reachableStates,
        color: CLASS_PALETTE[0],
      },
    ],
    reachableStates,
    unreachableStates,
  });

  const { prunedDFA } = removeUnreachableStates(rawDFA);

  // Step 1: Initial Partition P0 (Accepting vs Non-accepting)
  const nonAccepting = prunedDFA.states.filter((s) => !prunedDFA.acceptStates.includes(s));
  const accepting = prunedDFA.states.filter((s) => prunedDFA.acceptStates.includes(s));

  let currentPartition: EquivalenceClass[] = [];
  let classIndex = 1;

  if (nonAccepting.length > 0) {
    currentPartition.push({
      id: `C${classIndex}`,
      label: `C${classIndex}`,
      states: nonAccepting,
      color: CLASS_PALETTE[0],
    });
    classIndex++;
  }

  if (accepting.length > 0) {
    currentPartition.push({
      id: `C${classIndex}`,
      label: `C${classIndex}`,
      states: accepting,
      color: CLASS_PALETTE[1 % CLASS_PALETTE.length],
    });
    classIndex++;
  }

  const p0Formula = formatPartitionFormula(currentPartition, 'P0');

  steps.push({
    stepNumber: 1,
    totalSteps: 0,
    stage: 'initial_partition',
    stageLabel: 'Step 1: Initial Partition',
    title: 'Step 1 — Separate Accepting and Non-Accepting States',
    shortExplanation: `Initial partition P0 divides reachable states into non-accepting states and accepting states: ${p0Formula}.`,
    detailedExplanation:
      'Why? An accepting state and a non-accepting state can NEVER be equivalent: on the empty string ε, one state accepts while the other rejects. Hence, the empty string immediately distinguishes them!',
    keyTakeaway:
      'The empty string ε is the 0-distinguishing witness between accepting states and non-accepting states.',
    partitionFormula: p0Formula,
    currentPartition: currentPartition.map((c) => ({ ...c })),
    reachableStates,
    unreachableStates,
    examiningStates: prunedDFA.states,
    stateSignatures: computeSignatures(prunedDFA.states, currentPartition, prunedDFA),
  });

  // Step 2+: Partition Refinement Loop
  let partitionIter = 0;
  let isStable = false;

  while (!isStable) {
    partitionIter++;
    const nextPartition: EquivalenceClass[] = [];
    let splitOccurred = false;
    let iterationSplitEvent: SimulationStep['splitEvent'] = undefined;
    let iterationHighlightedTransitions: SimulationStep['highlightTransitions'] = [];
    const examiningStatesInPass: string[] = [];

    // Map each state to current partition class
    const stateToClassMap = new Map<string, EquivalenceClass>();
    currentPartition.forEach((cls) => {
      cls.states.forEach((s) => stateToClassMap.set(s, cls));
    });

    let nextClassIdCounter = 1;

    // Check each class for splits
    for (const cls of currentPartition) {
      if (cls.states.length <= 1) {
        // Single state cannot split
        nextPartition.push({
          id: `C${nextClassIdCounter}`,
          label: `C${nextClassIdCounter}`,
          states: [...cls.states],
          color: CLASS_PALETTE[(nextClassIdCounter - 1) % CLASS_PALETTE.length],
        });
        nextClassIdCounter++;
        continue;
      }

      // Group states by signature: symbol -> target class ID
      const signatureGroups = new Map<string, string[]>();
      const signatureKeyToDetails = new Map<
        string,
        { symbolToClass: Record<string, { targetState: string; targetClassId: string; targetClassLabel: string }> }
      >();

      for (const s of cls.states) {
        examiningStatesInPass.push(s);
        const transRecord: Record<
          string,
          { targetState: string; targetClassId: string; targetClassLabel: string }
        > = {};
        const keyParts: string[] = [];

        for (const sym of prunedDFA.alphabet) {
          const target = prunedDFA.transitions[s][sym];
          const targetClass = stateToClassMap.get(target)!;
          transRecord[sym] = {
            targetState: target,
            targetClassId: targetClass.id,
            targetClassLabel: targetClass.label,
          };
          keyParts.push(`${sym}->${targetClass.label}`);
        }

        const sigKey = keyParts.join(' | ');
        if (!signatureGroups.has(sigKey)) {
          signatureGroups.set(sigKey, []);
          signatureKeyToDetails.set(sigKey, { symbolToClass: transRecord });
        }
        signatureGroups.get(sigKey)!.push(s);
      }

      if (signatureGroups.size > 1) {
        // A split has occurred in this class!
        splitOccurred = true;

        const subClassesInfo: { label: string; states: string[]; signatureKey: string }[] = [];
        const groupEntries = Array.from(signatureGroups.entries());

        // Find distinguishing pair & symbol for clear explanation
        const firstKey = groupEntries[0][0];
        const secondKey = groupEntries[1][0];
        const stateA = groupEntries[0][1][0];
        const stateB = groupEntries[1][1][0];

        let distinguishingSym = prunedDFA.alphabet[0];
        let targetA = prunedDFA.transitions[stateA][distinguishingSym];
        let targetB = prunedDFA.transitions[stateB][distinguishingSym];
        let classA = stateToClassMap.get(targetA)!.label;
        let classB = stateToClassMap.get(targetB)!.label;

        for (const sym of prunedDFA.alphabet) {
          const tA = prunedDFA.transitions[stateA][sym];
          const tB = prunedDFA.transitions[stateB][sym];
          const cA = stateToClassMap.get(tA)!.label;
          const cB = stateToClassMap.get(tB)!.label;
          if (cA !== cB) {
            distinguishingSym = sym;
            targetA = tA;
            targetB = tB;
            classA = cA;
            classB = cB;
            break;
          }
        }

        groupEntries.forEach(([, states], gIdx) => {
          const newLabel = `C${nextClassIdCounter}`;
          subClassesInfo.push({
            label: newLabel,
            states,
            signatureKey: groupEntries[gIdx][0],
          });

          nextPartition.push({
            id: newLabel,
            label: newLabel,
            states,
            color: CLASS_PALETTE[(nextClassIdCounter - 1) % CLASS_PALETTE.length],
          });
          nextClassIdCounter++;
        });

        iterationSplitEvent = {
          parentClassId: cls.id,
          parentClassLabel: cls.label,
          originalStates: cls.states,
          distinguishingSymbol: distinguishingSym,
          subClasses: subClassesInfo,
          reason: `On input symbol "${distinguishingSym}", state ${stateA} transitions to ${targetA} (in ${classA}) while state ${stateB} transitions to ${targetB} (in ${classB}). Since ${classA} ≠ ${classB}, they must be separated.`,
          witnessPair: {
            stateA,
            stateB,
            symbol: distinguishingSym,
            targetA,
            targetB,
            classA,
            classB,
          },
        };

        iterationHighlightedTransitions.push(
          {
            from: stateA,
            to: targetA,
            symbol: distinguishingSym,
            reason: `${stateA} → ${targetA} (lands in ${classA})`,
          },
          {
            from: stateB,
            to: targetB,
            symbol: distinguishingSym,
            reason: `${stateB} → ${targetB} (lands in ${classB})`,
          }
        );
      } else {
        // No split in this class
        nextPartition.push({
          id: `C${nextClassIdCounter}`,
          label: `C${nextClassIdCounter}`,
          states: [...cls.states],
          color: CLASS_PALETTE[(nextClassIdCounter - 1) % CLASS_PALETTE.length],
        });
        nextClassIdCounter++;
      }
    }

    if (!splitOccurred) {
      isStable = true;
      // Stable step
      const finalFormula = formatPartitionFormula(currentPartition, `P${partitionIter}`);
      const { minimizedDFA, stateMapping } = buildMinimizedDFA(prunedDFA, currentPartition);

      steps.push({
        stepNumber: steps.length,
        totalSteps: 0,
        stage: 'stable',
        stageLabel: `Iteration ${partitionIter}: Stable`,
        title: `Iteration ${partitionIter} — Partition is Stable`,
        shortExplanation: `No class can be further divided because all states in each class have identical transition signatures. Partition P${partitionIter} = P${
          partitionIter - 1
        }.`,
        detailedExplanation: `Every state within the same group transitions to the exact same partition group for every input symbol. No further distinction can ever be discovered. By the Myhill-Nerode theorem, these equivalence classes represent the minimum number of states necessary to recognize this language.`,
        keyTakeaway: 'When P_{k+1} = P_k, the algorithm terminates. Each equivalence class becomes a single state in the minimized DFA.',
        partitionFormula: finalFormula,
        currentPartition: currentPartition.map((c) => ({ ...c })),
        reachableStates,
        unreachableStates,
        stateSignatures: computeSignatures(prunedDFA.states, currentPartition, prunedDFA),
        minimizedDFA,
        stateMapping,
      });
      break;
    } else {
      // Step for this refinement iteration
      const newFormula = formatPartitionFormula(nextPartition, `P${partitionIter}`);
      steps.push({
        stepNumber: steps.length,
        totalSteps: 0,
        stage: 'refinement',
        stageLabel: `Refinement P${partitionIter}`,
        title: `Refinement ${partitionIter} — Signature Comparison & Splitting`,
        shortExplanation: iterationSplitEvent
          ? `${iterationSplitEvent.reason} Partition updated to ${newFormula}.`
          : `States were tested on their transition signatures, producing refined partition ${newFormula}.`,
        detailedExplanation:
          'For each class, we compare where states transition under each alphabet symbol. If two states transition to different classes under the same symbol, they are distinguishable and cannot remain in the same equivalence class.',
        keyTakeaway:
          'States with different transition signatures are split into separate equivalence classes.',
        partitionFormula: newFormula,
        currentPartition: nextPartition.map((c) => ({ ...c })),
        reachableStates,
        unreachableStates,
        examiningStates: examiningStatesInPass,
        stateSignatures: computeSignatures(prunedDFA.states, currentPartition, prunedDFA),
        splitEvent: iterationSplitEvent,
        highlightTransitions: iterationHighlightedTransitions,
      });

      currentPartition = nextPartition;
    }
  }

  // Final Step: Minimized DFA Construction
  const { minimizedDFA, stateMapping, classDetails } = buildMinimizedDFA(prunedDFA, currentPartition);
  const mappingSummary = classDetails
    .map((c) => `{${c.originalStates.join(', ')}} → ${c.label}`)
    .join('; ');

  steps.push({
    stepNumber: steps.length,
    totalSteps: 0,
    stage: 'minimized',
    stageLabel: 'Final Minimized DFA',
    title: 'Step 3 — Construct Minimized DFA',
    shortExplanation: `Final Equivalence Classes: ${mappingSummary}. Minimized from ${rawDFA.states.length} states to ${minimizedDFA.states.length} states.`,
    detailedExplanation:
      'Each final equivalence class is collapsed into a single state in the minimized DFA. The start state is the class containing the original start state. Any class containing an accepting state becomes an accepting state.',
    keyTakeaway:
      'States in the same final equivalence class are provably equivalent. The resulting DFA accepts the exact same regular language with minimal states.',
    partitionFormula: formatPartitionFormula(currentPartition, 'P_final'),
    currentPartition: currentPartition.map((c) => ({ ...c })),
    reachableStates,
    unreachableStates,
    minimizedDFA,
    stateMapping,
  });

  // Patch totalSteps in all steps
  const totalSteps = steps.length;
  steps.forEach((s) => {
    s.totalSteps = totalSteps;
  });

  return steps;
}

/**
 * Computes the full lower-triangular Table-Filling matrix (Myhill-Nerode method)
 * to provide alternative visual verification for students.
 */
export function computeTableFillingMatrix(dfa: DFA): TableFillingData {
  const reachable = findReachableStates(dfa);
  const n = reachable.length;
  const cells: Record<string, Record<string, TableCellInfo>> = {};

  // Initialize cells for all pairs (i > j)
  for (let i = 1; i < n; i++) {
    const s1 = reachable[i];
    cells[s1] = {};
    for (let j = 0; j < i; j++) {
      const s2 = reachable[j];
      cells[s1][s2] = {
        marked: false,
      };
    }
  }

  // Step 1: Mark pairs where one is accepting and one is non-accepting
  const isAccept = (s: string) => dfa.acceptStates.includes(s);
  for (let i = 1; i < n; i++) {
    const s1 = reachable[i];
    for (let j = 0; j < i; j++) {
      const s2 = reachable[j];
      if (isAccept(s1) !== isAccept(s2)) {
        cells[s1][s2] = {
          marked: true,
          stepMarked: 0,
          distinguishingSymbol: 'ε',
          reason: `One state is accepting (${isAccept(s1) ? s1 : s2}) and the other is non-accepting (${
            isAccept(s1) ? s2 : s1
          }), distinguished by empty string ε.`,
        };
      }
    }
  }

  // Step 2: Iterative marking
  let changed = true;
  let round = 1;

  while (changed) {
    changed = false;
    for (let i = 1; i < n; i++) {
      const s1 = reachable[i];
      for (let j = 0; j < i; j++) {
        const s2 = reachable[j];
        if (cells[s1][s2].marked) continue;

        for (const sym of dfa.alphabet) {
          const t1 = dfa.transitions[s1]?.[sym];
          const t2 = dfa.transitions[s2]?.[sym];
          if (!t1 || !t2 || t1 === t2) continue;

          // Look up (t1, t2) in cells
          const idx1 = reachable.indexOf(t1);
          const idx2 = reachable.indexOf(t2);
          if (idx1 === -1 || idx2 === -1) continue;

          const row = idx1 > idx2 ? t1 : t2;
          const col = idx1 > idx2 ? t2 : t1;

          if (cells[row] && cells[row][col] && cells[row][col].marked) {
            cells[s1][s2] = {
              marked: true,
              stepMarked: round,
              distinguishingSymbol: sym,
              reason: `On input "${sym}", ${s1} transitions to ${t1} and ${s2} transitions to ${t2}, which are already distinguished.`,
            };
            changed = true;
            break;
          }
        }
      }
    }
    round++;
  }

  return {
    states: reachable,
    cells,
  };
}

/**
 * Finds why two states are equivalent or distinguishable.
 */
export function explainStatePair(
  stateA: string,
  stateB: string,
  dfa: DFA,
  steps: SimulationStep[]
): DistinguishabilityResult {
  if (stateA === stateB) {
    return {
      stateA,
      stateB,
      areEquivalent: true,
      explanation: `${stateA} is identical to itself. Every state is equivalent to itself (reflexive property).`,
    };
  }

  const finalStep = steps[steps.length - 1];
  const finalPartition = finalStep.currentPartition;

  // Check if they end up in same equivalence class
  const classA = finalPartition.find((c) => c.states.includes(stateA));
  const classB = finalPartition.find((c) => c.states.includes(stateB));

  const areEquivalent = classA !== undefined && classB !== undefined && classA.id === classB.id;

  if (areEquivalent) {
    return {
      stateA,
      stateB,
      areEquivalent: true,
      explanation: `States ${stateA} and ${stateB} belong to the same final equivalence class (${classA?.label || ''} = {${classA?.states.join(', ')}}). For all possible input strings, starting at ${stateA} or ${stateB} leads to identical acceptance decisions. They are equivalent and merge into one state.`,
    };
  }

  // If one is unreachable
  const reachable = findReachableStates(dfa);
  if (!reachable.includes(stateA) || !reachable.includes(stateB)) {
    const unreach = !reachable.includes(stateA) ? stateA : stateB;
    return {
      stateA,
      stateB,
      areEquivalent: false,
      explanation: `State ${unreach} is unreachable from start state ${dfa.startState}. Unreachable states cannot contribute to the language and are removed in Step 0.`,
    };
  }

  // Find the exact step where they were split
  for (let sIdx = 1; sIdx < steps.length; sIdx++) {
    const step = steps[sIdx];
    const partition = step.currentPartition;
    const cA = partition.find((c) => c.states.includes(stateA));
    const cB = partition.find((c) => c.states.includes(stateB));

    if (cA && cB && cA.id !== cB.id) {
      // Split happened at or before this step!
      if (step.stage === 'initial_partition') {
        const isAAcc = dfa.acceptStates.includes(stateA);
        const isBAcc = dfa.acceptStates.includes(stateB);
        return {
          stateA,
          stateB,
          areEquivalent: false,
          stepSeparated: sIdx,
          distinguishingSymbol: 'ε',
          explanation: `${stateA} and ${stateB} are distinguished in Step 1 (Initial Partition). State ${isAAcc ? stateA : stateB} is accepting while ${isAAcc ? stateB : stateA} is non-accepting. Empty string ε immediately distinguishes them!`,
          witnessString: 'ε',
        };
      }

      // Check transition on each symbol
      for (const sym of dfa.alphabet) {
        const tA = dfa.transitions[stateA]?.[sym];
        const tB = dfa.transitions[stateB]?.[sym];
        // previous step partition
        const prevPartition = steps[sIdx - 1].currentPartition;
        const prevCA = prevPartition.find((c) => c.states.includes(tA));
        const prevCB = prevPartition.find((c) => c.states.includes(tB));

        if (prevCA && prevCB && prevCA.id !== prevCB.id) {
          return {
            stateA,
            stateB,
            areEquivalent: false,
            stepSeparated: sIdx,
            distinguishingSymbol: sym,
            targetA: tA,
            targetB: tB,
            targetClassA: prevCA.label,
            targetClassB: prevCB.label,
            explanation: `${stateA} and ${stateB} are distinguished in Step ${sIdx}. On input symbol "${sym}":\n• ${stateA} → ${tA} (belongs to class ${prevCA.label})\n• ${stateB} → ${tB} (belongs to class ${prevCB.label})\nSince ${tA} and ${tB} were already in different equivalence classes, ${stateA} and ${stateB} cannot be equivalent!`,
            witnessString: sym,
          };
        }
      }

      return {
        stateA,
        stateB,
        areEquivalent: false,
        stepSeparated: sIdx,
        explanation: `${stateA} and ${stateB} were split in Step ${sIdx} into classes ${cA.label} and ${cB.label} because their future transition paths diverge.`,
      };
    }
  }

  return {
    stateA,
    stateB,
    areEquivalent: false,
    explanation: `${stateA} and ${stateB} are distinguishable.`,
  };
}

/**
 * Traces execution of an input string on a DFA.
 */
export function traceStringExecution(dfa: DFA, inputString: string): {
  path: string[];
  symbols: string[];
  accepted: boolean;
  finalState: string;
} {
  let currentState = dfa.startState;
  const path: string[] = [currentState];
  const symbols: string[] = [];

  for (const char of inputString) {
    symbols.push(char);
    const nextState = dfa.transitions[currentState]?.[char];
    if (!nextState) {
      return { path, symbols, accepted: false, finalState: currentState };
    }
    currentState = nextState;
    path.push(currentState);
  }

  const accepted = dfa.acceptStates.includes(currentState);
  return { path, symbols, accepted, finalState: currentState };
}
