/**
 * Focus rings show only while someone moves through the page with the Tab key. A tap or a click
 * hides them again, so choosing an option or closing a dialog never leaves a highlight behind.
 */
export function trackKeyboardFocus(root = document.documentElement): () => void {
  const ownerDocument = root.ownerDocument;

  function showRings(event: KeyboardEvent) {
    if (event.key === 'Tab') root.toggleAttribute('data-keyboard', true);
  }

  function hideRings() {
    root.toggleAttribute('data-keyboard', false);
  }

  ownerDocument.addEventListener('keydown', showRings, true);
  ownerDocument.addEventListener('pointerdown', hideRings, true);
  return () => {
    ownerDocument.removeEventListener('keydown', showRings, true);
    ownerDocument.removeEventListener('pointerdown', hideRings, true);
  };
}
