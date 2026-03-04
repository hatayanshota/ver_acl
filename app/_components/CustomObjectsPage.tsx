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

type RecordItem<T> = { fields: T };

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
      (data?.data ?? []).map((item: RecordItem<T>) => item.fields)
    );
}

export default function CustomObjectsPage() {
  const [ctx, setCtx] = useState<JapanAIContext | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <h1 style={styles.h1}>カスタムオブジェクト一覧</h1>
      {ctx && <p style={styles.org}>{ctx.orgName}</p>}

      <section style={styles.section}>
        <h2 style={styles.h2}>部署 ({departments.length}件)</h2>
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
              <tr key={d.id}>
                <td style={styles.td}>{d.id}</td>
                <td style={styles.td}>{d.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={styles.section}>
        <h2 style={styles.h2}>従業員 ({employees.length}件)</h2>
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
              <tr key={e.id}>
                <td style={styles.td}>{e.id}</td>
                <td style={styles.td}>{e.name}</td>
                <td style={styles.td}>{e.salary_amount}</td>
                <td style={styles.td}>{e.email}</td>
                <td style={styles.td}>{e.department_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

const styles = {
  container: { fontFamily: 'sans-serif', padding: '2rem', maxWidth: '1000px', margin: '0 auto' },
  h1: { fontSize: '1.5rem', marginBottom: '0.25rem' },
  org: { color: '#666', marginBottom: '2rem' },
  section: { marginBottom: '2rem' },
  h2: { fontSize: '1.1rem', marginBottom: '0.5rem' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, padding: '0.5rem 0.75rem', background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' },
  td: { padding: '0.5rem 0.75rem', borderBottom: '1px solid #e5e7eb' },
  empty: { padding: '0.75rem', color: '#9ca3af', textAlign: 'center' as const },
  message: { padding: '2rem', color: '#6b7280' },
  error: { padding: '2rem', color: '#ef4444' },
} as const;
