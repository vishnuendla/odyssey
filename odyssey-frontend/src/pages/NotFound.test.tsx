import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import NotFound from './NotFound';

describe('NotFound', () => {
  it('uses an in-app link back home', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /return to home/i })).toHaveAttribute('href', '/');
  });
});
