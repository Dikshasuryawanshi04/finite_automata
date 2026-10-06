import React, { useMemo, useState, useRef } from 'react';
import { DFA } from '../types/dfa';

interface DFAGraphProps {
  dfa: DFA;
  title?: string;
  isMinimized?: boolean;
  highlightStates?: string[]; // states being examined
  equivalentGroups?: { label: string; color: string; states: string[] }[];
  highlightTransitions?: { from: string; to: string; symbol: string; reason?: string }[];
  unreachableStates?: string[];
  selectedStateA?: string | null;
  selectedStateB?: string | null;
  onSelectState?: (state: string) => void;
  hoveredState?: string | null;
  onHoverState?: (state: string | null) => void;
  stateMapping?: Record<string, string>; // original -> min
  activeTraceState?: string | null; // for string simulation
}

interface NodePos {
  id: string;
  x: number;
  y: number;
}

export const DFAGraph: React.FC<DFAGraphProps> = ({
  dfa,
  title,
  isMinimized = false,
  highlightStates = [],
  equivalentGroups = [],
  highlightTransitions = [],
  unreachableStates = [],
  selectedStateA,
  selectedStateB,
  onSelectState,
  hoveredState,
  onHoverState,
  stateMapping,
  activeTraceState,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Calculate default layout positions
  const defaultPositions = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    const n = dfa.states.length;
    const width = 640;
    const height = 440;
    const cx = width / 2;
    const cy = height / 2;

    if (n === 1) {
      pos[dfa.states[0]] = { x: cx, y: cy };
      return pos;
    }

    if (n === 2) {
      pos[dfa.states[0]] = { x: cx - 120, y: cy };
      pos[dfa.states[1]] = { x: cx + 120, y: cy };
      return pos;
    }

    if (n === 3) {
      pos[dfa.states[0]] = { x: cx - 130, y: cy };
      pos[dfa.states[1]] = { x: cx + 50, y: cy - 90 };
      pos[dfa.states[2]] = { x: cx + 50, y: cy + 90 };
      return pos;
    }

    if (n === 4) {
      // 2x2 grid or diamond
      pos[dfa.states[0]] = { x: cx - 150, y: cy - 70 };
      pos[dfa.states[1]] = { x: cx + 120, y: cy - 70 };
      pos[dfa.states[2]] = { x: cx - 150, y: cy + 90 };
      pos[dfa.states[3]] = { x: cx + 120, y: cy + 90 };
      return pos;
    }

    // Circular layout for 5+
    const rx = Math.min(cx - 90, 190);
    const ry = Math.min(cy - 80, 140);
    const startIdx = dfa.states.indexOf(dfa.startState);
    const offsetAngle = startIdx >= 0 ? Math.PI : 0; // put start state on the left

    dfa.states.forEach((s, idx) => {
      const angle = (idx / n) * 2 * Math.PI - offsetAngle;
      pos[s] = {
        x: cx + rx * Math.cos(angle),
        y: cy + ry * Math.sin(angle),
      };
    });

    return pos;
  }, [dfa.states, dfa.startState]);

  // Combined node positions
  const nodePositions: Record<string, NodePos> = useMemo(() => {
    const res: Record<string, NodePos> = {};
    dfa.states.forEach((s) => {
      const p = customPositions[s] || defaultPositions[s] || { x: 300, y: 200 };
      res[s] = { id: s, x: p.x, y: p.y };
    });
    return res;
  }, [dfa.states, customPositions, defaultPositions]);

  // Reset positions handler
  const handleResetPositions = () => {
    setCustomPositions({});
  };

  // Drag handling
  const handleMouseDown = (stateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const curr = nodePositions[stateId];
    setDraggingNode(stateId);
    setDragOffset({
      x: e.clientX - rect.left - curr.x,
      y: e.clientY - rect.top - curr.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNode || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const newX = Math.max(50, Math.min(590, e.clientX - rect.left - dragOffset.x));
    const newY = Math.max(50, Math.min(390, e.clientY - rect.top - dragOffset.y));
    setCustomPositions((prev) => ({
      ...prev,
      [draggingNode]: { x: newX, y: newY },
    }));
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
  };

  // Group transitions: from -> to -> array of symbols
  const transitionsGrouped = useMemo(() => {
    const map = new Map<string, { from: string; to: string; symbols: string[]; isHighlighted: boolean; highlightReason?: string }>();

    for (const from of dfa.states) {
      const stateTransitions = dfa.transitions[from] || {};
      for (const sym of dfa.alphabet) {
        const to = stateTransitions[sym];
        if (!to || !dfa.states.includes(to)) continue;

        const key = `${from}->${to}`;
        const isHigh = highlightTransitions.some(
          (ht) => ht.from === from && ht.to === to && (ht.symbol === sym || ht.symbol === '*')
        );
        const reason = highlightTransitions.find(
          (ht) => ht.from === from && ht.to === to && (ht.symbol === sym || ht.symbol === '*')
        )?.reason;

        if (!map.has(key)) {
          map.set(key, {
            from,
            to,
            symbols: [sym],
            isHighlighted: isHigh,
            highlightReason: reason,
          });
        } else {
          const entry = map.get(key)!;
          if (!entry.symbols.includes(sym)) {
            entry.symbols.push(sym);
          }
          if (isHigh) {
            entry.isHighlighted = true;
            if (reason) entry.highlightReason = reason;
          }
        }
      }
    }

    return Array.from(map.values());
  }, [dfa, highlightTransitions]);

  // Check reciprocal transitions between (A, B) and (B, A)
  const hasReverseTransition = (from: string, to: string) => {
    if (from === to) return false;
    return transitionsGrouped.some((t) => t.from === to && t.to === from);
  };

  // State partition lookup
  const stateToGroup = useMemo(() => {
    const map = new Map<string, { label: string; color: string }>();
    equivalentGroups.forEach((grp) => {
      grp.states.forEach((s) => {
        map.set(s, { label: grp.label, color: grp.color });
      });
    });
    return map;
  }, [equivalentGroups]);

  const radius = 27;

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-900/5 rounded-xl border border-slate-200/80 overflow-hidden select-none">
      {/* Title / Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">
            {title || (isMinimized ? 'Minimized DFA' : 'DFA Transition Graph')}
          </span>
          <span className="text-xs text-slate-600">
            {dfa.states.length} {dfa.states.length === 1 ? 'state' : 'states'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {Object.keys(customPositions).length > 0 && (
            <button
              onClick={handleResetPositions}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-0.5 rounded hover:bg-indigo-50 transition-colors"
              title="Reset state positions to default layout"
            >
              Reset Layout
            </button>
          )}
          <span className="text-xs text-slate-600 hidden sm:inline">Drag nodes to rearrange</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative flex-1 min-h-[360px] bg-white overflow-hidden">
        <svg
          ref={svgRef}
          viewBox="0 0 640 440"
          className="w-full h-full cursor-default"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            {/* Standard arrow marker */}
            <marker
              id={`arrow-normal-${isMinimized ? 'min' : 'orig'}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#64748b" />
            </marker>

            {/* Highlighted arrow marker */}
            <marker
              id={`arrow-highlight-${isMinimized ? 'min' : 'orig'}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#e11d48" />
            </marker>

            {/* Start arrow marker */}
            <marker
              id={`arrow-start-${isMinimized ? 'min' : 'orig'}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#475569" />
            </marker>

            {/* Active Trace arrow */}
            <marker
              id={`arrow-trace-${isMinimized ? 'min' : 'orig'}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#0284c7" />
            </marker>
          </defs>

          {/* Background grid dots for clean engineering aesthetic */}
          <pattern id="grid-dots" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#e2e8f0" />
          </pattern>
          <rect width="640" height="440" fill="url(#grid-dots)" opacity="0.8" />

          {/* 1. Transitions Layer */}
          {transitionsGrouped.map((t, idx) => {
            const pFrom = nodePositions[t.from];
            const pTo = nodePositions[t.to];
            if (!pFrom || !pTo) return null;

            const isSelfLoop = t.from === t.to;
            const hasRecip = hasReverseTransition(t.from, t.to);
            const isHigh = t.isHighlighted;
            const markerId = isHigh
              ? `arrow-highlight-${isMinimized ? 'min' : 'orig'}`
              : `arrow-normal-${isMinimized ? 'min' : 'orig'}`;

            if (isSelfLoop) {
              // Self loop path: calculate direction away from canvas center (300, 200)
              const dx = pFrom.x - 320;
              const dy = pFrom.y - 220;
              const angle = Math.atan2(dy, dx);
              const loopDistance = 56;
              const loopSpan = 26;

              const cosA = Math.cos(angle);
              const sinA = Math.sin(angle);
              const perpX = -sinA;
              const perpY = cosA;

              // Start and end on circumference
              const pStart = {
                x: pFrom.x + radius * Math.cos(angle - 0.45),
                y: pFrom.y + radius * Math.sin(angle - 0.45),
              };
              const pEnd = {
                x: pFrom.x + radius * Math.cos(angle + 0.45),
                y: pFrom.y + radius * Math.sin(angle + 0.45),
              };

              const cp1 = {
                x: pFrom.x + (radius + loopDistance) * cosA - loopSpan * perpX,
                y: pFrom.y + (radius + loopDistance) * sinA - loopSpan * perpY,
              };
              const cp2 = {
                x: pFrom.x + (radius + loopDistance) * cosA + loopSpan * perpX,
                y: pFrom.y + (radius + loopDistance) * sinA + loopSpan * perpY,
              };

              const pathData = `M ${pStart.x} ${pStart.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${pEnd.x} ${pEnd.y}`;
              const labelPos = {
                x: pFrom.x + (radius + loopDistance + 6) * cosA,
                y: pFrom.y + (radius + loopDistance + 6) * sinA,
              };

              return (
                <g key={`loop-${idx}`} className="transition-edge">
                  <path
                    d={pathData}
                    fill="none"
                    stroke={isHigh ? '#e11d48' : '#94a3b8'}
                    strokeWidth={isHigh ? '3' : '1.8'}
                    strokeDasharray={isHigh ? '4 2' : 'none'}
                    markerEnd={`url(#${markerId})`}
                    className="transition-all duration-300"
                  />
                  {/* Label badge */}
                  <g transform={`translate(${labelPos.x}, ${labelPos.y})`}>
                    <rect
                      x="-14"
                      y="-10"
                      width="28"
                      height="20"
                      rx="4"
                      fill={isHigh ? '#ffe4e6' : '#ffffff'}
                      stroke={isHigh ? '#fda4af' : '#cbd5e1'}
                      strokeWidth="1"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      className={`text-xs font-mono font-bold ${
                        isHigh ? 'fill-rose-700' : 'fill-slate-700'
                      }`}
                    >
                      {t.symbols.join(', ')}
                    </text>
                  </g>
                </g>
              );
            }

            // Normal or Curved Transition between two distinct states
            const dx = pTo.x - pFrom.x;
            const dy = pTo.y - pFrom.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 1) return null;

            const unitX = dx / dist;
            const unitY = dy / dist;
            const perpX = -unitY;
            const perpY = unitX;

            // Curvature offset: if reciprocal transition exists, curve to the right
            const curveOffset = hasRecip ? 32 : 0;

            const startX = pFrom.x + unitX * radius + perpX * (curveOffset * 0.2);
            const startY = pFrom.y + unitY * radius + perpY * (curveOffset * 0.2);
            const endX = pTo.x - unitX * (radius + 2) + perpX * (curveOffset * 0.2);
            const endY = pTo.y - unitY * (radius + 2) + perpY * (curveOffset * 0.2);

            // Midpoint with curve offset
            const midX = (startX + endX) / 2 + perpX * curveOffset;
            const midY = (startY + endY) / 2 + perpY * curveOffset;

            const pathData =
              curveOffset !== 0
                ? `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`
                : `M ${startX} ${startY} L ${endX} ${endY}`;

            // Label coordinate
            const labelX = curveOffset !== 0 ? (startX + 2 * midX + endX) / 4 : (startX + endX) / 2;
            const labelY = curveOffset !== 0 ? (startY + 2 * midY + endY) / 4 : (startY + endY) / 2;

            return (
              <g key={`edge-${idx}`} className="transition-edge">
                <path
                  d={pathData}
                  fill="none"
                  stroke={isHigh ? '#e11d48' : '#94a3b8'}
                  strokeWidth={isHigh ? '3' : '1.8'}
                  strokeDasharray={isHigh ? '4 2' : 'none'}
                  markerEnd={`url(#${markerId})`}
                  className="transition-all duration-300"
                />
                {/* Edge Label Badge */}
                <g transform={`translate(${labelX}, ${labelY})`}>
                  <rect
                    x="-14"
                    y="-10"
                    width={t.symbols.length > 2 ? 34 : 28}
                    height="20"
                    rx="4"
                    fill={isHigh ? '#ffe4e6' : '#ffffff'}
                    stroke={isHigh ? '#fda4af' : '#cbd5e1'}
                    strokeWidth="1"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    className={`text-xs font-mono font-bold ${
                      isHigh ? 'fill-rose-700' : 'fill-slate-700'
                    }`}
                  >
                    {t.symbols.join(', ')}
                  </text>
                </g>
              </g>
            );
          })}

          {/* 2. Start State Incoming Indicator */}
          {(() => {
            const startPos = nodePositions[dfa.startState];
            if (!startPos) return null;
            const startArrowLen = 44;
            const pStartX = startPos.x - radius - startArrowLen;
            const pStartY = startPos.y;
            const pEndX = startPos.x - radius - 2;

            return (
              <g className="start-indicator">
                <line
                  x1={pStartX}
                  y1={pStartY}
                  x2={pEndX}
                  y2={pStartY}
                  stroke="#475569"
                  strokeWidth="2.2"
                  markerEnd={`url(#arrow-start-${isMinimized ? 'min' : 'orig'})`}
                />
                <rect
                  x={pStartX - 34}
                  y={pStartY - 10}
                  width="32"
                  height="20"
                  rx="4"
                  fill="#f1f5f9"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
                <text
                  x={pStartX - 18}
                  y={pStartY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-[11px] font-sans font-semibold fill-slate-700"
                >
                  start
                </text>
              </g>
            );
          })()}

          {/* 3. State Nodes Layer */}
          {dfa.states.map((stateId) => {
            const pos = nodePositions[stateId];
            if (!pos) return null;

            const isAccept = dfa.acceptStates.includes(stateId);
            const isUnreachable = unreachableStates.includes(stateId);
            const isExamined = highlightStates.includes(stateId);
            const isTraceActive = activeTraceState === stateId;
            const isSelectedA = selectedStateA === stateId;
            const isSelectedB = selectedStateB === stateId;
            const isHovered = hoveredState === stateId;

            const grp = stateToGroup.get(stateId);
            const classColor = grp?.color || '#0284c7';

            return (
              <g
                key={`node-${stateId}`}
                transform={`translate(${pos.x}, ${pos.y})`}
                className={`cursor-pointer transition-transform ${
                  isUnreachable ? 'opacity-40' : 'opacity-100'
                }`}
                onMouseDown={(e) => handleMouseDown(stateId, e)}
                onClick={() => onSelectState && onSelectState(stateId)}
                onMouseEnter={() => onHoverState && onHoverState(stateId)}
                onMouseLeave={() => onHoverState && onHoverState(null)}
              >
                {/* Partition Halo / Glow if partition assigned */}
                {grp && !isUnreachable && (
                  <circle
                    r={radius + 7}
                    fill="none"
                    stroke={classColor}
                    strokeWidth="3.5"
                    strokeOpacity="0.45"
                  />
                )}

                {/* Examined / Selected Aura */}
                {(isExamined || isSelectedA || isSelectedB || isTraceActive || isHovered) && (
                  <circle
                    r={radius + 11}
                    fill="none"
                    stroke={
                      isTraceActive
                        ? '#0284c7'
                        : isSelectedA || isSelectedB
                        ? '#f59e0b'
                        : isHovered
                        ? '#6366f1'
                        : '#e11d48'
                    }
                    strokeWidth="2.5"
                    strokeDasharray="4 3"
                    className="animate-spin-slow"
                  />
                )}

                {/* Outer Circle */}
                <circle
                  r={radius}
                  fill={
                    isTraceActive
                      ? '#e0f2fe'
                      : isSelectedA || isSelectedB
                      ? '#fef3c7'
                      : isExamined
                      ? '#ffe4e6'
                      : '#ffffff'
                  }
                  stroke={
                    isUnreachable
                      ? '#ef4444'
                      : isTraceActive
                      ? '#0284c7'
                      : isSelectedA || isSelectedB
                      ? '#d97706'
                      : isExamined
                      ? '#e11d48'
                      : grp
                      ? classColor
                      : '#475569'
                  }
                  strokeWidth={isExamined || isSelectedA || isSelectedB ? '3' : '2'}
                  strokeDasharray={isUnreachable ? '4 3' : 'none'}
                  className="shadow-sm transition-colors duration-200"
                />

                {/* Inner Circle for Final / Accept State (Double Circle Standard) */}
                {isAccept && (
                  <circle
                    r={radius - 5.5}
                    fill="none"
                    stroke={
                      isUnreachable
                        ? '#ef4444'
                        : isTraceActive
                        ? '#0284c7'
                        : isSelectedA || isSelectedB
                        ? '#d97706'
                        : isExamined
                        ? '#e11d48'
                        : grp
                        ? classColor
                        : '#475569'
                    }
                    strokeWidth="1.8"
                    strokeDasharray={isUnreachable ? '3 2' : 'none'}
                  />
                )}

                {/* State Label */}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={`text-sm font-mono font-bold select-none ${
                    isUnreachable
                      ? 'fill-red-600 line-through'
                      : isTraceActive
                      ? 'fill-sky-800'
                      : isSelectedA || isSelectedB
                      ? 'fill-amber-900'
                      : isExamined
                      ? 'fill-rose-900'
                      : 'fill-slate-800'
                  }`}
                >
                  {stateId}
                </text>

                {/* Partition Badge (Top) */}
                {grp && !isUnreachable && (
                  <g transform={`translate(0, ${-radius - 13})`}>
                    <rect
                      x="-15"
                      y="-8"
                      width="30"
                      height="16"
                      rx="8"
                      fill={classColor}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="text-[10px] font-mono font-bold fill-white"
                    >
                      {grp.label}
                    </text>
                  </g>
                )}

                {/* Unreachable Tag (Bottom) */}
                {isUnreachable && (
                  <g transform={`translate(0, ${radius + 12})`}>
                    <rect
                      x="-32"
                      y="-7"
                      width="64"
                      height="14"
                      rx="3"
                      fill="#fee2e2"
                      stroke="#fca5a5"
                      strokeWidth="1"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="text-[9px] font-sans font-semibold fill-red-700"
                    >
                      Unreachable
                    </text>
                  </g>
                )}

                {/* Minimized Mapping Tag (Bottom) if in side-by-side or mapped */}
                {stateMapping && stateMapping[stateId] && !isMinimized && !isUnreachable && (
                  <g transform={`translate(0, ${radius + 12})`}>
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="text-[10px] font-mono font-medium fill-slate-600"
                    >
                      → {stateMapping[stateId]}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Legend Overlay at bottom corner */}
        <div className="absolute bottom-2 left-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-700 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-200">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-600 inline-block"></span>
            <span>State</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-double border-slate-700 inline-block"></span>
            <span>Accepting</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-0.5 bg-slate-500 inline-block"></span>
            <span>Transition</span>
          </div>
          {equivalentGroups.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
              <span>Partition</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
