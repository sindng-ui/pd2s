// C:/AntigravityWorkspace/pd2s/src/components/PriceTrendChart.tsx
import React, { useMemo, useState } from 'react';
import { TrendingUp, CalendarDays, Info } from 'lucide-react';
import { PriceHistoryPoint } from '../types/market.types';
import { SEASON_14_START_DATE } from '../constants/defaultWatchlist';

interface PriceTrendChartProps {
  title: string;
  points: PriceHistoryPoint[];
  seasonOnly: boolean;
  onToggleSeasonOnly: () => void;
}

export const PriceTrendChart: React.FC<PriceTrendChartProps> = React.memo(
  ({ title, points, seasonOnly, onToggleSeasonOnly }) => {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

    const displayPoints = useMemo(() => {
      if (!points || points.length === 0) return [];
      const s14Filtered = points.filter((p) => p.date >= SEASON_14_START_DATE);
      if (seasonOnly && s14Filtered.length > 0) {
        return s14Filtered;
      }
      return points;
    }, [points, seasonOnly]);

    const s14Count = useMemo(
      () => (points || []).filter((p) => p.date >= SEASON_14_START_DATE).length,
      [points]
    );

    if (displayPoints.length === 0) {
      return (
        <div className="rounded-xl border border-gray-800 bg-[#15131b] p-5 text-center text-xs text-gray-400">
          아직 시세 히스토리 포인트가 충분하지 않습니다. (새로고침 시 로컬 스냅샷에 자동 누적됩니다.)
        </div>
      );
    }

    const width = 680;
    const height = 210;
    const padLeft = 48;
    const padRight = 24;
    const padTop = 20;
    const padBottom = 32;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const avgValues = displayPoints.map((p) => p.avgPrice);
    const maValues = displayPoints.map((p) => p.movingAverage ?? p.avgPrice);
    const allVals = [...avgValues, ...maValues].filter((v) => v > 0);
    const minVal = allVals.length ? Math.min(...allVals) * 0.9 : 0;
    const maxVal = allVals.length ? Math.max(...allVals) * 1.1 : 1;
    const valRange = maxVal - minVal || 1;

    const getX = (idx: number) => {
      if (displayPoints.length === 1) return padLeft + plotW / 2;
      return padLeft + (idx / (displayPoints.length - 1)) * plotW;
    };

    const getY = (val: number) => {
      return padTop + plotH - ((val - minVal) / valRange) * plotH;
    };

    const lineCoords = displayPoints.map((pt, i) => `${getX(i)},${getY(pt.avgPrice)}`);
    const maCoords = displayPoints.map(
      (pt, i) => `${getX(i)},${getY(pt.movingAverage ?? pt.avgPrice)}`
    );

    const areaPath =
      displayPoints.length > 1
        ? `M ${getX(0)},${padTop + plotH} L ${lineCoords.join(' L ')} L ${getX(
            displayPoints.length - 1
          )},${padTop + plotH} Z`
        : '';

    const hoveredPoint = hoverIndex !== null ? displayPoints[hoverIndex] : null;

    return (
      <div className="rounded-xl border border-gray-800 bg-[#15131b] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-bold text-amber-100">
              {title} — 날짜별 HR 시세 변동 추이 ({displayPoints.length}일 기록)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleSeasonOnly}
              className={`flex items-center gap-1 rounded border px-2.5 py-1 text-[11px] font-medium transition ${
                seasonOnly
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                  : 'border-gray-700 bg-[#1c1926] text-gray-300'
              }`}
            >
              <CalendarDays className="h-3 w-3" />
              {seasonOnly
                ? `시즌 14 시작일(10/23~) 이후만 보기 (${s14Count}일)`
                : '이전 시즌 포함 최근 추이 전체 보기'}
            </button>
          </div>
        </div>

        {seasonOnly && s14Count <= 2 && points.length > s14Count && (
          <div className="mb-3 flex items-center justify-between rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-[11px] text-amber-200">
            <span className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-amber-400" />
              오늘은 시즌 14 오픈 첫날(Day 1~2)이므로 시즌 14 데이터가 {s14Count}개입니다. 로컬 DB가 매일 자동으로 스냅샷을 누적합니다!
            </span>
            <button
              type="button"
              onClick={onToggleSeasonOnly}
              className="underline font-semibold text-amber-300 hover:text-white"
            >
              과거 30일 흐름도 함께 보기
            </button>
          </div>
        )}

        {/* SVG 인터랙티브 차트 */}
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto select-none overflow-visible"
          >
            <defs>
              <linearGradient id="hrAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* 가로 그리드 라인 (4단) */}
            {[0, 0.33, 0.66, 1].map((ratio, idx) => {
              const y = padTop + plotH * ratio;
              const val = maxVal - valRange * ratio;
              return (
                <g key={idx}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={width - padRight}
                    y2={y}
                    stroke="#262230"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={padLeft - 6}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-gray-500 font-mono text-[10px]"
                  >
                    {val.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* 영역 채우기 */}
            {areaPath && <path d={areaPath} fill="url(#hrAreaGrad)" />}

            {/* 이동평균선 (보라색 점선) */}
            {displayPoints.length > 1 && (
              <polyline
                fill="none"
                stroke="#a855f7"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                points={maCoords.join(' ')}
              />
            )}

            {/* 일별 평균 시세 메인 라인 (황금색) */}
            {displayPoints.length > 1 && (
              <polyline
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2.5"
                points={lineCoords.join(' ')}
              />
            )}

            {/* 데이터 포인트 원 및 호버 영역 */}
            {displayPoints.map((pt, idx) => {
              const cx = getX(idx);
              const cy = getY(pt.avgPrice);
              const isHovered = hoverIndex === idx;
              const isS14 = pt.date >= SEASON_14_START_DATE;

              return (
                <g
                  key={pt.date}
                  onMouseEnter={() => setHoverIndex(idx)}
                  onMouseLeave={() => setHoverIndex(null)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 6 : isS14 ? 4.5 : 3}
                    fill={isS14 ? '#10b981' : '#fbbf24'}
                    stroke="#15131b"
                    strokeWidth="1.5"
                  />
                  {/* X축 날짜 라벨 */}
                  {(idx === 0 ||
                    idx === displayPoints.length - 1 ||
                    idx % Math.max(1, Math.floor(displayPoints.length / 6)) === 0) && (
                    <text
                      x={cx}
                      y={height - 8}
                      textAnchor="middle"
                      className={`font-mono text-[10px] ${
                        isS14 ? 'fill-emerald-400 font-bold' : 'fill-gray-500'
                      }`}
                    >
                      {pt.date.slice(5)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* 호버 툴팁 또는 최신 데이터 요약 바 */}
          <div className="mt-2 flex flex-wrap items-center justify-between rounded-lg border border-gray-800/80 bg-[#121017] px-3 py-2 text-xs">
            {hoveredPoint ? (
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-bold text-amber-200">
                  날짜: {hoveredPoint.date}{' '}
                  {hoveredPoint.date >= SEASON_14_START_DATE && (
                    <span className="ml-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300">
                      Season 14
                    </span>
                  )}
                </span>
                <span>
                  평균/대표가:{' '}
                  <strong className="font-mono text-amber-300">
                    {hoveredPoint.avgPrice} HR
                  </strong>
                </span>
                {hoveredPoint.movingAverage !== undefined && (
                  <span>
                    이동평균:{' '}
                    <strong className="font-mono text-purple-300">
                      {hoveredPoint.movingAverage} HR
                    </strong>
                  </span>
                )}
                {hoveredPoint.minPrice !== undefined && (
                  <span>
                    최저가:{' '}
                    <strong className="font-mono text-emerald-300">
                      {hoveredPoint.minPrice} HR
                    </strong>
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4 text-[11px] text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
                  일자별 평균 시세 (HR)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  시즌 14 (10/23~) 데이터 포인트
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-4 bg-purple-400" />
                  7일 이동평균 추세선
                </span>
              </div>
            )}
            <span className="text-[11px] text-gray-500">
              차트의 점 위에 마우스를 올리면 상세 수치가 표시됩니다
            </span>
          </div>
        </div>

        {/* 일자별 수치 표 (최근 7개 포인트 요약) */}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="py-1.5 px-2">일자 (Date)</th>
                <th className="py-1.5 px-2 text-right">대표 시세 (HR)</th>
                <th className="py-1.5 px-2 text-right">이동평균 (MA)</th>
                <th className="py-1.5 px-2 text-right">최저가 (Min)</th>
                <th className="py-1.5 px-2 text-right">데이터 출처</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 font-mono">
              {[...displayPoints]
                .reverse()
                .slice(0, 7)
                .map((pt) => (
                  <tr key={pt.date} className="hover:bg-white/[0.02]">
                    <td className="py-1.5 px-2 font-sans font-medium text-gray-200">
                      {pt.date}{' '}
                      {pt.date >= SEASON_14_START_DATE && (
                        <span className="ml-1 text-[10px] text-emerald-400 font-bold">
                          [S14]
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 px-2 text-right font-bold text-amber-300">
                      {pt.avgPrice} HR
                    </td>
                    <td className="py-1.5 px-2 text-right text-purple-300">
                      {pt.movingAverage ?? '-'} HR
                    </td>
                    <td className="py-1.5 px-2 text-right text-emerald-300">
                      {pt.minPrice ?? '-'} HR
                    </td>
                    <td className="py-1.5 px-2 text-right font-sans text-[10px] text-gray-400">
                      {pt.source === 'snapshot'
                        ? '로컬 스냅샷 DB'
                        : pt.source === 'listing_derived'
                        ? '실거래 매물 역산'
                        : 'PD2 공식 통계'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);
