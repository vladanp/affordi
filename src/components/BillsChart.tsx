import { useState, type KeyboardEvent, type PointerEvent } from 'react';

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
  summary: BillsSummary;
}

/**
 * Bills per month over the last year as columns, with the average as a hairline.
 * The selected month reads out below; pointer, touch, and arrow keys move it.
 */
export function BillsChart({ copy, currency, hidden, summary }: BillsChartProps) {
  const { average, highest, lowest, totals } = summary;
  const latest = totals.findLastIndex((month) => month.total !== null);
  const [selected, setSelected] = useState(latest === -1 ? totals.length - 1 : latest);
  const scale = Math.max(average, ...totals.map((month) => month.total ?? 0)) || 1;
  const money = (value: number) =>
    hidden ? HIDDEN_DOTS : formatCurrency(value, currency, copy.locale);
  const longMonth = (value: string) => copy.month(monthDate(value), true);
  const tableAmount = (value: number | null) => {
    if (value === null) return '–';
    return hidden ? copy.t('earnings.hiddenAmount') : formatCurrency(value, currency, copy.locale);
  };
  const current = totals[selected] ?? totals.at(-1)!;

  function select(index: number) {
    setSelected(Math.min(Math.max(index, 0), totals.length - 1));
  }

  function selectFromPointer(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    select(Math.floor(((event.clientX - box.left) / box.width) * totals.length));
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
        aria-describedby="bills-readout"
        aria-label={copy.t('bills.chartTitle')}
        className="bills-chart"
        onKeyDown={handleKeyDown}
        onPointerDown={selectFromPointer}
        onPointerMove={selectFromPointer}
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
      <p aria-live="polite" className="bills-readout" id="bills-readout">
        {current.total === null
          ? copy.t('bills.readoutEmpty', { month: longMonth(current.month) })
          : copy.t('bills.readout', {
              month: longMonth(current.month),
              amount: money(current.total),
            })}
      </p>
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
