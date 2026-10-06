export interface DFA {
  states: string[];
  alphabet: string[];
  startState: string;
  acceptStates: string[];
  transitions: Record<string, Record<string, string>>; // state -> symbol -> targetState
}

export interface EquivalenceClass {
  id: string;
  label: string; // e.g. "C1", "C2" or "A", "B"
  states: string[];
  color: string;
}

export type SimulationStage =
  | 'input'
  | 'unreachable'
  | 'initial_partition'
  | 'refinement'
  | 'stable'
  | 'minimized';

export interface StateSignature {
  state: string;
  transitions: Record<string, { targetState: string; targetClassId: string; targetClassLabel: string }>;
  signatureKey: string;
}

export interface SplitEvent {
  parentClassId: string;
  parentClassLabel: string;
  originalStates: string[];
  distinguishingSymbol: string;
  subClasses: {
    label: string;
    states: string[];
    signatureKey: string;
  }[];
  reason: string;
  witnessPair?: {
    stateA: string;
    stateB: string;
    symbol: string;
    targetA: string;
    targetB: string;
    classA: string;
    classB: string;
  };
}

export interface SimulationStep {
  stepNumber: number;
  totalSteps: number;
  stage: SimulationStage;
  stageLabel: string;
  title: string;
  shortExplanation: string;
  detailedExplanation: string;
  keyTakeaway?: string;
  partitionFormula: string; // e.g., "P0 = { {q0, q1, q2}, {q3} }"
  currentPartition: EquivalenceClass[];
  reachableStates: string[];
  unreachableStates: string[];
  examiningStates?: string[];
  examinedClassId?: string;
  stateSignatures?: StateSignature[];
  splitEvent?: SplitEvent;
  highlightTransitions?: {
    from: string;
    to: string;
    symbol: string;
    reason?: string;
  }[];
  minimizedDFA?: DFA;
  stateMapping?: Record<string, string>; // original state -> minimized state label
}

export interface DistinguishabilityResult {
  stateA: string;
  stateB: string;
  areEquivalent: boolean;
  stepSeparated?: number;
  distinguishingSymbol?: string;
  targetA?: string;
  targetB?: string;
  targetClassA?: string;
  targetClassB?: string;
  explanation: string;
  witnessString?: string;
}

export interface TableCellInfo {
  marked: boolean;
  stepMarked?: number;
  distinguishingSymbol?: string;
  reason?: string;
}

export interface TableFillingData {
  states: string[];
  // row state -> col state -> cell info (where row > col in order)
  cells: Record<string, Record<string, TableCellInfo>>;
}
