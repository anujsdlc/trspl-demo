import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { AdminLoginForm } from '@/components/admin-login-form';

function emailInput(): HTMLInputElement {
  const el = document.querySelector<HTMLInputElement>('input[type="email"]');
  if (!el) throw new Error('email input missing');
  return el;
}
function passwordInput(): HTMLInputElement {
  const el = document.querySelector<HTMLInputElement>('input[type="password"]');
  if (!el) throw new Error('password input missing');
  return el;
}

describe('AdminLoginForm', () => {
  it('rejects wrong credentials with an inline error', async () => {
    render(<AdminLoginForm />);
    const user = userEvent.setup();

    await user.type(emailInput(), 'someone@else.com');
    await user.type(passwordInput(), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in to console/i }));

    expect(await screen.findByText(/wrong email or password/i)).toBeInTheDocument();
    const { push } = useRouter();
    expect(push).not.toHaveBeenCalled();
  });

  it('signs in on correct demo credentials and navigates to /admin', async () => {
    render(<AdminLoginForm />);
    const user = userEvent.setup();

    await user.type(emailInput(), 'admin@trs.co.in');
    await user.type(passwordInput(), 'Skyline@2026');
    await user.click(screen.getByRole('button', { name: /sign in to console/i }));

    const { push } = useRouter();
    // The form intentionally waits 500ms before completing sign-in; wait for it.
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith('/admin'), { timeout: 2000 });
    expect(localStorage.getItem('trs.admin.auth')).toContain('admin@trs.co.in');
    expect(document.cookie).toContain('trs_admin=1');
  });

  it('autofills the demo credentials when the button is clicked', async () => {
    render(<AdminLoginForm />);
    const user = userEvent.setup();

    expect(emailInput().value).toBe('');
    expect(passwordInput().value).toBe('');

    await user.click(screen.getByRole('button', { name: /autofill demo credentials/i }));
    expect(emailInput().value).toBe('admin@trs.co.in');
    expect(passwordInput().value).toBe('Skyline@2026');
  });
});
