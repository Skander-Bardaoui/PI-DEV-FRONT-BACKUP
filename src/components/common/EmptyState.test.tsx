/**
 * Tests for EmptyState component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('should render with message', () => {
    render(<EmptyState message="No data available" />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    render(<EmptyState title="Empty List" message="No items found" />);
    expect(screen.getByText('Empty List')).toBeInTheDocument();
  });

  it('should render default icon when no icon provided', () => {
    const { container } = render(<EmptyState message="No data" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should render custom icon', () => {
    const CustomIcon = () => <div data-testid="custom-icon">Custom</div>;
    render(<EmptyState message="No data" icon={<CustomIcon />} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('should render action button when action provided', () => {
    const action = {
      label: 'Add Item',
      onClick: vi.fn(),
    };
    render(<EmptyState message="No data" action={action} />);
    
    const button = screen.getByRole('button', { name: /add item/i });
    expect(button).toBeInTheDocument();
  });

  it('should call action onClick when button clicked', () => {
    const onClick = vi.fn();
    const action = {
      label: 'Add Item',
      onClick,
    };
    render(<EmptyState message="No data" action={action} />);
    
    const button = screen.getByRole('button', { name: /add item/i });
    fireEvent.click(button);
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should not render action button when action not provided', () => {
    render(<EmptyState message="No data" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
