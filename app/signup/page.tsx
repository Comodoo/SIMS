'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mutate, query } from '@/lib/graphql';
import { Eye, EyeOff, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const CLASS_GROUPS_QUERY = `
  query {
    classGroups {
      id
      name
      parentId
    }
  }
`;

const SELF_REGISTER_MUTATION = `
  mutation SelfRegister($input: SelfRegisterStudentInput!) {
    selfRegisterStudent(input: $input) {
      success
      message
    }
  }
`;

interface ClassGroup {
  id: string;
  name: string;
  parentId: string | null;
}

export default function SignupPage() {
  const router = useRouter();

  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    classGroupId: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    query(CLASS_GROUPS_QUERY).then(res => {
      const groups: ClassGroup[] = res?.classGroups ?? [];
      // only top-level groups in the dropdown
      setClassGroups(groups.filter(g => !g.parentId));
    }).catch(() => {});
  }, []);

  function set(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await mutate(SELF_REGISTER_MUTATION, {
        input: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          classGroupId: form.classGroupId || null,
          password: form.password,
        },
      });

      const result = res?.selfRegisterStudent;
      if (result?.success) {
        setSuccess(true);
      } else {
        setError(result?.message || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <GraduationCap className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold">Account Created!</h1>
          <p className="text-muted-foreground">
            Your student account has been created successfully. You can now sign in with your credentials.
          </p>
          <Button className="w-full" onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">SIMS</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">Student Registration</h1>
          <p className="text-muted-foreground">Create your student account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Fill in your details to register as a student</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/15 border border-destructive/20 text-destructive px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={form.firstName}
                    onChange={e => set('firstName', e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Smith"
                    value={form.lastName}
                    onChange={e => set('lastName', e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  placeholder="john.smith"
                  value={form.username}
                  onChange={e => set('username', e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  disabled={loading}
                />
              </div>

              {classGroups.length > 0 && (
                <div className="space-y-2">
                  <Label>Class Level</Label>
                  <Select
                    value={form.classGroupId}
                    onValueChange={v => set('classGroupId', v)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your class level" />
                    </SelectTrigger>
                    <SelectContent>
                      {classGroups.map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    required
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={e => set('confirmPassword', e.target.value)}
                    required
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <div className="text-sm text-center w-full text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
