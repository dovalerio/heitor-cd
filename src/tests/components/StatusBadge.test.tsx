import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from '../../renderer/components/StatusBadge/StatusBadge';

describe('StatusBadge', () => {
  it('displays "Running" for status="running"', () => {
    render(<StatusBadge status="running" />);
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('has aria-label "Status: Running" for running status', () => {
    render(<StatusBadge status="running" />);
    expect(screen.getByLabelText('Status: Running')).toBeInTheDocument();
  });

  it('displays "Stopped" for status="exited"', () => {
    render(<StatusBadge status="exited" />);
    expect(screen.getByText('Stopped')).toBeInTheDocument();
  });

  it('has aria-label "Status: Stopped" for exited status', () => {
    render(<StatusBadge status="exited" />);
    expect(screen.getByLabelText('Status: Stopped')).toBeInTheDocument();
  });

  it('displays "Paused" for status="paused"', () => {
    render(<StatusBadge status="paused" />);
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('has aria-label "Status: Paused" for paused status', () => {
    render(<StatusBadge status="paused" />);
    expect(screen.getByLabelText('Status: Paused')).toBeInTheDocument();
  });

  it('displays "Restarting" for status="restarting"', () => {
    render(<StatusBadge status="restarting" />);
    expect(screen.getByText('Restarting')).toBeInTheDocument();
  });

  it('has aria-label "Status: Restarting" for restarting status', () => {
    render(<StatusBadge status="restarting" />);
    expect(screen.getByLabelText('Status: Restarting')).toBeInTheDocument();
  });

  it('displays "Created" for status="created"', () => {
    render(<StatusBadge status="created" />);
    expect(screen.getByText('Created')).toBeInTheDocument();
  });

  it('has aria-label "Status: Created" for created status', () => {
    render(<StatusBadge status="created" />);
    expect(screen.getByLabelText('Status: Created')).toBeInTheDocument();
  });

  it('displays "Removing" for status="removing"', () => {
    render(<StatusBadge status="removing" />);
    expect(screen.getByText('Removing')).toBeInTheDocument();
  });

  it('has aria-label "Status: Removing" for removing status', () => {
    render(<StatusBadge status="removing" />);
    expect(screen.getByLabelText('Status: Removing')).toBeInTheDocument();
  });

  it('displays "Dead" for status="dead"', () => {
    render(<StatusBadge status="dead" />);
    expect(screen.getByText('Dead')).toBeInTheDocument();
  });

  it('has aria-label "Status: Dead" for dead status', () => {
    render(<StatusBadge status="dead" />);
    expect(screen.getByLabelText('Status: Dead')).toBeInTheDocument();
  });

  it('dot span has aria-hidden="true"', () => {
    render(<StatusBadge status="running" />);
    // The dot span has aria-hidden="true"
    const badge = screen.getByLabelText('Status: Running');
    const dotSpan = badge.querySelector('span[aria-hidden="true"]');
    expect(dotSpan).toBeInTheDocument();
  });

  it('forwards data-testid', () => {
    render(<StatusBadge status="running" data-testid="badge-test" />);
    expect(screen.getByTestId('badge-test')).toBeInTheDocument();
  });
});
