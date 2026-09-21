import { screen } from '@testing-library/react';

// The checkout form renders labels as plain <div>s next to the input rather
// than via <label htmlFor>. This walks up from the label text and returns the
// nearest input/textarea/select found in the enclosing subtree.
export function fieldFor(label: string): HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  const labelNode = screen.getByText(label);
  let node: Element | null = labelNode;
  while (node) {
    const input = node.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input, textarea, select'
    );
    if (input) return input;
    node = node.parentElement;
  }
  throw new Error(`No input near label "${label}"`);
}
