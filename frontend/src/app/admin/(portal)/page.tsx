"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, StatCard, Badge, DataTable, type Column } from "@/components/ui/components";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatRelative } from "@/utils/formatters";
import Link from "next/link";

interface RealPayment {
  id: string;
  userName: string;
  userEmail: string;
  amountPaise: number;
  status: string;
  createdAt: string;
}

interface RealStudent {
  id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

interface RealTest {
  id: string;
  title: string;
  examName: string;
  type: string;
  totalQuestions: number;
  durationMinutes: number;
  pricePaise: number;
  discountedPricePaise: number | null;
  isFree?: boolean;
  status: string;
}

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  publishedExams: number;
  publishedMockTests: number;
  activeSubscriptions: number;
  todayRevenuePaise: number;
  totalRevenuePaise: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeStudents: 0,
    publishedExams: 0,
    publishedMockTests: 0,
    activeSubscriptions: 0,
    todayRevenuePaise: 0,
    totalRevenuePaise: 0,
  });
  const [recentPayments, setRecentPayments] = useState<RealPayment[]>([]);
  const [recentStudents, setRecentStudents] = useState<RealStudent[]>([]);
  const [recentTests, setRecentTests] = useState<RealTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.stats) setStats(data.stats);
          if (Array.isArray(data.recentPayments)) setRecentPayments(data.recentPayments);
          if (Array.isArray(data.recentStudents)) setRecentStudents(data.recentStudents);
          if (Array.isArray(data.recentTests)) setRecentTests(data.recentTests);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  const paymentColumns: Column<RealPayment>[] = [
    { key: "user", header: "Student", render: (r) => (
      <div>
        <p className="font-medium text-foreground">{r.userName}</p>
        <p className="text-xs text-muted-foreground">{r.userEmail}</p>
      </div>
    )},
    { key: "amount", header: "Amount", render: (r) => formatCurrency(r.amountPaise) },
    { key: "status", header: "Status", render: (r) => {
      const v = r.status.toLowerCase();
      return <Badge variant={v}>{r.status}</Badge>;
    }},
    { key: "date", header: "Date", render: (r) => (
      <span className="text-muted-foreground text-xs">{formatRelative(r.createdAt)}</span>
    )},
  ];

  const studentColumns: Column<RealStudent>[] = [
    { key: "name", header: "Name", render: (r) => (
      <div>
        <p className="font-medium text-foreground">{r.name}</p>
        <p className="text-xs text-muted-foreground">{r.email}</p>
      </div>
    )},
    { key: "verified", header: "Status", render: (r) => (
      <div className="flex gap-1.5">
        <Badge variant={r.isEmailVerified ? "success" : "warning"}>
          {r.isEmailVerified ? "Verified" : "Unverified"}
        </Badge>
        {!r.isActive && <Badge variant="inactive">Inactive</Badge>}
      </div>
    )},
    { key: "date", header: "Registered", render: (r) => (
      <span className="text-muted-foreground text-xs">{formatRelative(r.createdAt)}</span>
    )},
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {greeting}, Admin. {now.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* Summary Cards with Real Data */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Students" value={stats.totalStudents} />
        <StatCard label="Active Students" value={stats.activeStudents} />
        <StatCard label="Published Exams" value={stats.publishedExams} />
        <StatCard label="Published Tests" value={stats.publishedMockTests} />
        <StatCard label="Active Subscriptions" value={stats.activeSubscriptions} />
        <StatCard label="Today's Revenue" value={formatCurrency(stats.todayRevenuePaise)} />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Payments */}
        <Card padding="none">
          <div className="px-4 pt-4 sm:px-5 sm:pt-5">
            <CardHeader
              title="Recent Payments"
              action={
                <Link href="/admin/payments">
                  <Button variant="ghost" size="sm">View all</Button>
                </Link>
              }
            />
          </div>
          <div className="mt-3">
            {recentPayments.length > 0 ? (
              <DataTable columns={paymentColumns} data={recentPayments} />
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No payments recorded yet. Student transactions will appear here.
              </div>
            )}
          </div>
        </Card>

        {/* Recent Registrations */}
        <Card padding="none">
          <div className="px-4 pt-4 sm:px-5 sm:pt-5">
            <CardHeader
              title="Recent Registrations"
              action={
                <Link href="/admin/users">
                  <Button variant="ghost" size="sm">View all</Button>
                </Link>
              }
            />
          </div>
          <div className="mt-3">
            {recentStudents.length > 0 ? (
              <DataTable columns={studentColumns} data={recentStudents} />
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No registered students yet.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Published Tests Card */}
      <Card>
        <CardHeader
          title="Published Tests"
          action={
            <Link href="/admin/tests">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          }
        />
        <div className="mt-3 space-y-2">
          {recentTests.length > 0 ? (
            recentTests.map((test) => (
              <div key={test.id} className="flex items-center justify-between border border-border rounded-md p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{test.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline">{test.type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {test.examName} • {test.durationMinutes} min
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No mock tests published yet.</p>
              <Link href="/admin/tests/new" className="mt-2 inline-block">
                <Button size="sm" variant="outline">Create New Test</Button>
              </Link>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
