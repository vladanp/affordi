import type { KeyboardEvent, PointerEvent } from 'react';

import type { BillsSummary } from '../domain/bills';
import type { Translator } from '../domain/i18n';
import { formatCurrency, type CurrencyCode } from '../domain/locale';
import { monthStart, parseMonth } from '../domain/months';

const HIDDEN_DOTS = '••••';

function monthDate(value: string): Date {
  const month = parseMonth(value);
  return month === null ? new Date(Number.NaN) : monthStart(month);
}

interface BillsChartProps {
  copy: Translator;
  currency: CurrencyCode;
  hidden: boolean;
  /** The id of the heading that names the selected month. */
  monthTitleId: string;
  onSelect: (index: number) => void;
  /** The index of the selected month in the summary's totals. */
  selected: number;
  summary: BillsSummary;
}

/**
 * Bills per month over the last year as columns, with the average as a hairline. It picks
 * the month whose amounts show below: a tap, a drag, or the arrow keys move the selection.
 */
export function BillsChart({
  copy,
  currency,
  hidden,
  monthTitleId,
  onSelect,
  selected,
  summary,
}: BillsChartProps) {
  const { average, highest, lowest, totals } = summary;
  const scale = Math.max(average, ...totals.map((month) => month.total ?? 0)) || 1;
  const money = (value: number) =>
    hidden ? HIDDEN_DOTS : formatCurrency(value, currency, copy.locale);
  const longMonth = (value: string) => copy.month(monthDate(value), true);
  const tableAmount = (value: number | null) => {
    if (value === null) return '–';
    return hidden ? copy.t('earnings.hiddenAmount') : formatCurrency(value, currency, copy.locale);
  };

  function select(index: number) {
    onSelect(Math.min(Math.max(index, 0), totals.length - 1));
  }

  function selectFromPointer(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    select(Math.floor(((event.clientX - box.left) / box.width) * totals.length));
  }

  /** Only a pressed pointer drags the selection, so hovering does not change the month. */
  function dragFromPointer(event: PointerEvent<HTMLDivElement>) {
    if (event.buttons === 1) selectFromPointer(event);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, number> = {
      ArrowLeft: selected - 1,
      ArrowRight: selected + 1,
      Home: 0,
      End: totals.length - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(next);
  }

  return (
    <div className="stat-card bills-chart-card">
      <div className="bills-chart-head">
        <p className="stat-label">{copy.t('bills.chartTitle')}</p>
        <p className="bills-chart-key">
          <span aria-hidden="true" className="bills-average-key" />
          {copy.t('bills.chartAverage', { amount: money(average) })}
        </p>
      </div>
      <div
        aria-describedby={monthTitleId}
        aria-label={copy.t('bills.chartTitle')}
        className="bills-chart"
        onKeyDown={handleKeyDown}
        onPointerDown={selectFromPointer}
        onPointerMove={dragFromPointer}
        role="group"
        tabIndex={0}
      >
        <div aria-hidden="true" className="bills-plot">
          <span className="bills-average-line" style={{ bottom: `${(average / scale) * 100}%` }} />
          {totals.map((month, index) => (
            <span
              className="bills-column"
              data-selected={index === selected || undefined}
              key={month.month}
            >
              {month.total === null ? (
                <span className="bills-bar-empty" />
              ) : (
                <span
                  className="bills-bar"
                  style={{ blockSize: `${(month.total / scale) * 100}%` }}
                />
              )}
            </span>
          ))}
        </div>
        <div aria-hidden="true" className="bills-months">
          {totals.map((month, index) => (
            <span data-selected={index === selected || undefined} key={month.month}>
              {copy.monthInitial(monthDate(month.month))}
            </span>
          ))}
        </div>
      </div>
      {highest !== null && lowest !== null && (
        <p className="stat-note">
          {copy.t('bills.highest', {
            month: copy.month(monthDate(highest.month), false),
            amount: money(highest.total),
          })}
          {' · '}
          {copy.t('bills.lowest', {
            month: copy.month(monthDate(lowest.month), false),
            amount: money(lowest.total),
          })}
        </p>
      )}
      <table className="visually-hidden">
        <caption>{copy.t('bills.chartTitle')}</caption>
        <tbody>
          {totals.map((month) => (
            <tr key={month.month}>
              <th scope="row">{longMonth(month.month)}</th>
              <td>{tableAmount(month.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
