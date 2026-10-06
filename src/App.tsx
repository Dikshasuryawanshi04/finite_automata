import React, { useState, useEffect, useMemo } from 'react';
import { DFA, SimulationStep } from './types/dfa';
import { PRESET_DFAS } from './utils/dfaPresets';
import { generateSimulationSteps } from './utils/dfaMinimizer';
import { DFAGraph } from './components/DFAGraph';
import { DFAEditor } from './components/DFAEditor';
import { PartitionRefinementTable } from './components/PartitionRefinementTable';
import { EducationalExplanationPanel } from './components/EducationalExplanationPanel';
import { SideBySideComparison } from './components/SideBySideComparison';
import { TableFillingMatrixView } from './components/TableFillingMatrixView';
import { StringTester } from './components/StringTester';
import { SimulationTimeline } from './components/SimulationTimeline';
import { StepControls } from './components/StepControls';
import {
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Eye,
  GitCompare,
  Table,
  PlayCircle,
} from 'lucide-react';

export default function App() {
  // 1. Current DFA State (Default to TOC standard example from specification)
  const [currentDFA, setCurrentDFA] = useState<DFA>(PRESET_DFAS[0].dfa);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);

  // Active Main View Tab
  type ViewMode = 'simulator' | 'sideBySide' | 'tableFilling' | 'stringTester';
  const [viewMode, setViewMode] = useState<ViewMode>('simulator');

  // Simulation steps generated from true algorithm
  const steps: SimulationStep[] = useMemo(() => {
    return generateSimulationSteps(currentDFA);
  }, [currentDFA]);

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Interactive selected states for pairwise equivalence inspection
  const [selectedStateA, setSelectedStateA] = useState<string | null>(null);
  const [selectedStateB, setSelectedStateB] = useState<string | null>(null);

  // Auto-play effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setTimeout(() => {
        if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, 2400 / playbackSpeed);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps.length, playbackSpeed]);

  const currentStep = steps[currentStepIndex] || steps[0];
  const finalStep = steps[steps.length - 1];
  const minimizedDFA = finalStep.minimizedDFA || currentDFA;
  const stateMapping = finalStep.stateMapping || {};

  // Handlers
  const handlePrevStep = () => {
    setIsPlaying(false);
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleNextStep = () => {
    setIsPlaying(false);
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleTogglePlay = () => {
    if (!isPlaying && currentStepIndex >= steps.length - 1) {
      setCurrentStepIndex(0);
    }
    setIsPlaying((prev) => !prev);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const handleShowFinalDFA = () => {
    setIsPlaying(false);
    setCurrentStepIndex(steps.length - 1);
    setViewMode('sideBySide');
  };

  const handleApplyDFA = (newDFA: DFA) => {
    setCurrentDFA(newDFA);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setSelectedStateA(null);
    setSelectedStateB(null);
  };

  // State selection handler on graph
  const handleGraphStateSelect = (stateId: string) => {
    if (!selectedStateA || (selectedStateA && selectedStateB)) {
      setSelectedStateA(stateId);
      setSelectedStateB(null);
    } else if (selectedStateA && !selectedStateB) {
      if (selectedStateA === stateId) {
        setSelectedStateB(null);
      } else {
        setSelectedStateB(stateId);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Bar Contract: Brand single-text | 4 text links | 1-2 primary actions */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200/90 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Zone 1: Single text element wordmark */}
          <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            DFA Minimization Simulator
          </span>

          {/* Zone 2: Clean text navigation links for views */}
          <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium">
            <button
              onClick={() => setViewMode('simulator')}
              className={`transition-colors whitespace-nowrap py-1 ${
                viewMode === 'simulator'
                  ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Step Simulator
            </button>
            <button
              onClick={() => setViewMode('sideBySide')}
              className={`transition-colors whitespace-nowrap py-1 ${
                viewMode === 'sideBySide'
                  ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Side-by-Side Comparison
            </button>
            <button
              onClick={() => setViewMode('tableFilling')}
              className={`transition-colors whitespace-nowrap py-1 ${
                viewMode === 'tableFilling'
                  ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Table-Filling Matrix
            </button>
            <button
              onClick={() => setViewMode('stringTester')}
              className={`transition-colors whitespace-nowrap py-1 ${
                viewMode === 'stringTester'
                  ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              String Tester
            </button>
          </nav>

          {/* Zone 3: Primary actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditorOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Configure DFA</span>
            </button>
          </div>
        </div>

        {/* Mobile View Selector Bar */}
        <div className="md:hidden flex items-center justify-around gap-1 pt-2 border-t border-slate-100 mt-2 text-xs">
          <button
            onClick={() => setViewMode('simulator')}
            className={`py-1 px-2 font-medium ${
              viewMode === 'simulator' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            Simulator
          </button>
          <button
            onClick={() => setViewMode('sideBySide')}
            className={`py-1 px-2 font-medium ${
              viewMode === 'sideBySide' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            Comparison
          </button>
          <button
            onClick={() => setViewMode('tableFilling')}
            className={`py-1 px-2 font-medium ${
              viewMode === 'tableFilling' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            Table Matrix
          </button>
          <button
            onClick={() => setViewMode('stringTester')}
            className={`py-1 px-2 font-medium ${
              viewMode === 'stringTester' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            String Tester
          </button>
        </div>
      </header>

      {/* Main Sandbox Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* VIEW 1: Main Step-by-Step Simulator View */}
        {viewMode === 'simulator' && (
          <div className="space-y-4">
            {/* 1. Progress Timeline */}
            <SimulationTimeline
              steps={steps}
              currentStepIndex={currentStepIndex}
              onSelectStep={(idx) => {
                setIsPlaying(false);
                setCurrentStepIndex(idx);
              }}
            />

            {/* 2. Middle Split: Graph Canvas on Left, Educational Explanation on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Zone: Graph Canvas (7 cols on lg) */}
              <div className="lg:col-span-7 h-[420px] sm:h-[460px]">
                <DFAGraph
                  dfa={currentDFA}
                  title={`DFA Graph — ${currentStep.stageLabel}`}
                  highlightStates={currentStep.examiningStates || []}
                  equivalentGroups={currentStep.currentPartition}
                  highlightTransitions={currentStep.highlightTransitions || []}
                  unreachableStates={
                    currentStep.stage === 'unreachable' ? currentStep.unreachableStates : []
                  }
                  selectedStateA={selectedStateA}
                  selectedStateB={selectedStateB}
                  onSelectState={handleGraphStateSelect}
                  stateMapping={currentStep.stateMapping}
                />
              </div>

              {/* Right Zone: Educational Explanation & Pair Equivalence Inspector (5 cols on lg) */}
              <div className="lg:col-span-5">
                <EducationalExplanationPanel
                  currentStep={currentStep}
                  allSteps={steps}
                  dfa={currentDFA}
                  selectedStateA={selectedStateA}
                  selectedStateB={selectedStateB}
                  onSelectStateA={(s) => setSelectedStateA(s)}
                  onSelectStateB={(s) => setSelectedStateB(s)}
                />
              </div>
            </div>

            {/* 3. Bottom Zone: Partition Refinement Signatures Table */}
            <PartitionRefinementTable
              currentStep={currentStep}
              dfa={currentDFA}
              onSelectState={handleGraphStateSelect}
              selectedState={selectedStateA || selectedStateB}
            />

            {/* 4. Playback Controls Bar */}
            <StepControls
              currentStepIndex={currentStepIndex}
              totalSteps={steps.length}
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              onPrevStep={handlePrevStep}
              onNextStep={handleNextStep}
              onReset={handleReset}
              onShowFinalDFA={handleShowFinalDFA}
              playbackSpeed={playbackSpeed}
              onChangeSpeed={(spd) => setPlaybackSpeed(spd)}
            />
          </div>
        )}

        {/* VIEW 2: Side-by-Side Comparison View */}
        {viewMode === 'sideBySide' && (
          <SideBySideComparison
            originalDFA={currentDFA}
            minimizedDFA={minimizedDFA}
            stateMapping={stateMapping}
            finalPartition={finalStep.currentPartition}
            reachableStates={finalStep.reachableStates}
            onResetOrChangeDFA={() => {
              setIsEditorOpen(true);
            }}
          />
        )}

        {/* VIEW 3: Table-Filling Matrix (Myhill-Nerode) */}
        {viewMode === 'tableFilling' && (
          <TableFillingMatrixView
            dfa={currentDFA}
            onSelectPair={(a, b) => {
              setSelectedStateA(a);
              setSelectedStateB(b);
            }}
          />
        )}

        {/* VIEW 4: String Equivalence Verification Tester */}
        {viewMode === 'stringTester' && (
          <StringTester
            originalDFA={currentDFA}
            minimizedDFA={minimizedDFA}
            stateMapping={stateMapping}
          />
        )}
      </main>

      {/* DFA Editor & Presets Modal */}
      <DFAEditor
        currentDFA={currentDFA}
        onApplyDFA={handleApplyDFA}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
      />

      {/* Clean quiet footer */}
      <footer className="border-t border-slate-200/80 bg-white py-3.5 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Theory of Computation · DFA Minimization & Partition Refinement Simulator</span>
          <div className="flex items-center gap-4 text-slate-600">
            <span>Arrow keys: Step navigation</span>
            <span>·</span>
            <span>Space: Auto play</span>
            <span>·</span>
            <span>R: Reset</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
