import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';

import { billAmount, type Bill, type BillsSummary } from '../domain/bills';
import type { Translator } from '../domain/i18n';
import { formatCurrency, type CurrencyCode } from '../domain/locale';
import { monthStart, parseMonth } from '../domain/months';
import { BILL_COLORS, billColor } from './billColor';

const HIDDEN_DOTS = '••••';

function monthDate(value: string): Date {
  const month = parseMonth(value);
  return month === null ? new Date(Number.NaN) : monthStart(month);
}

interface ColumnPart {
  key: string;
  amount: number;
  style: CSSProperties;
}

/** A month's bills in the order they were added, those past the last color as one gray part. */
function columnParts(bills: readonly Bill[], month: string): ColumnPart[] {
  const parts: ColumnPart[] = [];
  let others = 0;
  for (const [index, bill] of bills.entries()) {
    const amount = billAmount(bill, month);
    if (amount === null) continue;
    if (index < BILL_COLORS) parts.push({ key: bill.id, amount, style: billColor(index) });
    else others += amount;
  }
  if (others > 0) parts.push({ key: 'others', amount: others, style: billColor(BILL_COLORS) });
  return parts;
}

interface BillsChartProps {
  /** In the order they were added, which gives each bill its color. */
  bills: readonly Bill[];
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
 * Bills per month over the last year as columns, each bill a color stacked in the order they
 * were added, with the average as a hairline. It picks the month whose amounts show below: a
 * tap, a drag, or the arrow keys move the selection.
 */
export function BillsChart({
  bills,
  copy,
  currency,
  hidden,
  monthTitleId,
  onSelect,
  selected,
  summary,
}: BillsChartProps) {
  const { average, totals } = summary;
  const scale = Math.max(average, ...totals.map((month) => month.total ?? 0)) || 1;
  const money = (value: number) =>
    hidden ? HIDDEN_DOTS : formatCurrency(value, currency, copy.locale);
  const longMonth = (value: string) => copy.month(monthDate(value), true);
  const tableAmount = (value: number | null) => {
    if (value === null) return '–';
    return hidden ? copy.t('earnings.hiddenAmount') : formatCurrency(value, currency, copy.locale);
  };
  // The bills with an amount in the chart. Once there are two, the key names them, and those past
  // the last color together.
  const charted = bills.flatMap((bill, index) =>
    totals.some(({ month }) => billAmount(bill, month) !== null) ? [{ bill, index }] : [],
  );
  const named = charted.length > 1 ? charted.filter(({ index }) => index < BILL_COLORS) : [];
  const others = charted.length > 1 && charted.length > named.length;

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
      {named.length > 0 && (
        <ul className="bills-legend">
          {named.map(({ bill, index }) => (
            <li key={bill.id}>
              <span aria-hidden="true" className="bills-swatch" style={billColor(index)} />
              {bill.name}
            </li>
          ))}
          {others && (
            <li>
              <span aria-hidden="true" className="bills-swatch" />
              {copy.t('bills.other')}
            </li>
          )}
        </ul>
      )}
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
                >
                  {columnParts(bills, month.month).map((part) => (
                    <span
                      className="bills-segment"
                      key={part.key}
                      style={{ ...part.style, flexGrow: part.amount }}
                    />
                  ))}
                </span>
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
      <table className="visually-hidden">
        <caption>{copy.t('bills.chartTitle')}</caption>
        <thead>
          <tr>
            <th scope="col">{copy.t('fixedCosts.month')}</th>
            {charted.map(({ bill }) => (
              <th key={bill.id} scope="col">
                {bill.name}
              </th>
            ))}
            <th scope="col">{copy.t('bills.total')}</th>
          </tr>
        </thead>
        <tbody>
          {totals.map((month) => (
            <tr key={month.month}>
              <th scope="row">{longMonth(month.month)}</th>
              {charted.map(({ bill }) => (
                <td key={bill.id}>{tableAmount(billAmount(bill, month.month))}</td>
              ))}
              <td>{tableAmount(month.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
