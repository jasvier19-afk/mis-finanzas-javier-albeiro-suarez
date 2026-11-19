import {
  CURRENT_DAY_OF_MONTH,
  DAYS_IN_MONTH,
  DailySpendingPoint,
  formatCOP,
  formatCompactCOP,
} from '../data/budgetData';

export type ChartMode = 'daily' | 'cumulative';

interface DailyExpensesChartProps {
  series: DailySpendingPoint[];
  monthlyBudget: number;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  mode: ChartMode;
  onModeChange: (mode: ChartMode) => void;
}

interface CoordPoint {
  x: number;
  y: number;
  point: DailySpendingPoint;
}

function buildSmoothSplinePath(
  coords: CoordPoint[],
  minY: number,
  maxY: number
): string {
  if (coords.length === 0) return '';
  if (coords.length === 1) {
    return `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  }

  const clampY = (y: number) => Math.max(minY, Math.min(maxY, y));
  let path = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;

  for (let i = 0; i < coords.length - 1; i += 1) {
    const p0 = coords[Math.max(0, i - 1)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(coords.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = clampY(p1.y + (p2.y - p0.y) / 6);
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = clampY(p2.y - (p3.y - p1.y) / 6);

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return path;
}

export function DailyExpensesChart({
  series,
  monthlyBudget,
  selectedDay,
  onSelectDay,
  mode,
  onModeChange,
}: DailyExpensesChartProps) {
  const activePoints = series.filter((point) => point.hasData);
  const totalSpent = activePoints.reduce((sum, p) => sum + p.total, 0);
  const dailyAverage =
    activePoints.length > 0 ? Math.round(totalSpent / activePoints.length) : 0;

  const highestDay = activePoints.reduce(
    (max, p) => (p.total > max.total ? p : max),
    activePoints[0] ?? { day: 1, dateLabel: '1 nov', total: 0 }
  );

  const selectedPoint =
    activePoints.find((p) => p.day === selectedDay) ??
    activePoints[activePoints.length - 1];

  const svgWidth = 680;
  const svgHeight = 320;
  const padLeft = 52;
  const padRight = 24;
  const padTop = 36;
  const padBottom = 38;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const maxDailyValue = Math.max(...activePoints.map((p) => p.total), 100_000);
  const yMaxDaily = Math.ceil(maxDailyValue / 50_000) * 50_000;
  const maxCumulativeRef = Math.max(monthlyBudget, totalSpent, 500_000);
  const yMaxCumulative = Math.ceil(maxCumulativeRef / 500_000) * 500_000;

  const yMax = mode === 'daily' ? yMaxDaily : yMaxCumulative;
  const yTicks =
    mode === 'daily'
      ? [0, yMaxDaily * 0.25, yMaxDaily * 0.5, yMaxDaily * 0.75, yMaxDaily]
      : [
          0,
          yMaxCumulative * 0.25,
          yMaxCumulative * 0.5,
          yMaxCumulative * 0.75,
          yMaxCumulative,
        ];

  const getY = (value: number) =>
    padTop + plotHeight - (Math.min(value, yMax) / yMax) * plotHeight;

  const getX = (index: number) => {
    if (activePoints.length <= 1) return padLeft + plotWidth / 2;
    return padLeft + (index / (activePoints.length - 1)) * plotWidth;
  };

  const coords: CoordPoint[] = activePoints.map((p, index) => ({
    x: getX(index),
    y: getY(mode === 'daily' ? p.total : p.cumulativeTotal),
    point: p,
  }));

  const splinePath = buildSmoothSplinePath(
    coords,
    padTop,
    padTop + plotHeight
  );

  const areaPath =
    coords.length > 1
      ? `${splinePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(
          padTop + plotHeight
        ).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(
          padTop + plotHeight
        ).toFixed(1)} Z`
      : '';

  const selectedCoord =
    coords.find((c) => c.point.day === selectedPoint.day) ??
    coords[coords.length - 1];

  const tooltipValue =
    mode === 'daily'
      ? formatCOP(selectedPoint.total).replace(' COP', '')
      : formatCOP(selectedPoint.cumulativeTotal).replace(' COP', '');

  const tooltipWidth = Math.max(78, tooltipValue.length * 7.5 + 22);
  const clampedTooltipX = selectedCoord
    ? Math.max(
        padLeft + tooltipWidth / 2,
        Math.min(svgWidth - padRight - tooltipWidth / 2, selectedCoord.x)
      )
    : padLeft + plotWidth / 2;

  const xAxisDays = [1, 5, 9, 13, CURRENT_DAY_OF_MONTH];

  return (
    <section
      aria-labelledby="grafico-gastos-titulo"
      className="h-full bg-[#111625] border border-white/[0.07] rounded-2xl p-5 sm:p-6 flex flex-col justify-between"
    >
      <div>
        {/* Card Header matching mockup */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2
            id="grafico-gastos-titulo"
            className="text-base sm:text-lg font-semibold tracking-tight text-white"
          >
            Comportamiento de Gastos Diarios
          </h2>

          <div
            role="group"
            aria-label="Modo de visualización del gráfico"
            className="inline-flex items-center gap-1 p-1 rounded-full bg-[#181E32] border border-white/[0.06] self-start sm:self-auto"
          >
            <button
              type="button"
              onClick={() => onModeChange('daily')}
              aria-pressed={mode === 'daily'}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase transition-colors cursor-pointer whitespace-nowrap ${
                mode === 'daily'
                  ? 'bg-[#5B3DF5] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Gasto diario</span>
            </button>
            <button
              type="button"
              onClick={() => onModeChange('cumulative')}
              aria-pressed={mode === 'cumulative'}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase transition-colors cursor-pointer whitespace-nowrap ${
                mode === 'cumulative'
                  ? 'bg-[#5B3DF5] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Acumulado</span>
            </button>
          </div>
        </div>

        {/* SVG Smooth Spline Line + Area Chart */}
        <div className="mt-4 w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto select-none"
            role="img"
            aria-label={
              mode === 'daily'
                ? 'Gráfico de comportamiento de gastos diarios de noviembre'
                : 'Gráfico de gasto acumulado frente al presupuesto mensual'
            }
          >
            <defs>
              <linearGradient id="purpleSplineArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5B3DF5" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#5B3DF5" stopOpacity="0.0" />
              </linearGradient>
              <filter id="purpleGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Horizontal dashed grid lines */}
            {yTicks.map((tick) => {
              const y = getY(tick);
              return (
                <g key={tick}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={svgWidth - padRight}
                    y2={y}
                    stroke={tick === 0 ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)'}
                    strokeWidth="1"
                    strokeDasharray={tick === 0 ? undefined : '4 5'}
                  />
                  <text
                    x={padLeft - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-slate-500 text-[11px] tabular-nums"
                  >
                    {formatCompactCOP(tick)}
                  </text>
                </g>
              );
            })}

            {/* Optional budget ceiling line in cumulative mode */}
            {mode === 'cumulative' && (
              <g>
                <line
                  x1={padLeft}
                  y1={getY(monthlyBudget)}
                  x2={svgWidth - padRight}
                  y2={getY(monthlyBudget)}
                  stroke="#34D399"
                  strokeWidth="1.25"
                  strokeDasharray="5 4"
                />
                <text
                  x={svgWidth - padRight}
                  y={getY(monthlyBudget) - 6}
                  textAnchor="end"
                  className="fill-emerald-400 text-[11px] font-medium tabular-nums"
                >
                  Tope ({formatCOP(monthlyBudget)})
                </text>
              </g>
            )}

            {/* Area fill & glowing purple spline */}
            {areaPath && <path d={areaPath} fill="url(#purpleSplineArea)" />}
            {splinePath && (
              <path
                d={splinePath}
                fill="none"
                stroke="#6D54FF"
                strokeWidth="2.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#purpleGlow)"
              />
            )}

            {/* Interactive hit targets & glowing active node */}
            {coords.map(({ x, y, point }) => {
              const isSelected = point.day === selectedPoint.day;
              const slotW = plotWidth / Math.max(1, coords.length);

              return (
                <g
                  key={point.day}
                  className="cursor-pointer"
                  onMouseEnter={() => onSelectDay(point.day)}
                  onClick={() => onSelectDay(point.day)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectDay(point.day);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${point.dateLabel}: ${formatCOP(point.total)}`}
                >
                  <rect
                    x={x - slotW / 2}
                    y={padTop}
                    width={slotW}
                    height={plotHeight}
                    fill="transparent"
                  />

                  {isSelected && (
                    <>
                      <circle cx={x} cy={y} r={10} fill="#5B3DF5" fillOpacity="0.25" />
                      <circle
                        cx={x}
                        cy={y}
                        r={5}
                        fill="#FFFFFF"
                        stroke="#5B3DF5"
                        strokeWidth="3"
                      />
                    </>
                  )}
                </g>
              );
            })}

            {/* Dark floating pill tooltip over active node */}
            {selectedCoord && (
              <g
                transform={`translate(${clampedTooltipX}, ${Math.max(
                  14,
                  selectedCoord.y - 26
                )})`}
                className="pointer-events-none"
              >
                <rect
                  x={-tooltipWidth / 2}
                  y={-13}
                  width={tooltipWidth}
                  height={24}
                  rx={6}
                  fill="#232942"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="1"
                />
                <text
                  x={0}
                  y={3}
                  textAnchor="middle"
                  className="fill-white text-[11px] font-semibold tabular-nums"
                >
                  {tooltipValue}
                </text>
              </g>
            )}

            {/* X-axis day markers */}
            {xAxisDays.map((day) => {
              const match = coords.find((c) => c.point.day === day);
              if (!match) return null;
              return (
                <text
                  key={day}
                  x={match.x}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  className="fill-slate-500 text-[11px] font-medium tabular-nums"
                >
                  {day} nov
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Bottom footer bar matching INICIO DE MES ... HOY + active day info */}
      <div className="mt-3 pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
        <span className="font-semibold tracking-wider uppercase text-slate-500">
          Inicio de mes
        </span>

        <div className="flex flex-wrap items-center gap-3 text-xs tabular-nums">
          <span>
            Día seleccionado:{' '}
            <strong className="text-white">{selectedPoint.dateLabel}</strong> (
            {formatCOP(selectedPoint.total)})
          </span>
          <span className="text-slate-600" aria-hidden="true">
            ·
          </span>
          <span>
            Promedio:{' '}
            <strong className="text-slate-200">{formatCOP(dailyAverage)}</strong>
          </span>
          <span className="text-slate-600 hidden sm:inline" aria-hidden="true">
            ·
          </span>
          <span className="hidden sm:inline">
            Mayor:{' '}
            <strong className="text-slate-200">
              {highestDay.dateLabel} ({formatCOP(highestDay.total)})
            </strong>
          </span>
        </div>

        <span className="font-semibold tracking-wider uppercase text-slate-500">
          Hoy ({DAYS_IN_MONTH - CURRENT_DAY_OF_MONTH}d rest.)
        </span>
      </div>
    </section>
  );
}
