"use client";

import { useState, useEffect, useCallback } from "react";

type TableStatus = Record<string, boolean>;

export default function SetupPage() {
  const [tableStatus, setTableStatus] = useState<TableStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [sql, setSql] = useState("");

  const checkStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/setup/status");
      if (!res.ok) throw new Error("Failed to check status");
      const data = await res.json();
      setTableStatus(data.tables);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSql = useCallback(async () => {
    try {
      const res = await fetch("/api/setup/sql");
      if (res.ok) setSql(await res.text());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    checkStatus();
    loadSql();
  }, [checkStatus, loadSql]);

  const copySql = async () => {
    await navigator.clipboard.writeText(sql);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  const tables = tableStatus ? Object.entries(tableStatus) : [];
  const tablesReady = tables.filter(([, ok]) => ok).length;
  const tablesTotal = tables.length;
  const allReady = tables.length > 0 && tables.every(([, ok]) => ok);

  const supabaseDashboardUrl = `https://supabase.com/dashboard/project/keomdmxshloecxtfybpc/sql/new`;

  return (
    <div className="min-h-screen bg-surface-canvas flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-surface-studio border border-outline-variant rounded-xl p-8 shadow-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent-indigo/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-accent-indigo text-3xl">
              settings
            </span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface mb-2">
            Dropcue Setup
          </h1>
          <p className="text-secondary">
            Configure your database and storage to get started.
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-surface-canvas border border-outline-variant rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-on-surface">
              Database Status
            </h2>
            <button
              onClick={checkStatus}
              disabled={loading}
              className="text-sm text-accent-indigo hover:underline disabled:opacity-50"
            >
              {loading ? "Checking..." : "Refresh"}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {tables.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-secondary">
                  {tablesReady}/{tablesTotal} tables ready
                </span>
                <div className="w-32 bg-outline-variant rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      allReady ? "bg-success-green" : "bg-accent-indigo"
                    }`}
                    style={{
                      width: `${(tablesReady / tablesTotal) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {tables.map(([name, ok]) => (
                  <div
                    key={name}
                    className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-md ${
                      ok
                        ? "bg-success-green/10 text-success-green"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        ok ? "bg-success-green" : "bg-red-400"
                      }`}
                    />
                    {name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && !tableStatus && (
            <div className="flex items-center gap-2 text-secondary text-sm">
              <div className="w-4 h-4 border-2 border-accent-indigo border-t-transparent rounded-full animate-spin" />
              Checking database...
            </div>
          )}
        </div>

        {/* Action Card */}
        {allReady ? (
          <div className="bg-success-green/10 border border-success-green/30 rounded-lg p-6 text-center">
            <span className="material-symbols-outlined text-success-green text-4xl mb-2">
              check_circle
            </span>
            <h3 className="text-lg font-semibold text-on-surface mb-1">
              Database is ready!
            </h3>
            <p className="text-secondary text-sm mb-4">
              All tables have been created successfully.
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center bg-accent-indigo text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-accent-indigo/90 transition-colors"
            >
              Go to Dashboard
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Step 1: Copy SQL */}
            <div className="bg-surface-canvas border border-outline-variant rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="w-6 h-6 bg-accent-indigo text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <h3 className="font-semibold text-on-surface">
                    Copy the migration SQL
                  </h3>
                  <p className="text-sm text-secondary mt-1">
                    This creates all required tables, indexes, and RLS policies.
                  </p>
                </div>
              </div>
              <div className="relative">
                <pre className="bg-primary-container text-primary-fixed-dim p-4 rounded-md text-xs overflow-auto max-h-40 font-mono">
                  {sql || "Loading SQL..."}
                </pre>
                <button
                  onClick={copySql}
                  className="absolute top-2 right-2 bg-surface-studio text-on-surface border border-outline-variant px-3 py-1 rounded text-xs hover:bg-surface-container-low transition-colors"
                >
                  {sqlCopied ? "✓ Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Step 2: Open SQL Editor */}
            <div className="bg-surface-canvas border border-outline-variant rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="w-6 h-6 bg-accent-indigo text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <h3 className="font-semibold text-on-surface">
                    Open Supabase SQL Editor
                  </h3>
                  <p className="text-sm text-secondary mt-1">
                    Paste the SQL and click &quot;Run&quot;.
                  </p>
                </div>
              </div>
              <a
                href={supabaseDashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-accent-indigo text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-accent-indigo/90 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">
                  open_in_new
                </span>
                Open SQL Editor
              </a>
            </div>

            {/* Step 3: Create Storage Bucket */}
            <div className="bg-surface-canvas border border-outline-variant rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="w-6 h-6 bg-accent-indigo text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <h3 className="font-semibold text-on-surface">
                    Create Storage Bucket
                  </h3>
                  <p className="text-sm text-secondary mt-1">
                    In Supabase Dashboard → Storage → New bucket:
                  </p>
                  <ul className="text-sm text-secondary mt-2 space-y-1 ml-4">
                    <li>
                      • Bucket name: <code className="bg-surface-container-low px-1 rounded">products</code>
                    </li>
                    <li>• Public: No</li>
                    <li>• File size limit: 1 GB</li>
                    <li>• Allowed MIME types: <code className="bg-surface-container-low px-1 rounded">*/*</code></li>
                  </ul>
                </div>
              </div>
              <a
                href={`https://supabase.com/dashboard/project/keomdmxshloecxtfybpc/storage/buckets`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-surface-studio text-on-surface border border-outline-variant px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-lg">
                  folder
                </span>
                Open Storage
              </a>
            </div>

            {/* Step 4: Enable Auth */}
            <div className="bg-surface-canvas border border-outline-variant rounded-lg p-6">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-accent-indigo text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <h3 className="font-semibold text-on-surface">
                    Enable Email Auth
                  </h3>
                  <p className="text-sm text-secondary mt-1">
                    In Supabase Dashboard → Authentication → Providers → Email:
                    Make sure &quot;Confirm email&quot; is set to your preference
                    (disable for testing).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
