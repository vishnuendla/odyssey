import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Icons } from '@/components/shared/Icons';
import { ApiError, authApi } from '@/services/api';
import { CheckCircle2, Eye, EyeOff, KeyRound } from 'lucide-react';

const formSchema = z.object({
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(72, { message: 'Password must be 72 characters or less' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof formSchema>;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  async function onSubmit(data: FormData) {
    if (!token) {
      setFormError('This reset link is missing its token. Request a new link.');
      return;
    }
    setFormError(null);
    try {
      setIsLoading(true);
      await authApi.resetPassword(token, data.password);
      setSucceeded(true);
    } catch (error) {
      if (error instanceof ApiError) {
        Object.entries(error.fieldErrors).forEach(([field, message]) => {
          if (field === 'newPassword') {
            form.setError('password', { message });
          }
        });
        setFormError(error.message);
      } else {
        setFormError('Could not reset your password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              {succeeded ? <CheckCircle2 className="h-6 w-6 text-green-600" /> : <KeyRound className="h-6 w-6 text-primary" />}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {succeeded ? 'Password updated' : 'Choose a new password'}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {succeeded
                ? 'Your password has been changed and all other sessions were signed out.'
                : 'Pick a strong password you do not use anywhere else.'}
            </p>
          </div>

          {succeeded ? (
            <Button asChild className="w-full h-11">
              <Link to="/login">Sign in with your new password</Link>
            </Button>
          ) : !token ? (
            <Alert variant="destructive">
              <AlertDescription>
                This reset link is invalid or incomplete.{' '}
                <Link to="/forgot-password" className="underline">Request a new link</Link>.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {formError && (
                <Alert variant="destructive">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              autoComplete="new-password"
                              className="h-11 pr-10"
                              {...field}
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((visible) => !visible)}
                              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              tabIndex={-1}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm new password</FormLabel>
                        <FormControl>
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            className="h-11"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full h-11" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        Updating password...
                      </>
                    ) : (
                      'Update password'
                    )}
                  </Button>
                </form>
              </Form>

              <div className="text-center text-sm">
                <Link to="/login" className="text-primary hover:underline">
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPassword;
