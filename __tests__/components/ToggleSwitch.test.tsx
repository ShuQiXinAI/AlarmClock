import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ToggleSwitch from '../../src/components/ToggleSwitch';

describe('ToggleSwitch', () => {
  it('renders without crash', () => {
    const { getByTestId } = render(
      <ToggleSwitch value={false} onChange={jest.fn()} />
    );
    expect(getByTestId('toggle-switch')).toBeTruthy();
  });

  it('calls onChange when pressed', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <ToggleSwitch value={false} onChange={onChange} />
    );
    fireEvent.press(getByTestId('toggle-switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('passes true when currently false', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <ToggleSwitch value={false} onChange={onChange} />
    );
    fireEvent.press(getByTestId('toggle-switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
