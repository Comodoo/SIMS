import { NextRequest, NextResponse } from 'next/server';
import { db, generateId, hashPassword } from '@/lib/db/mock-store';
import type { DBUser } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role = 'student', country, phone } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = db.users.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Create user
    const userId = generateId();
    const newUser: DBUser = {
      id: userId,
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      name,
      role: role as 'student' | 'instructor',
      status: 'active',
      emailVerified: false,
      phone,
      country,
      timezone: 'Africa/Nairobi',
      preferredLanguage: 'en',
      twoFactorEnabled: false,
      notificationPreferences: {
        email: true,
        push: true,
        sms: false,
      },
      subscriptionTier: 'free',
      subscriptionStatus: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const user = db.users.create(newUser);

    // Create session token (simplified - use JWT in production)
    const sessionToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

    // Return user (without password)
    const { passwordHash: _, ...safeUser } = user;

    const response = NextResponse.json({
      success: true,
      user: safeUser,
      message: 'Account created successfully',
    });

    // Set session cookie
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
