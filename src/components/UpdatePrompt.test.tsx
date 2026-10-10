import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { UpdatePrompt, UpdatePromptView } from './UpdatePrompt';
import { scheduleUpdateChecks, UPDATE_CHECK_INTERVAL_MS } from './updateChecks';

const useRegisterSW = vi.hoisted(() =>
  vi.fn(() => ({
    needRefresh: [true, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(async () => undefined),
  })),
);
vi.mock('virtual:pwa-register/react', () => ({ useRegisterSW }));

describe('UpdatePromptView', () => {
  afterEach(() => cleanup());

  it('stays out of the interface until an update exists', () => {
    const { container } = render(
      <UpdatePromptView language="en" needRefresh={false} onDismiss={vi.fn()} onUpdate={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('offers an accessible update and dismiss action', () => {
    const onDismiss = vi.fn();
    const onUpdate = vi.fn();
    render(
      <UpdatePromptView language="en" needRefresh onDismiss={onDismiss} onUpdate={onUpdate} />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('A new version of Affordi is ready.');
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(onUpdate).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('checks for updates hourly only while the app is visible and online', async () => {
    vi.useFakeTimers();
    const update = vi.fn(async () => undefined);
    const visibility = vi.spyOn(document, 'visibilityState', 'get');
    try {
      scheduleUpdateChecks('/sw.js', undefined);
      scheduleUpdateChecks('/sw.js', { update });

      visibility.mockReturnValue('hidden');
      await vi.advanceTimersByTimeAsync(UPDATE_CHECK_INTERVAL_MS);
      expect(update).not.toHaveBeenCalled();

      visibility.mockReturnValue('visible');
      update.mockRejectedValueOnce(new Error('offline'));
      await vi.advanceTimersByTimeAsync(UPDATE_CHECK_INTERVAL_MS);
      expect(update).toHaveBeenCalledOnce();
    } finally {
      visibility.mockRestore();
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  it('registers the service worker only after the page has loaded', () => {
    const readyState = vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading');
    try {
      render(<UpdatePrompt language="en" />);
      expect(useRegisterSW).not.toHaveBeenCalled();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();

      act(() => {
        window.dispatchEvent(new Event('load'));
      });
      expect(useRegisterSW).toHaveBeenCalledOnce();
      expect(screen.getByRole('status')).toHaveTextContent('A new version of Affordi is ready.');
    } finally {
      readyState.mockRestore();
    }
  });
});
