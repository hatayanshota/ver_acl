'use client';

import { useEffect, useState } from 'react';

const DEPARTMENT_OBJECT_ID = '08d17c7a-dc0b-4c1f-9005-28b276e996cd';
const EMPLOYEE_OBJECT_ID = '80f035d9-5f40-4134-b1fc-c81098425a7b';

type JapanAIContext = {
  orgId: string;
  projectId: string;
  userId: string;
  email: string;
  userName: string;
  memberRole: string;
  orgName: string;
  pageId: string;
};

type Department = {
  id: string;
  name: string;
};

type Employee = {
  id: string;
  name: string;
  salary_amount: string;
  email: string;
  department_id: string;
};

type RecordItem<T> = { data: T };

type Tab = 'department' | 'employee';

function fetchRecords<T>(
  ctx: JapanAIContext,
  objectId: string
): Promise<T[]> {
  const path = `/api/custom-objects/v1/organizations/${ctx.orgId}/projects/${ctx.projectId}/objects/${objectId}/records`;
  return fetch(path, { headers: { 'Content-Type': 'application/json' } })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) =>
      (data?.data ?? [])
        .map((item: RecordItem<T>) => item.data)
        .filter((x: T | undefined | null): x is T => x != null)
    );
}

export default function CustomObjectsPage() {
  const [ctx, setCtx] = useState<JapanAIContext | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('department');

  useEffect(() => {
    const init = () => {
      const context = window.JapanAI?.getContext() as JapanAIContext | undefined;
      if (!context) return;
      setCtx(context);

      Promise.all([
        fetchRecords<Department>(context, DEPARTMENT_OBJECT_ID),
        fetchRecords<Employee>(context, EMPLOYEE_OBJECT_ID),
      ])
        .then(([deps, emps]) => {
          setDepartments(deps);
          setEmployees(emps);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    };

    if (window.JapanAI) {
      init();
    } else {
      window.addEventListener('prs-auth-ready', init, { once: true });
      return () => window.removeEventListener('prs-auth-ready', init);
    }
  }, []);

  if (loading) return <p style={styles.message}>読み込み中...</p>;
  if (error) return <p style={styles.error}>エラー: {error}</p>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.h1}>カスタムオブジェクト一覧</h1>
        {ctx && <p style={styles.org}>{ctx.orgName}</p>}
      </div>

      <div style={styles.tabList}>
        <button
          style={activeTab === 'department' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('department')}
        >
          部署
          <span style={activeTab === 'department' ? styles.badgeActive : styles.badge}>
            {departments.length}
          </span>
        </button>
        <button
          style={activeTab === 'employee' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('employee')}
        >
          従業員
          <span style={activeTab === 'employee' ? styles.badgeActive : styles.badge}>
            {employees.length}
          </span>
        </button>
      </div>

      <div style={styles.tableWrapper}>
        {activeTab === 'department' && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>部署ID</th>
                <th style={styles.th}>部署名</th>
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr><td colSpan={2} style={styles.empty}>データなし</td></tr>
              ) : departments.map((d) => (
                <tr key={d.id} style={styles.tr}>
                  <td style={styles.td}>{d.id}</td>
                  <td style={styles.td}>{d.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'employee' && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>従業員ID</th>
                <th style={styles.th}>名前</th>
                <th style={styles.th}>給与額</th>
                <th style={styles.th}>メール</th>
                <th style={styles.th}>部署ID</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr><td colSpan={5} style={styles.empty}>データなし</td></tr>
              ) : employees.map((e) => (
                <tr key={e.id} style={styles.tr}>
                  <td style={styles.td}>{e.id}</td>
                  <td style={styles.td}>{e.name}</td>
                  <td style={styles.td}>{e.salary_amount}</td>
                  <td style={styles.td}>{e.email}</td>
                  <td style={styles.td}>{e.department_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: '1.5rem',
    maxWidth: '1000px',
    margin: '0 auto',
    height: '100vh',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    boxSizing: 'border-box' as const,
  },
  header: {
    marginBottom: '1.25rem',
  },
  h1: {
    fontSize: '1.4rem',
    fontWeight: 600,
    margin: '0 0 0.25rem',
    color: '#111827',
  },
  org: {
    color: '#6b7280',
    margin: 0,
    fontSize: '0.875rem',
  },
  tabList: {
    display: 'flex' as const,
    gap: '0.25rem',
    borderBottom: '2px solid #e5e7eb',
    marginBottom: '0',
  },
  tab: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '0.5rem',
    padding: '0.6rem 1.25rem',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: '#6b7280',
    borderBottom: '2px solid transparent',
    marginBottom: '-2px',
    borderRadius: '4px 4px 0 0',
    transition: 'color 0.15s',
  },
  tabActive: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '0.5rem',
    padding: '0.6rem 1.25rem',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: '#2563eb',
    fontWeight: 600,
    borderBottom: '2px solid #2563eb',
    marginBottom: '-2px',
    borderRadius: '4px 4px 0 0',
  },
  badge: {
    fontSize: '0.75rem',
    background: '#e5e7eb',
    color: '#6b7280',
    borderRadius: '9999px',
    padding: '0.1rem 0.5rem',
  },
  badgeActive: {
    fontSize: '0.75rem',
    background: '#dbeafe',
    color: '#2563eb',
    borderRadius: '9999px',
    padding: '0.1rem 0.5rem',
  },
  tableWrapper: {
    flex: 1,
    overflowY: 'auto' as const,
    border: '1px solid #e5e7eb',
    borderTop: 'none',
    borderRadius: '0 0 8px 8px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    textAlign: 'left' as const,
    padding: '0.65rem 1rem',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#374151',
    position: 'sticky' as const,
    top: 0,
    zIndex: 1,
  },
  tr: {
    transition: 'background 0.1s',
  },
  td: {
    padding: '0.65rem 1rem',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '0.875rem',
    color: '#374151',
  },
  empty: {
    padding: '2rem',
    color: '#9ca3af',
    textAlign: 'center' as const,
    fontSize: '0.875rem',
  },
  message: {
    padding: '2rem',
    color: '#6b7280',
    fontFamily: 'sans-serif',
  },
  error: {
    padding: '2rem',
    color: '#ef4444',
    fontFamily: 'sans-serif',
  },
} as const;
