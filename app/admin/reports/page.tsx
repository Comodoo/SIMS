'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, BarChart3, CheckCircle, Clock, Download, FileText, Filter, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { query, mutate } from '@/lib/graphql';

const ADMIN_REPORTS_QUERY = `
  query AdminReports {
    reports(limit: 1000) {
      id
      type
      title
      generated_by
      generated_at
      file_url
      status
    }
  }
`;

const GENERATE_REPORT_MUTATION = `
  mutation GenerateReport($type: String!, $dateRange: String!) {
    generateReport(type: $type, dateRange: $dateRange) {
      success
      message
      report {
        id
        type
        title
        generated_by
        generated_at
        file_url
        status
      }
    }
  }
`;

// Types
interface Report {
  id: string;
  type: string;
  title: string;
  generated_by: string;
  generated_at: string;
  file_url: string | null;
  status: 'completed' | 'processing' | 'failed';
}

export default function AdminReportsPage() {
  const { user, token } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!user || !token) return;

    const fetchReports = async () => {
      try {
        const response = await query('adminReports', ADMIN_REPORTS_QUERY, {}, token);
        
        if (response.reports) {
          const mappedReports: Report[] = response.reports.map((r: any) => ({
            id: r.id,
            type: r.type,
            title: r.title,
            generated_by: r.generated_by,
            generated_at: r.generated_at,
            file_url: r.file_url,
            status: r.status,
          }));
          setReports(mappedReports);
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user, token]);

  const handleGenerateReport = async () => {
    if (!selectedType || !dateRange) return;

    setGenerating(true);

    try {
      const response = await mutate('generateReport', GENERATE_REPORT_MUTATION, {
        type: selectedType,
        dateRange: dateRange,
      }, token);

      if (response.generateReport.success) {
        const newReport: Report = {
          id: response.generateReport.report.id,
          type: response.generateReport.report.type,
          title: response.generateReport.report.title,
          generated_by: response.generateReport.report.generated_by,
          generated_at: response.generateReport.report.generated_at,
          file_url: response.generateReport.report.file_url,
          status: response.generateReport.report.status,
        };
        setReports([newReport, ...reports]);
        setSelectedType('');
        setDateRange('');
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'attendance':
        return <Clock className="h-5 w-5" />;
      case 'enrollment':
        return <Users className="h-5 w-5" />;
      case 'grades':
        return <BarChart3 className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getReportColor = (type: string) => {
    switch (type) {
      case 'attendance':
        return 'bg-blue-100 text-blue-800';
      case 'enrollment':
        return 'bg-green-100 text-green-800';
      case 'grades':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const completedReports = reports.filter(r => r.status === 'completed').length;
  const processingReports = reports.filter(r => r.status === 'processing').length;

  if (loading) {
    return <div>Loading reports...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Reports</h1>
        <p className="text-muted-foreground">Generate and download system reports</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Reports</p>
              <p className="text-2xl font-bold">{reports.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{completedReports}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Processing</p>
              <p className="text-2xl font-bold">{processingReports}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Report */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Generate New Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger id="report-type">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">Attendance Report</SelectItem>
                  <SelectItem value="enrollment">Enrollment Trends</SelectItem>
                  <SelectItem value="grades">Grade Distribution</SelectItem>
                  <SelectItem value="staff">Staff Performance</SelectItem>
                  <SelectItem value="leave">Leave Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="date-range">Date Range</Label>
              <Input
                id="date-range"
                placeholder="e.g., March 2024, Q1 2024, Spring 2024"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              />
            </div>
            <Button
              onClick={handleGenerateReport}
              disabled={!selectedType || !dateRange || generating}
              className="gap-2"
            >
              {generating ? 'Generating...' : (
                <>
                  <Filter className="h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full ${getReportColor(report.type)} flex items-center justify-center`}>
                    {getReportIcon(report.type)}
                  </div>
                  <div>
                    <p className="font-semibold">{report.title}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Generated: {new Date(report.generated_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>By: {report.generated_by}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {report.status === 'processing' ? (
                    <span className="text-sm text-orange-600 font-medium">Processing...</span>
                  ) : (
                    <Button variant="outline" size="sm" asChild>
                      <a href={report.file_url || '#'} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {reports.length === 0 && (
            <div className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No reports generated yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
