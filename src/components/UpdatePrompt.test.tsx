import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { UpdatePromptView } from './UpdatePrompt';

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

    expect(screen.getByRole('status')).toHaveTextContent('A new Affordi is ready.');
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(onUpdate).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
