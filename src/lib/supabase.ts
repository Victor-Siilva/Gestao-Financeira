import { createClient } from '@supabase/supabase-js';

export type Employee = {
  id: string;
  name: string;
  role: string;
  payType: 'Hora' | 'Dia' | 'Mês';
  rate: number;
  status: 'Ativo' | 'Inativo';
};

export type Entry = {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  type: 'Receita' | 'Despesa';
};

export type WorkRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  payType: 'Hora' | 'Dia';
  rate: number;
  date: string;
  quantity: number;
};

export type WorkspaceData = {
  employees: Employee[];
  entries: Entry[];
  workRecords: WorkRecord[];
};

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;

function throwOnError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function employeeToRow(employee: Employee, ownerId: string) {
  return {
    id: employee.id,
    owner_id: ownerId,
    name: employee.name,
    role: employee.role,
    pay_type: employee.payType,
    rate: employee.rate,
    status: employee.status,
  };
}

function entryToRow(entry: Entry, ownerId: string) {
  return {
    id: entry.id,
    owner_id: ownerId,
    description: entry.description,
    category: entry.category,
    amount: entry.amount,
    entry_date: entry.date,
    entry_type: entry.type,
  };
}

function workRecordToRow(record: WorkRecord, ownerId: string) {
  return {
    id: record.id,
    owner_id: ownerId,
    employee_id: record.employeeId,
    employee_name: record.employeeName,
    role: record.role,
    pay_type: record.payType,
    rate: record.rate,
    work_date: record.date,
    quantity: record.quantity,
  };
}

export async function loadWorkspaceData(): Promise<WorkspaceData> {
  if (!supabase) throw new Error('Supabase não está configurado.');

  const [employeesResult, entriesResult, workRecordsResult] = await Promise.all([
    supabase.from('employees').select('*').order('created_at'),
    supabase.from('entries').select('*').order('entry_date', { ascending: false }),
    supabase.from('work_records').select('*').order('work_date', { ascending: false }),
  ]);
  throwOnError(employeesResult.error);
  throwOnError(entriesResult.error);
  throwOnError(workRecordsResult.error);

  return {
    employees: (employeesResult.data || []).map((row) => ({
      id: row.id,
      name: row.name,
      role: row.role,
      payType: row.pay_type,
      rate: Number(row.rate),
      status: row.status,
    })),
    entries: (entriesResult.data || []).map((row) => ({
      id: row.id,
      description: row.description,
      category: row.category,
      amount: Number(row.amount),
      date: row.entry_date,
      type: row.entry_type,
    })),
    workRecords: (workRecordsResult.data || []).map((row) => ({
      id: row.id,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      role: row.role,
      payType: row.pay_type,
      rate: Number(row.rate),
      date: row.work_date,
      quantity: Number(row.quantity),
    })),
  };
}

export async function saveEmployee(ownerId: string, employee: Employee) {
  if (!supabase) throw new Error('Supabase não está configurado.');
  const { error } = await supabase
    .from('employees')
    .upsert(employeeToRow(employee, ownerId), { onConflict: 'id' });
  throwOnError(error);
}

export async function saveEntry(ownerId: string, entry: Entry) {
  if (!supabase) throw new Error('Supabase não está configurado.');
  const { error } = await supabase
    .from('entries')
    .upsert(entryToRow(entry, ownerId), { onConflict: 'id' });
  throwOnError(error);
}

export async function saveWorkRecord(ownerId: string, record: WorkRecord) {
  if (!supabase) throw new Error('Supabase não está configurado.');
  const { error } = await supabase
    .from('work_records')
    .upsert(workRecordToRow(record, ownerId), { onConflict: 'id' });
  throwOnError(error);
}

export async function deleteEmployee(ownerId: string, id: string) {
  if (!supabase) throw new Error('Supabase não está configurado.');
  const { error } = await supabase.from('employees').delete().eq('id', id).eq('owner_id', ownerId);
  throwOnError(error);
}

export async function deleteEntry(ownerId: string, id: string) {
  if (!supabase) throw new Error('Supabase não está configurado.');
  const { error } = await supabase.from('entries').delete().eq('id', id).eq('owner_id', ownerId);
  throwOnError(error);
}

export async function deleteWorkRecord(ownerId: string, id: string) {
  if (!supabase) throw new Error('Supabase não está configurado.');
  const { error } = await supabase
    .from('work_records')
    .delete()
    .eq('id', id)
    .eq('owner_id', ownerId);
  throwOnError(error);
}

export async function importWorkspaceData(ownerId: string, data: WorkspaceData) {
  if (!supabase) throw new Error('Supabase não está configurado.');

  if (data.employees.length > 0) {
    const { error } = await supabase.from('employees').upsert(
      data.employees.map((employee) => employeeToRow(employee, ownerId)),
      {
        onConflict: 'id',
      },
    );
    throwOnError(error);
  }
  if (data.entries.length > 0) {
    const { error } = await supabase.from('entries').upsert(
      data.entries.map((entry) => entryToRow(entry, ownerId)),
      { onConflict: 'id' },
    );
    throwOnError(error);
  }
  if (data.workRecords.length > 0) {
    const { error } = await supabase.from('work_records').upsert(
      data.workRecords.map((record) => workRecordToRow(record, ownerId)),
      {
        onConflict: 'id',
      },
    );
    throwOnError(error);
  }
}
