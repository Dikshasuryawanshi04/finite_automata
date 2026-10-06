import React, { useState } from 'react';
import { DFA, TableFillingData, TableCellInfo } from '../types/dfa';
import { computeTableFillingMatrix } from '../utils/dfaMinimizer';
import { Table, Check, X, HelpCircle, Info } from 'lucide-react';

interface TableFillingMatrixViewProps {
  dfa: DFA;
  onSelectPair?: (stateA: string, stateB: string) => void;
}

export const TableFillingMatrixView: React.FC<TableFillingMatrixViewProps> = ({
  dfa,
  onSelectPair,
}) => {
  const tableData: TableFillingData = computeTableFillingMatrix(dfa);
  const { states, cells } = tableData;

  const [activeCell, setActiveCell] = useState<{
    row: string;
    col: string;
    info: TableCellInfo;
  } | null>(null);

  if (states.length <= 1) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
        Need at least 2 reachable states to render table-filling matrix.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700">
            <Table className="w-3.5 h-3.5 text-indigo-600" />
            <span>Table-Filling Method Matrix (Myhill-Nerode)</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Lower-triangular matrix marking distinguishable state pairs. Unmarked cells represent
            equivalent states.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-1">
            <span className="w-5 h-5 flex items-center justify-center font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded text-xs font-mono">
              ✕
            </span>
            <span>Distinguishable</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-5 h-5 flex items-center justify-center font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded text-xs font-mono">
              ≈
            </span>
            <span>Equivalent</span>
          </div>
        </div>
      </div>

      {/* Triangular Matrix */}
      <div className="overflow-x-auto py-2">
        <table className="border-collapse mx-auto select-none">
          <tbody>
            {states.slice(1).map((rowState, rowIdx) => {
              // actual index in states is rowIdx + 1
              return (
                <tr key={rowState}>
                  {/* Row Header */}
                  <th className="font-mono text-xs font-bold text-slate-800 pr-3 text-right">
                    {rowState}
                  </th>

                  {/* Columns from 0 to rowIdx */}
                  {states.slice(0, rowIdx + 1).map((colState) => {
                    const cellInfo = cells[rowState]?.[colState];
                    const isMarked = cellInfo?.marked ?? false;
                    const isSelected =
                      activeCell?.row === rowState && activeCell?.col === colState;

                    return (
                      <td key={colState} className="p-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (cellInfo) {
                              setActiveCell({ row: rowState, col: colState, info: cellInfo });
                              if (onSelectPair) onSelectPair(rowState, colState);
                            }
                          }}
                          className={`w-11 h-11 flex flex-col items-center justify-center rounded-lg border text-xs font-mono transition-all ${
                            isSelected
                              ? 'ring-2 ring-indigo-500 ring-offset-1 z-10'
                              : ''
                          } ${
                            isMarked
                              ? 'bg-rose-50/70 border-rose-200 hover:bg-rose-100/70 text-rose-800'
                              : 'bg-emerald-50/80 border-emerald-200 hover:bg-emerald-100/80 text-emerald-800 font-bold'
                          }`}
                        >
                          <span className="text-xs font-bold">
                            {isMarked ? '✕' : '≈'}
                          </span>
                          {isMarked && cellInfo?.distinguishingSymbol && (
                            <span className="text-[10px] text-slate-500 leading-none">
                              {cellInfo.distinguishingSymbol}
                            </span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Bottom Column Headers */}
            <tr>
              <th className="pr-3"></th>
              {states.slice(0, states.length - 1).map((colState) => (
                <th
                  key={colState}
                  className="font-mono text-xs font-bold text-slate-800 pt-2 text-center w-11"
                >
                  {colState}
                </th>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Active Cell Inspector */}
      {activeCell && (
        <div
          className={`p-3 rounded-lg border text-xs space-y-1.5 transition-all ${
            activeCell.info.marked
              ? 'bg-rose-50 border-rose-200 text-rose-950'
              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
          }`}
        >
          <div className="flex items-center justify-between font-bold">
            <span className="font-mono">
              Pair ({activeCell.row}, {activeCell.col})
            </span>
            <span className="uppercase text-[11px]">
              {activeCell.info.marked ? 'Distinguishable Pair' : 'Equivalent Pair'}
            </span>
          </div>
          <p className="text-slate-700 leading-relaxed font-sans">
            {activeCell.info.marked
              ? activeCell.info.reason ||
                `Distinguished in round ${activeCell.info.stepMarked} on symbol "${activeCell.info.distinguishingSymbol}".`
              : `Never marked during iterative closure. States ${activeCell.row} and ${activeCell.col} are proven equivalent and will be merged.`}
          </p>
        </div>
      )}
    </div>
  );
};
