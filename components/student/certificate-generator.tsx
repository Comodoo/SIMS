'use client';

import { useRef, useState } from 'react';
import { useLMS } from '@/lib/lms-context';
import { Certificate, Course } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Award,
  Download,
  Share2,
  Eye,
  Calendar,
  CheckCircle,
  Shield,
  Printer,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CertificateGeneratorProps {
  courseId: string;
  courseName: string;
  instructorName: string;
  completionDate?: Date;
  onGenerate?: () => void;
}

export function CertificateGenerator({
  courseId,
  courseName,
  instructorName,
  completionDate,
  onGenerate,
}: CertificateGeneratorProps) {
  const { currentUser, getCertificate, generateCertificate, getCourse } = useLMS();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const certificate = getCertificate(courseId);
  const course = getCourse(courseId);

  const handleGenerate = async () => {
    if (certificate) return;
    
    setIsGenerating(true);
    try {
      generateCertificate(courseId);
      onGenerate?.();
    } finally {
      setIsGenerating(false);
    }
  };

  if (!certificate && !completionDate) {
    return null;
  }

  return (
    <Card className="border-2 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
              <Award className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Course Certificate</CardTitle>
              <CardDescription>
                {certificate
                  ? 'Your certificate is ready'
                  : 'You have completed this course!'}
              </CardDescription>
            </div>
          </div>
          {certificate && (
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {certificate ? (
          <>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Issued: {new Date(certificate.issuedAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                {certificate.verificationCode}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Certificate Preview</DialogTitle>
                  </DialogHeader>
                  <CertificatePreview
                    certificate={certificate}
                    courseName={courseName}
                    instructorName={instructorName}
                    studentName={currentUser?.name || 'Student'}
                  />
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={() => handleDownload(certificate, courseName, instructorName, currentUser?.name || 'Student')}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </>
        ) : (
          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full sm:w-auto">
            <Award className="mr-2 h-4 w-4" />
            {isGenerating ? 'Generating...' : 'Generate Certificate'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface CertificatePreviewProps {
  certificate: Certificate;
  courseName: string;
  instructorName: string;
  studentName: string;
}

function CertificatePreview({
  certificate,
  courseName,
  instructorName,
  studentName,
}: CertificatePreviewProps) {
  return (
    <div className="aspect-[1.414/1] bg-white p-8 rounded-lg border-4 border-amber-400 relative overflow-hidden print:border-8">
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-24 h-24 border-l-4 border-t-4 border-amber-400 rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-24 h-24 border-r-4 border-t-4 border-amber-400 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-24 h-24 border-l-4 border-b-4 border-amber-400 rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-24 h-24 border-r-4 border-b-4 border-amber-400 rounded-br-lg" />

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, #f59e0b 0, #f59e0b 1px, transparent 0, transparent 50%)`,
          backgroundSize: '10px 10px',
        }} />
      </div>

      <div className="relative h-full flex flex-col items-center justify-between text-center py-8">
        {/* Header */}
        <div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Award className="h-10 w-10 text-amber-600" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-gray-800 mb-2">
            Certificate of Completion
          </h1>
          <p className="text-gray-600">This is to certify that</p>
        </div>

        {/* Student Name */}
        <div className="py-8">
          <h2 className="text-3xl font-bold text-gray-900 border-b-2 border-amber-400 pb-2 px-8">
            {studentName}
          </h2>
          <p className="text-gray-600 mt-4">has successfully completed the course</p>
          <h3 className="text-2xl font-semibold text-gray-800 mt-2 max-w-md">
            {courseName}
          </h3>
        </div>

        {/* Details */}
        <div className="w-full max-w-lg">
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-left">
              <p className="text-sm text-gray-500">Date of Completion</p>
              <p className="font-medium text-gray-800">
                {new Date(certificate.issuedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="text-center">
              <div className="w-24 h-16 border-b border-gray-400 mb-1" />
              <p className="text-sm text-gray-500">{instructorName}</p>
              <p className="text-xs text-gray-400">Instructor</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Certificate ID</p>
              <p className="font-mono text-sm text-gray-800">
                {certificate.verificationCode}
              </p>
            </div>
          </div>
        </div>

        {/* Seal */}
        <div className="absolute bottom-16 right-16 w-24 h-24 rounded-full border-4 border-amber-400 flex items-center justify-center bg-amber-50">
          <div className="text-center">
            <Shield className="h-8 w-8 text-amber-600 mx-auto" />
            <p className="text-[8px] text-amber-700 font-bold mt-1">VERIFIED</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Download handler
function handleDownload(
  certificate: Certificate,
  courseName: string,
  instructorName: string,
  studentName: string
) {
  // Create a simple text-based certificate for download
  // In production, you would use a library like jsPDF or html2canvas
  const content = `
CERTIFICATE OF COMPLETION

This is to certify that

${studentName}

has successfully completed the course

${courseName}

Instructor: ${instructorName}
Date of Completion: ${new Date(certificate.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
Certificate ID: ${certificate.verificationCode}

This certificate is verified and authenticated.
  `.trim();

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `certificate-${certificate.verificationCode}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Certificates list for profile/dashboard
interface CertificatesListProps {
  className?: string;
}

export function CertificatesList({ className }: CertificatesListProps) {
  const { getUserCertificates, getCourse, currentUser } = useLMS();
  const certificates = getUserCertificates();

  if (certificates.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <Award className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">No Certificates Yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Complete courses to earn certificates
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {certificates.map((cert) => {
        const course = getCourse(cert.courseId);
        return (
          <Card key={cert.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Award className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{cert.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {course?.instructorName || 'Instructor'}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(cert.issuedAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {cert.verificationCode}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDownload(cert, cert.title, course?.instructorName || 'Instructor', currentUser?.name || 'Student')}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
