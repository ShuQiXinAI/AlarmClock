import React from 'react';
import { render } from '@testing-library/react-native';
import DismissBadge from '../../src/components/DismissBadge';

describe('DismissBadge', () => {
  it('renders math badge', () => {
    const { getByText } = render(<DismissBadge method="math" />);
    expect(getByText(/答题模式/)).toBeTruthy();
  });

  it('renders blink badge', () => {
    const { getByText } = render(<DismissBadge method="blink" />);
    expect(getByText(/眨眼模式/)).toBeTruthy();
  });

  it('renders shake badge', () => {
    const { getByText } = render(<DismissBadge method="shake" />);
    expect(getByText(/摇晃模式/)).toBeTruthy();
  });
});
