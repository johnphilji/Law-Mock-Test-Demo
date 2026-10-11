"use client";

import { useState } from "react";
import { Card, CardHeader, StatCard, Badge, DataTable, type Column } from "@/components/ui/components";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime, formatRelative } from "@/utils/formatters";
import {
  mockDashboardStats,
  mockPayments,
  mockStudents,
  mockObjections,
  mockTests,
  mockRevenueData,
  type MockPayment,
  type MockUser,
  type MockObjection,
  type MockTest,
} from "@/lib/mock-data";
import Link from "next/link";

// =============================================================================
// MINI REVENUE CHART (SVG-based, no dependency)
// =============================================================================

function MiniRevenueChart() {
  const data = mockRevenueData;
  const maxRevenue = Math.max(...data.map((d) => d.revenuePaise), 1);
  const width = 600;
  const height = 160;
  const padding = { top: 10, right: 10, bottom: 30, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartW,
    y: padding.top + chartH - (d.revenuePaise / maxRevenue) * chartH,
    label: d.date.slice(5),
    value: d.revenuePaise,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]!.x} ${padding.top + chartH} L ${points[0]!.x} ${padding.top + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
        const y = padding.top + chartH - pct * chartH;
        return (
          <g key={pct}>
            <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={padding.left - 6} y={y + 4} textAnchor="end" className="text-[9px] fill-[#627d98]">
              {formatCurrency(maxRevenue * pct)}
            </text>
          </g>
        );
      })}

      {/* Area */}
      <path d={areaPath} fill="url(#revenue-gradient)" />
      <defs>
        <linearGradient id="revenue-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#334e68" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#334e68" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Line */}
      <path d={linePath} fill="none" stroke="#334e68" strokeWidth="2" />

      {/* Dots and x-labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#334e68" />
          {i % 2 === 0 && (
            <text x={p.x} y={height - 6} textAnchor="middle" className="text-[9px] fill-[#627d98]">
              {p.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

// =============================================================================
// DASHBOARD PAGE
// =============================================================================

export default function AdminDashboardPage() {
  const stats = mockDashboardStats;
  const recentPayments = mockPayments.slice(0, 5);
  const recentStudents = mockStudents.slice(-5).reverse();
  const recentObjections = mockObjections.filter((o) => o.status === "OPEN" || o.status === "UNDER_REVIEW");
  const recentTests = mockTests.filter((t) => t.status === "PUBLISHED").slice(0, 4);

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  const paymentColumns: Column<MockPayment>[] = [
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

  const studentColumns: Column<MockUser>[] = [
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Students" value={stats.totalStudents} />
        <StatCard label="Active Students" value={stats.activeStudents} />
        <StatCard label="Published Exams" value={stats.publishedExams} />
        <StatCard label="Published Tests" value={stats.publishedMockTests} />
        <StatCard label="Active Subscriptions" value={stats.activeSubscriptions} />
        <StatCard label="Today's Revenue" value={formatCurrency(stats.todayRevenuePaise)} />
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader
          title="Revenue (Last 30 Days)"
          description={`Total: ${formatCurrency(stats.totalRevenuePaise)}`}
        />
        <div className="mt-4">
          <MiniRevenueChart />
        </div>
      </Card>

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
            <DataTable columns={paymentColumns} data={recentPayments} />
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
            <DataTable columns={studentColumns} data={recentStudents} />
          </div>
        </Card>
      </div>

      {/* Objections + Recent Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Open Objections */}
        <Card>
          <CardHeader
            title="Open Objections"
            description={`${recentObjections.length} pending review`}
            action={
              <Link href="/admin/objections">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            }
          />
          <div className="mt-3 space-y-3">
            {recentObjections.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No open objections</p>
            ) : (
              recentObjections.map((obj) => (
                <div key={obj.id} className="border border-border rounded-md p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{obj.questionText}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        by {obj.studentName} · {formatRelative(obj.submittedAt)}
                      </p>
                    </div>
                    <Badge variant={obj.status === "OPEN" ? "open" : "under-review"}>
                      {obj.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{obj.objectionText}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recently Published Tests */}
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
            {recentTests.map((test) => (
              <div key={test.id} className="flex items-center justify-between border border-border rounded-md p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{test.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline">{test.type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {test.totalQuestions} Qs · {test.durationMinutes} min
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium tabular-nums">{test.attemptCount}</p>
                  <p className="text-xs text-muted-foreground">attempts</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
