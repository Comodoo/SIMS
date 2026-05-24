import { NextRequest, NextResponse } from 'next/server';
import { db, generateId } from '@/lib/db/mock-store';

// In-memory store for reset tokens (use Redis/database in production)
const resetTokens = new Map<string, { userId: string; expiresAt: Date }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user
    const user = db.users.findByEmail(email.toLowerCase());
    
    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      });
    }

    // Generate reset token
    const resetToken = generateId();
    resetTokens.set(resetToken, {
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    // In production, send email with reset link
    // await sendEmail({
    //   to: user.email,
    //   subject: 'Reset your password',
    //   html: `<a href="${process.env.NEXT_PUBLIC_URL}/reset-password?token=${resetToken}">Reset Password</a>`
    // });

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
      // Only for demo - remove in production
      _demo: { resetToken },
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
