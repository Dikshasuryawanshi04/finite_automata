import { DFA } from '../types/dfa';

export interface PresetDFA {
  id: string;
  name: string;
  description: string;
  dfa: DFA;
}

export const PRESET_DFAS: PresetDFA[] = [
  {
    id: 'toc_default',
    name: 'Standard TOC 4-State DFA (Default)',
    description: 'The standard 4-state textbook DFA where states q0 and q1 have equivalent long-term behavior.',
    dfa: {
      states: ['q0', 'q1', 'q2', 'q3'],
      alphabet: ['0', '1'],
      startState: 'q0',
      acceptStates: ['q3'],
      transitions: {
        q0: { '0': 'q1', '1': 'q2' },
        q1: { '0': 'q0', '1': 'q3' },
        q2: { '0': 'q3', '1': 'q2' },
        q3: { '0': 'q3', '1': 'q3' },
      },
    },
  },
  {
    id: 'unreachable_state',
    name: 'DFA with Unreachable States',
    description: 'Contains state q4 and q5 that can never be reached from start state q0. Shows step 0 pruning.',
    dfa: {
      states: ['q0', 'q1', 'q2', 'q3', 'q4', 'q5'],
      alphabet: ['0', '1'],
      startState: 'q0',
      acceptStates: ['q2', 'q5'],
      transitions: {
        q0: { '0': 'q1', '1': 'q2' },
        q1: { '0': 'q0', '1': 'q2' },
        q2: { '0': 'q2', '1': 'q2' },
        q3: { '0': 'q1', '1': 'q0' },
        q4: { '0': 'q5', '1': 'q4' },
        q5: { '0': 'q4', '1': 'q0' },
      },
    },
  },
  {
    id: 'classic_hopcroft',
    name: 'Classic 6-State DFA (Minimizes to 3)',
    description: 'Classic textbook 6-state automaton illustrating multiple partition refinement iterations.',
    dfa: {
      states: ['A', 'B', 'C', 'D', 'E', 'F'],
      alphabet: ['0', '1'],
      startState: 'A',
      acceptStates: ['C', 'D', 'E'],
      transitions: {
        A: { '0': 'B', '1': 'C' },
        B: { '0': 'A', '1': 'D' },
        C: { '0': 'E', '1': 'F' },
        D: { '0': 'E', '1': 'F' },
        E: { '0': 'E', '1': 'F' },
        F: { '0': 'F', '1': 'F' },
      },
    },
  },
  {
    id: 'ends_with_01',
    name: 'Language: Strings ending in "01"',
    description: 'Constructed with redundant states. Demonstrates merging identical suffix detectors.',
    dfa: {
      states: ['q0', 'q1', 'q2', 'q3', 'q4'],
      alphabet: ['0', '1'],
      startState: 'q0',
      acceptStates: ['q2', 'q4'],
      transitions: {
        q0: { '0': 'q1', '1': 'q0' },
        q1: { '0': 'q1', '1': 'q2' },
        q2: { '0': 'q3', '1': 'q0' },
        q3: { '0': 'q3', '1': 'q4' },
        q4: { '0': 'q1', '1': 'q0' },
      },
    },
  },
  {
    id: 'already_minimal',
    name: 'Already Minimal DFA (Odd 1s)',
    description: 'A 2-state parity DFA that is already in minimal form, showing immediate stability.',
    dfa: {
      states: ['Even', 'Odd'],
      alphabet: ['0', '1'],
      startState: 'Even',
      acceptStates: ['Odd'],
      transitions: {
        Even: { '0': 'Even', '1': 'Odd' },
        Odd: { '0': 'Odd', '1': 'Even' },
      },
    },
  },
];

export const CLASS_PALETTE = [
  '#0284c7', // Sky blue
  '#059669', // Emerald
  '#d97706', // Amber
  '#7c3aed', // Violet
  '#db2777', // Pink
  '#ea580c', // Orange
  '#0891b2', // Cyan
  '#4f46e5', // Indigo
];
