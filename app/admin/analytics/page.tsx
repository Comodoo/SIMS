'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Users, BookOpen, DollarSign, TrendingUp, TrendingDown, Eye, Clock,
  Download, RefreshCw, Calendar, Globe, Smartphone, Monitor, Tablet,
  ArrowUp, ArrowDown, Activity, Target, BarChart3, PieChart, LineChart
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Sample data
const userGrowthData = [
  { month: 'Jan', users: 1200, students: 1000, instructors: 200 },
  { month: 'Feb', users: 1800, students: 1500, instructors: 300 },
  { month: 'Mar', users: 2400, students: 2000, instructors: 400 },
  { month: 'Apr', users: 3200, students: 2700, instructors: 500 },
  { month: 'May', users: 4100, students: 3500, instructors: 600 },
  { month: 'Jun', users: 5200, students: 4400, instructors: 800 },
];

const revenueData = [
  { month: 'Jan', revenue: 12000, courses: 45, enrollments: 320 },
  { month: 'Feb', revenue: 18500, courses: 52, enrollments: 480 },
  { month: 'Mar', revenue: 24000, courses: 58, enrollments: 620 },
  { month: 'Apr', revenue: 31000, courses: 67, enrollments: 780 },
  { month: 'May', revenue: 38500, courses: 75, enrollments: 920 },
  { month: 'Jun', revenue: 45000, courses: 82, enrollments: 1100 },
];

const engagementData = [
  { day: 'Mon', activeUsers: 2400, sessions: 4200, pageViews: 12000 },
  { day: 'Tue', activeUsers: 2800, sessions: 4800, pageViews: 14500 },
  { day: 'Wed', activeUsers: 3200, sessions: 5400, pageViews: 16200 },
  { day: 'Thu', activeUsers: 2900, sessions: 5000, pageViews: 15000 },
  { day: 'Fri', activeUsers: 2600, sessions: 4500, pageViews: 13500 },
  { day: 'Sat', activeUsers: 1800, sessions: 3200, pageViews: 9600 },
  { day: 'Sun', activeUsers: 1500, sessions: 2800, pageViews: 8400 },
];

const categoryData = [
  { name: 'Technology', value: 35, courses: 42, revenue: 156000 },
  { name: 'Business', value: 25, courses: 28, revenue: 98000 },
  { name: 'Design', value: 18, courses: 21, revenue: 72000 },
  { name: 'Marketing', value: 12, courses: 15, revenue: 48000 },
  { name: 'Finance', value: 10, courses: 12, revenue: 42000 },
];

const deviceData = [
  { name: 'Desktop', value: 45, users: 2340 },
  { name: 'Mobile', value: 40, users: 2080 },
  { name: 'Tablet', value: 15, users: 780 },
];

const countryData = [
  { country: 'Kenya', users: 1250, revenue: 45000, flag: 'KE' },
  { country: 'Nigeria', users: 980, revenue: 38000, flag: 'NG' },
  { country: 'Tanzania', users: 720, revenue: 28000, flag: 'TZ' },
  { country: 'Uganda', users: 580, revenue: 22000, flag: 'UG' },
  { country: 'Ghana', users: 450, revenue: 18000, flag: 'GH' },
  { country: 'South Africa', users: 380, revenue: 15000, flag: 'ZA' },
  { country: 'Rwanda', users: 290, revenue: 11000, flag: 'RW' },
  { country: 'Ethiopia', users: 240, revenue: 9000, flag: 'ET' },
];

const topCourses = [
  { title: 'Python for Data Science', enrollments: 1250, revenue: 62500, rating: 4.8, completion: 78 },
  { title: 'Digital Marketing Mastery', enrollments: 980, revenue: 49000, rating: 4.7, completion: 72 },
  { title: 'Web Development Bootcamp', enrollments: 850, revenue: 42500, rating: 4.9, completion: 65 },
  { title: 'Business Analytics', enrollments: 720, revenue: 36000, rating: 4.6, completion: 81 },
  { title: 'UI/UX Design Fundamentals', enrollments: 680, revenue: 34000, rating: 4.8, completion: 69 },
];

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState('6m');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const stats = [
    {
      title: 'Total Users',
      value: '5,234',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      description: 'vs last period',
    },
    {
      title: 'Active Courses',
      value: '82',
      change: '+8.2%',
      trend: 'up',
      icon: BookOpen,
      description: 'vs last period',
    },
    {
      title: 'Total Revenue',
      value: '$169,000',
      change: '+23.1%',
      trend: 'up',
      icon: DollarSign,
      description: 'vs last period',
    },
    {
      title: 'Avg. Completion',
      value: '73%',
      change: '-2.3%',
      trend: 'down',
      icon: Target,
      description: 'vs last period',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Platform Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights into platform performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="3m">Last 3 months</SelectItem>
              <SelectItem value="6m">Last 6 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <Badge variant={stat.trend === 'up' ? 'default' : 'destructive'} className="gap-1">
                  {stat.trend === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {stat.change}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts */}
      <Tabs defaultValue="growth" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="growth" className="gap-2">
            <LineChart className="h-4 w-4" />
            <span className="hidden sm:inline">User Growth</span>
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Revenue</span>
          </TabsTrigger>
          <TabsTrigger value="engagement" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Engagement</span>
          </TabsTrigger>
          <TabsTrigger value="demographics" className="gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Demographics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="growth" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Growth Over Time</CardTitle>
              <CardDescription>Monthly user registration breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="students"
                      stackId="1"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.6}
                      name="Students"
                    />
                    <Area
                      type="monotone"
                      dataKey="instructors"
                      stackId="1"
                      stroke="hsl(var(--chart-2))"
                      fill="hsl(var(--chart-2))"
                      fillOpacity={0.6}
                      name="Instructors"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Enrollments</CardTitle>
              <CardDescription>Monthly revenue and course enrollment trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis yAxisId="left" className="text-xs" />
                    <YAxis yAxisId="right" orientation="right" className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value, name) => [
                        name === 'revenue' ? `$${value.toLocaleString()}` : value,
                        name === 'revenue' ? 'Revenue' : 'Enrollments'
                      ]}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill="hsl(var(--chart-1))" name="Revenue ($)" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="enrollments" fill="hsl(var(--chart-2))" name="Enrollments" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Engagement</CardTitle>
              <CardDescription>Daily active users and session metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="activeUsers" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Active Users" />
                    <Line type="monotone" dataKey="sessions" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Sessions" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Course Categories</CardTitle>
                <CardDescription>Revenue distribution by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name} ${value}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Usage</CardTitle>
                <CardDescription>Platform access by device type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {deviceData.map((device, index) => (
                  <div key={device.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {device.name === 'Desktop' && <Monitor className="h-4 w-4" />}
                        {device.name === 'Mobile' && <Smartphone className="h-4 w-4" />}
                        {device.name === 'Tablet' && <Tablet className="h-4 w-4" />}
                        <span className="text-sm font-medium">{device.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{device.value}%</span>
                    </div>
                    <Progress value={device.value} className="h-2" />
                    <p className="text-xs text-muted-foreground">{device.users.toLocaleString()} users</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Top Countries
            </CardTitle>
            <CardDescription>User distribution by country</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {countryData.slice(0, 6).map((item, index) => (
                <div key={item.country} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-medium text-muted-foreground w-6">{index + 1}</span>
                    <span className="font-medium">{item.country}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{item.users.toLocaleString()} users</span>
                    <span className="font-medium">${item.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Top Performing Courses
            </CardTitle>
            <CardDescription>Courses with highest enrollments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCourses.map((course, index) => (
                <div key={course.title} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-medium text-muted-foreground w-6">{index + 1}</span>
                      <span className="font-medium text-sm truncate max-w-[200px]">{course.title}</span>
                    </div>
                    <span className="text-sm font-medium">${course.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-4 ml-9 text-xs text-muted-foreground">
                    <span>{course.enrollments} enrollments</span>
                    <span>{course.rating} rating</span>
                    <span>{course.completion}% completion</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            Real-time Activity
            <Badge variant="outline" className="ml-2">Live</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold">247</p>
              <p className="text-sm text-muted-foreground">Active Users Now</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold">1,234</p>
              <p className="text-sm text-muted-foreground">Page Views (last hour)</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold">45</p>
              <p className="text-sm text-muted-foreground">Enrollments Today</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold">$2,340</p>
              <p className="text-sm text-muted-foreground">Revenue Today</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
