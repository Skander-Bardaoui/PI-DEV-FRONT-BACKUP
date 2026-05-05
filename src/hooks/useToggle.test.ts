/**
 * Tests for useToggle hook
 */

import { renderHook, act } from '@testing-library/react';
import { useToggle } from './useToggle';
import { describe, it, expect } from 'vitest';

describe('useToggle', () => {
  it('should initialize with false by default', () => {
    const { result } = renderHook(() => useToggle());
    const [value] = result.current;
    expect(value).toBe(false);
  });

  it('should initialize with provided value', () => {
    const { result } = renderHook(() => useToggle(true));
    const [value] = result.current;
    expect(value).toBe(true);
  });

  it('should toggle value', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => {
      const [, toggle] = result.current;
      toggle();
    });

    expect(result.current[0]).toBe(true);

    act(() => {
      const [, toggle] = result.current;
      toggle();
    });

    expect(result.current[0]).toBe(false);
  });

  it('should set value directly', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => {
      const [, , setValue] = result.current;
      setValue(true);
    });

    expect(result.current[0]).toBe(true);

    act(() => {
      const [, , setValue] = result.current;
      setValue(false);
    });

    expect(result.current[0]).toBe(false);
  });

  it('should maintain stable function references', () => {
    const { result, rerender } = renderHook(() => useToggle());

    const [, toggle1, setValue1] = result.current;

    rerender();

    const [, toggle2, setValue2] = result.current;

    expect(toggle1).toBe(toggle2);
    expect(setValue1).toBe(setValue2);
  });
});
