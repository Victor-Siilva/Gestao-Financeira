import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  TrendingDown,
  Wallet,
  ChartNoAxesCombined,
  Clock3,
  Menu,
  X,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Trash2,
  Pencil,
  CircleDollarSign,
  BriefcaseBusiness,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { supabase } from './lib/supabase';

type Employee = {
  id: string;
  name: string;
  role: string;
  payType: 'Hora' | 'Dia' | 'Mês';
  rate: number;
  status: 'Ativo' | 'Inativo';
};
type Entry = {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  type: 'Receita' | 'Despesa';
};
type WorkRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  payType: 'Hora' | 'Dia';
  rate: number;
  date: string;
  quantity: number;
};
type PayrollRow = {
  id: string;
  employeeName: string;
  role: string;
  payType: Employee['payType'];
  period: string;
  quantity: number | null;
  rate: number;
  total: number;
};
function isHourlyOrDaily(
  employee: Employee,
): employee is Employee & { payType: WorkRecord['payType'] } {
  return employee.payType === 'Hora' || employee.payType === 'Dia';
}
const today = new Date().toISOString().slice(0, 10);
const currentMonth = today.slice(0, 7);
const initialEmployees: Employee[] = [
  {
    id: 'e1',
    name: 'Mariana Costa',
    role: 'Administrativo',
    payType: 'Mês',
    rate: 3200,
    status: 'Ativo',
  },
  {
    id: 'e2',
    name: 'Lucas Oliveira',
    role: 'Operacional',
    payType: 'Hora',
    rate: 18,
    status: 'Ativo',
  },
  {
    id: 'e3',
    name: 'Rafael Santos',
    role: 'Serviços gerais',
    payType: 'Dia',
    rate: 150,
    status: 'Ativo',
  },
];
const initialEntries: Entry[] = [
  {
    id: 'r1',
    description: 'Serviço de manutenção',
    category: 'Serviços',
    amount: 8500,
    date: today,
    type: 'Receita',
  },
  {
    id: 'r2',
    description: 'Contrato mensal',
    category: 'Contratos',
    amount: 6400,
    date: today,
    type: 'Receita',
  },
  {
    id: 'd1',
    description: 'Compra de materiais',
    category: 'Materiais',
    amount: 2150,
    date: today,
    type: 'Despesa',
  },
  {
    id: 'd2',
    description: 'Aluguel',
    category: 'Estrutura',
    amount: 1800,
    date: today,
    type: 'Despesa',
  },
  {
    id: 'd3',
    description: 'Internet e telefone',
    category: 'Contas',
    amount: 280,
    date: today,
    type: 'Despesa',
  },
];
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
async function exportPDF(
  entries: Entry[],
  employees: Employee[],
  payrollRows: PayrollRow[],
  payrollMonth: string,
  receitas: number,
  despesas: number,
  folha: number,
  lucro: number,
) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth(),
    pageHeight = pdf.internal.pageSize.getHeight(),
    margin = 14;
  const widths = [31, 91, 55, 43, 38],
    tableWidth = widths.reduce((sum, width) => sum + width, 0);
  const colors = {
    background: [8, 11, 19] as const,
    panel: [11, 13, 18] as const,
    header: [16, 19, 27] as const,
    border: [34, 39, 53] as const,
    text: [238, 242, 255] as const,
    muted: [137, 147, 168] as const,
    blue: [8, 120, 249] as const,
    green: [57, 217, 160] as const,
    orange: [255, 184, 92] as const,
  };
  const paintBackground = () => {
    pdf.setFillColor(...colors.background);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  };
  const drawTableHeader = (top: number) => {
    pdf.setFillColor(...colors.header);
    pdf.roundedRect(margin, top, tableWidth, 10, 1, 1, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.muted);
    ['TIPO', 'DESCRIÇÃO', 'CATEGORIA', 'VALOR', 'DATA'].forEach((label, index) =>
      pdf.text(
        label,
        margin + widths.slice(0, index).reduce((sum, width) => sum + width, 0) + 4,
        top + 6.5,
      ),
    );
  };
  const drawEmployeeTableHeader = (top: number) => {
    pdf.setFillColor(...colors.header);
    pdf.roundedRect(margin, top, tableWidth, 10, 1, 1, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.muted);
    ['FUNCIONÁRIO', 'CARGO', 'PAGAMENTO', 'VALOR BASE', 'STATUS'].forEach((label, index) =>
      pdf.text(
        label,
        margin + widths.slice(0, index).reduce((sum, width) => sum + width, 0) + 4,
        top + 6.5,
      ),
    );
  };
  const drawPayrollTableHeader = (top: number) => {
    pdf.setFillColor(...colors.header);
    pdf.roundedRect(margin, top, tableWidth, 10, 1, 1, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.muted);
    ['FUNCIONÁRIO', 'CARGO', 'TIPO', 'PERÍODO / QTD.', 'VALOR BASE', 'TOTAL'].forEach(
      (label, index) => {
        const payrollWidths = [51, 56, 38, 48, 42, 23];
        pdf.text(
          label,
          margin + payrollWidths.slice(0, index).reduce((sum, width) => sum + width, 0) + 3,
          top + 6.5,
        );
      },
    );
  };
  const drawSectionTitle = (title: string, subtitle: string) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(...colors.text);
    pdf.text(title, margin, 17);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.muted);
    pdf.text(subtitle, margin, 23);
  };
  paintBackground();
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(17);
  pdf.setTextColor(...colors.text);
  pdf.text('Gestão de Finanças | Relatório financeiro', margin, 17);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...colors.muted);
  pdf.text(
    `Gerado em ${new Intl.DateTimeFormat('pt-BR').format(new Date())} · Folha de ${new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(`${payrollMonth}-01T12:00:00`))}`,
    margin,
    23,
  );
  const summary = [
    ['LUCROS', receitas, colors.green],
    ['DESPESAS', despesas, colors.orange],
    ['FOLHA DO PERÍODO', folha, colors.orange],
    ['RESULTADO', lucro, lucro >= 0 ? colors.blue : colors.orange],
  ] as const;
  const cardWidth = (tableWidth - 12) / 4;
  summary.forEach(([label, value, color], index) => {
    const x = margin + index * (cardWidth + 4);
    pdf.setFillColor(...colors.panel);
    pdf.setDrawColor(...colors.border);
    pdf.roundedRect(x, 29, cardWidth, 18, 2, 2, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(...colors.muted);
    pdf.text(label, x + 4, 35);
    pdf.setFontSize(10);
    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.text(brl(value), x + 4, 42);
  });
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(...colors.text);
  pdf.text('Visão geral: lucros e prejuízos', margin, 57);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...colors.muted);
  pdf.text('Lucros à direita; despesas, folha e prejuízos à esquerda.', margin, 63);

  const chartMetrics = [
    { label: 'Lucros', value: receitas, color: colors.green },
    { label: 'Despesas', value: -despesas, color: colors.orange },
    { label: 'Folha estimada', value: -folha, color: colors.orange },
    { label: 'Lucro / prejuízo', value: lucro, color: lucro >= 0 ? colors.blue : colors.orange },
  ];
  const chartLabelWidth = 48;
  const chartLeft = margin + chartLabelWidth;
  const chartPlotWidth = tableWidth - chartLabelWidth - 42;
  const chartZero = chartLeft + chartPlotWidth / 2;
  const chartRadius = chartPlotWidth / 2 - 5;
  const maxChartValue = Math.max(...chartMetrics.map((metric) => Math.abs(metric.value)), 1);
  const chartTop = 69;
  const chartRowHeight = 10;

  pdf.setDrawColor(...colors.border);
  pdf.setLineWidth(0.35);
  pdf.line(chartZero, chartTop - 2, chartZero, chartTop + chartMetrics.length * chartRowHeight - 2);
  chartMetrics.forEach((metric, index) => {
    const rowY = chartTop + index * chartRowHeight;
    const barWidth = (Math.abs(metric.value) / maxChartValue) * chartRadius;
    const barX = metric.value < 0 ? chartZero - barWidth : chartZero;
    const color = metric.color;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.text);
    pdf.text(metric.label, margin, rowY + 4);
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.roundedRect(barX, rowY, Math.max(barWidth, 0.6), 5, 1, 1, 'F');
    pdf.setFontSize(7);
    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.text(brl(metric.value), margin + tableWidth, rowY + 4, { align: 'right' });
  });

  pdf.addPage();
  paintBackground();
  drawSectionTitle(
    'Apuração da folha',
    `Período: ${new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(`${payrollMonth}-01T12:00:00`))} · Total calculado: ${brl(folha)}`,
  );
  const payrollWidths = [51, 56, 38, 48, 42, 23];
  const payrollTableWidth = payrollWidths.reduce((sum, width) => sum + width, 0);
  let payrollY = 29;
  drawPayrollTableHeader(payrollY);
  payrollY += 10;

  const drawPayrollContinuation = () => {
    pdf.addPage();
    paintBackground();
    drawSectionTitle('Apuração da folha | continuação', `Total calculado: ${brl(folha)}`);
    payrollY = 29;
    drawPayrollTableHeader(payrollY);
    payrollY += 10;
  };

  if (payrollRows.length === 0) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.muted);
    pdf.text('Nenhum salário ou hora/diária registrada neste período.', margin + 4, payrollY + 7);
  } else {
    payrollRows.forEach((row, index) => {
      if (payrollY + 12 > pageHeight - 15) drawPayrollContinuation();
      const rowColor = index % 2 === 0 ? colors.panel : colors.background;
      pdf.setFillColor(rowColor[0], rowColor[1], rowColor[2]);
      pdf.rect(margin, payrollY, payrollTableWidth, 12, 'F');
      pdf.setDrawColor(...colors.border);
      pdf.line(margin, payrollY + 12, margin + payrollTableWidth, payrollY + 12);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(...colors.text);
      pdf.text(
        pdf.splitTextToSize(row.employeeName, payrollWidths[0] - 6),
        margin + 3,
        payrollY + 7,
      );
      pdf.setTextColor(...colors.muted);
      pdf.text(
        pdf.splitTextToSize(row.role, payrollWidths[1] - 6),
        margin + payrollWidths[0] + 3,
        payrollY + 7,
      );
      pdf.text(row.payType, margin + payrollWidths[0] + payrollWidths[1] + 3, payrollY + 7);
      const quantityLabel =
        row.quantity === null
          ? row.period
          : `${row.period} · ${row.quantity} ${row.payType === 'Hora' ? 'h' : 'diárias'}`;
      pdf.text(
        pdf.splitTextToSize(quantityLabel, payrollWidths[3] - 6),
        margin + payrollWidths.slice(0, 3).reduce((sum, width) => sum + width, 0) + 3,
        payrollY + 7,
      );
      pdf.text(
        brl(row.rate),
        margin + payrollWidths.slice(0, 5).reduce((sum, width) => sum + width, 0) - 3,
        payrollY + 7,
        { align: 'right' },
      );
      pdf.setTextColor(...colors.blue);
      pdf.text(brl(row.total), margin + payrollTableWidth - 3, payrollY + 7, { align: 'right' });
      payrollY += 12;
    });
  }

  pdf.addPage();
  paintBackground();
  drawSectionTitle(
    'Funcionários cadastrados',
    `${employees.length} funcionários · ${brl(folha)} em folha mensal estimada`,
  );
  let y = 29;
  drawEmployeeTableHeader(y);
  y += 10;
  if (employees.length === 0) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.muted);
    pdf.text('Nenhum funcionário cadastrado.', margin + 4, y + 7);
  } else {
    employees.forEach((employee, index) => {
      const name = pdf.splitTextToSize(employee.name, widths[0] - 8) as string[];
      const role = pdf.splitTextToSize(employee.role, widths[1] - 8) as string[];
      const rowHeight = Math.max(name.length, role.length, 1) * 5 + 5;
      if (y + rowHeight > pageHeight - 15) {
        paintBackground();
        drawSectionTitle(
          'Funcionários cadastrados | continuação',
          `${employees.length} funcionários`,
        );
        y = 29;
        drawEmployeeTableHeader(y);
        y += 10;
      }

      const rowColor = index % 2 === 0 ? colors.panel : colors.background;
      pdf.setFillColor(rowColor[0], rowColor[1], rowColor[2]);
      pdf.rect(margin, y, tableWidth, rowHeight, 'F');
      pdf.setDrawColor(...colors.border);
      pdf.line(margin, y + rowHeight, margin + tableWidth, y + rowHeight);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(...colors.text);
      pdf.text(name, margin + 4, y + 7);
      pdf.setTextColor(...colors.muted);
      pdf.text(role, margin + widths[0] + 4, y + 7);
      pdf.text(employee.payType, margin + widths[0] + widths[1] + 4, y + 7);
      const rateSuffix =
        employee.payType === 'Hora' ? '/h' : employee.payType === 'Dia' ? '/dia' : '';
      pdf.setTextColor(...colors.text);
      pdf.text(
        `${brl(employee.rate)}${rateSuffix}`,
        margin + widths[0] + widths[1] + widths[2] + widths[3] - 4,
        y + 7,
        { align: 'right' },
      );
      const statusColor = employee.status === 'Ativo' ? colors.green : colors.muted;
      pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      pdf.text(employee.status, margin + tableWidth - widths[4] + 4, y + 7);
      y += rowHeight;
    });
  }

  pdf.addPage();
  paintBackground();
  drawSectionTitle('Lançamentos financeiros', `${entries.length} lançamentos registrados`);
  y = 29;
  drawTableHeader(y);
  y += 10;
  const drawContinuationHeader = () => {
    paintBackground();
    drawSectionTitle('Lançamentos financeiros | continuação', `${entries.length} lançamentos`);
    y = 29;
    drawTableHeader(y);
    y += 10;
  };
  if (entries.length === 0) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.muted);
    pdf.text('Nenhum lançamento cadastrado.', margin + 4, y + 7);
  } else {
    entries.forEach((entry, index) => {
      const description = pdf.splitTextToSize(entry.description, widths[1] - 8) as string[];
      const category = pdf.splitTextToSize(entry.category, widths[2] - 8) as string[];
      const rowHeight = Math.max(description.length, category.length, 1) * 5 + 5;
      if (y + rowHeight > pageHeight - 15) drawContinuationHeader();
      const columns = [
        entry.type === 'Receita' ? 'Lucros' : entry.type,
        description,
        category,
        brl(entry.amount),
        entry.date.split('-').reverse().join('/'),
      ];
      const xPositions = widths.map(
        (_, column) => margin + widths.slice(0, column).reduce((sum, width) => sum + width, 0),
      );
      const rowColor = index % 2 === 0 ? colors.panel : colors.background;
      pdf.setFillColor(rowColor[0], rowColor[1], rowColor[2]);
      pdf.rect(margin, y, tableWidth, rowHeight, 'F');
      pdf.setDrawColor(...colors.border);
      pdf.line(margin, y + rowHeight, margin + tableWidth, y + rowHeight);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      const typeColor = entry.type === 'Receita' ? colors.green : colors.orange;
      pdf.setTextColor(typeColor[0], typeColor[1], typeColor[2]);
      pdf.text(columns[0], xPositions[0] + 4, y + 7);
      pdf.setTextColor(...colors.text);
      pdf.text(description, xPositions[1] + 4, y + 7);
      pdf.setTextColor(...colors.muted);
      pdf.text(category, xPositions[2] + 4, y + 7);
      pdf.setTextColor(...colors.text);
      pdf.text(String(columns[3]), xPositions[3] + widths[3] - 4, y + 7, { align: 'right' });
      pdf.setTextColor(...colors.muted);
      pdf.text(String(columns[4]), xPositions[4] + 4, y + 7);
      y += rowHeight;
    });
  }
  for (let page = 1; page <= pdf.getNumberOfPages(); page++) {
    pdf.setPage(page);
    pdf.setDrawColor(...colors.border);
    pdf.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.muted);
    pdf.text(
      `Gestão de Finanças · Página ${page} de ${pdf.getNumberOfPages()}`,
      pageWidth - margin,
      pageHeight - 5,
      { align: 'right' },
    );
  }
  pdf.save('gestaopro-relatorio.pdf');
}
const nav = [
  { id: 'dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'employees', label: 'Funcionários', icon: Users },
  { id: 'folha', label: 'Folha de pagamento', icon: Clock3 },
  { id: 'receitas', label: 'Lucros', icon: TrendingUp },
  { id: 'despesas', label: 'Despesas', icon: TrendingDown },
  { id: 'resultado', label: 'Lucros e prejuízos', icon: Wallet },
  { id: 'relatorios', label: 'Relatórios', icon: ChartNoAxesCombined },
];
export default function App() {
  const [page, setPage] = useState('dashboard'),
    [mobileOpen, setMobileOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>(
    () => JSON.parse(localStorage.getItem('gp-employees') || 'null') || initialEmployees,
  );
  const [entries, setEntries] = useState<Entry[]>(
    () => JSON.parse(localStorage.getItem('gp-entries') || 'null') || initialEntries,
  );
  const [workRecords, setWorkRecords] = useState<WorkRecord[]>(
    () => JSON.parse(localStorage.getItem('gp-work-records') || '[]') as WorkRecord[],
  );
  const [payrollMonth, setPayrollMonth] = useState(currentMonth);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'employee' | 'receita' | 'despesa' | null>(null);
  const [editing, setEditing] = useState<Employee | Entry | null>(null);
  const [workRecordModal, setWorkRecordModal] = useState(false);
  const [editingWorkRecord, setEditingWorkRecord] = useState<WorkRecord | null>(null);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    localStorage.setItem('gp-employees', JSON.stringify(employees));
  }, [employees]);
  useEffect(() => {
    localStorage.setItem('gp-entries', JSON.stringify(entries));
  }, [entries]);
  useEffect(() => {
    localStorage.setItem('gp-work-records', JSON.stringify(workRecords));
  }, [workRecords]);
  const monthEntries = entries.filter((entry) => entry.date.startsWith(payrollMonth));
  const receitas = monthEntries
    .filter((entry) => entry.type === 'Receita')
    .reduce((sum, entry) => sum + entry.amount, 0);
  const despesas = monthEntries
    .filter((entry) => entry.type === 'Despesa')
    .reduce((sum, entry) => sum + entry.amount, 0);
  const monthWorkRecords = workRecords.filter((record) => record.date.startsWith(payrollMonth));
  const monthlyEmployees = employees.filter(
    (employee) => employee.status === 'Ativo' && employee.payType === 'Mês',
  );
  const monthlySalaryTotal = monthlyEmployees.reduce((sum, employee) => sum + employee.rate, 0);
  const workPayrollTotal = monthWorkRecords.reduce(
    (sum, record) => sum + record.quantity * record.rate,
    0,
  );
  const folha = monthlySalaryTotal + workPayrollTotal;
  const payrollRows: PayrollRow[] = [
    ...monthlyEmployees.map((employee) => ({
      id: `salary-${employee.id}`,
      employeeName: employee.name,
      role: employee.role,
      payType: employee.payType,
      period: 'Salário mensal',
      quantity: null,
      rate: employee.rate,
      total: employee.rate,
    })),
    ...monthWorkRecords.map((record) => ({
      id: record.id,
      employeeName: record.employeeName,
      role: record.role,
      payType: record.payType,
      period: new Date(`${record.date}T12:00:00`).toLocaleDateString('pt-BR'),
      quantity: record.quantity,
      rate: record.rate,
      total: record.quantity * record.rate,
    })),
  ];
  const lucro = receitas - despesas - folha;
  function toast(s: string) {
    setNotice(s);
    setTimeout(() => setNotice(''), 3000);
  }
  function saveEmployee(e: Employee) {
    setEmployees((old) =>
      old.some((x) => x.id === e.id) ? old.map((x) => (x.id === e.id ? e : x)) : [e, ...old],
    );
    setModal(null);
    setEditing(null);
    toast('Funcionário salvo.');
  }
  function saveEntry(e: Entry) {
    setEntries((old) =>
      old.some((x) => x.id === e.id) ? old.map((x) => (x.id === e.id ? e : x)) : [e, ...old],
    );
    setModal(null);
    setEditing(null);
    toast('Lançamento salvo.');
  }
  function saveWorkRecord(record: WorkRecord) {
    setWorkRecords((current) =>
      current.some((item) => item.id === record.id)
        ? current.map((item) => (item.id === record.id ? record : item))
        : [record, ...current],
    );
    setWorkRecordModal(false);
    setEditingWorkRecord(null);
    toast('Horas/diárias registradas.');
  }
  function removeWorkRecord(id: string) {
    if (confirm('Excluir este registro de trabalho?')) {
      setWorkRecords((current) => current.filter((record) => record.id !== id));
    }
  }
  function removeEntry(id: string) {
    if (confirm('Excluir este lançamento?')) setEntries((old) => old.filter((e) => e.id !== id));
  }
  const filtered = entries.filter(
    (e) =>
      (page === 'receitas'
        ? e.type === 'Receita'
        : page === 'despesas'
          ? e.type === 'Despesa'
          : true) && `${e.description} ${e.category}`.toLowerCase().includes(search.toLowerCase()),
  );
  const chartData = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(`${payrollMonth}-01T12:00:00`);
    date.setMonth(date.getMonth() - (5 - index));
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthEntries = entries.filter((entry) => entry.date.startsWith(month));
    const monthWorkRecords = workRecords.filter((record) => record.date.startsWith(month));

    return {
      name: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', ''),
      receitas: monthEntries
        .filter((entry) => entry.type === 'Receita')
        .reduce((sum, entry) => sum + entry.amount, 0),
      despesas:
        monthEntries
          .filter((entry) => entry.type === 'Despesa')
          .reduce((sum, entry) => sum + entry.amount, 0) +
        monthlySalaryTotal +
        monthWorkRecords.reduce((sum, record) => sum + record.quantity * record.rate, 0),
    };
  });
  const title = nav.find((n) => n.id === page)?.label || 'Visão geral';
  return (
    <div className="app">
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="brand">
          <div>
            <b>Gestão de Finanças</b>
            <small> </small>
          </div>
          <button className="icon-btn close-mobile" onClick={() => setMobileOpen(false)}>
            <X size={19} />
          </button>
        </div>
        <div className="nav-label">MENU PRINCIPAL</div>
        <nav>
          {nav.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${page === n.id ? 'active' : ''}`}
              onClick={() => {
                setPage(n.id);
                setMobileOpen(false);
              }}
            >
              <n.icon size={18} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom" />
      </aside>
      {mobileOpen && <div className="scrim" onClick={() => setMobileOpen(false)} />}
      <main className="main">
        <header className="topbar">
          <button className="icon-btn mobile-menu" onClick={() => setMobileOpen(true)}>
            <Menu />
          </button>
          <div className="crumb">
            Painel <span>/</span> <b>{title}</b>
          </div>
          <div className="top-actions">
            <span className="online"> </span>
          </div>
        </header>
        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">Gestão financeira</div>
              <h1>{title}</h1>
              <p>
                {page === 'dashboard'
                  ? 'Acompanhe o desempenho da sua empresa em um só lugar.'
                  : page === 'employees'
                    ? 'Cadastre colaboradores e acompanhe seus valores de pagamento.'
                    : page === 'folha'
                      ? 'Registre horas e diárias trabalhadas e acompanhe o custo da folha.'
                      : page === 'receitas'
                        ? 'Registre entradas e acompanhe o faturamento.'
                        : page === 'despesas'
                          ? 'Controle os custos e despesas da operação.'
                          : page === 'resultado'
                            ? 'Veja o resultado financeiro com base nos lançamentos cadastrados.'
                            : page === 'relatorios'
                              ? 'Consulte e exporte os dados financeiros da empresa.'
                              : 'Personalize as informações do sistema.'}
              </p>
            </div>
            <div className="heading-actions">
              {['dashboard', 'folha', 'resultado', 'relatorios'].includes(page) && (
                <label className="month-selector">
                  <span>{page === 'folha' ? 'Mês da folha' : 'Período financeiro'}</span>
                  <input
                    type="month"
                    value={payrollMonth}
                    onChange={(event) => setPayrollMonth(event.target.value)}
                  />
                </label>
              )}
              {page === 'folha' && (
                <button
                  className="btn primary"
                  onClick={() => {
                    setEditingWorkRecord(null);
                    setWorkRecordModal(true);
                  }}
                >
                  <Plus size={17} /> Registrar horas/diárias
                </button>
              )}
              {['employees', 'receitas', 'despesas'].includes(page) && (
                <button
                  className="btn primary"
                  onClick={() => {
                    setEditing(null);
                    setModal(
                      page === 'employees'
                        ? 'employee'
                        : page === 'receitas'
                          ? 'receita'
                          : 'despesa',
                    );
                  }}
                >
                  <Plus size={17} /> {page === 'employees' ? 'Novo funcionário' : 'Novo lançamento'}
                </button>
              )}
            </div>
          </div>
          {page === 'dashboard' && (
            <>
              <section className="stats">
                <Stat
                  icon={<CircleDollarSign />}
                  label="Lucros totais"
                  value={brl(receitas)}
                  change="+12,8%"
                  tone="green"
                />
                <Stat
                  icon={<TrendingDown />}
                  label="Despesas totais"
                  value={brl(despesas + folha)}
                  change="Inclui folha estimada"
                  tone="orange"
                />
                <Stat
                  icon={<Wallet />}
                  label="Lucro / prejuízo"
                  value={brl(lucro)}
                  change={lucro >= 0 ? 'Saldo positivo' : 'Saldo negativo'}
                  tone={lucro >= 0 ? 'blue' : 'red'}
                />
                <Stat
                  icon={<Users />}
                  label="Funcionários ativos"
                  value={String(employees.filter((e) => e.status === 'Ativo').length)}
                  change={`${employees.length} cadastrados`}
                  tone="purple"
                />
              </section>
              <section className="grid-main">
                <div className="panel chart-panel">
                  <div className="panel-head">
                    <div>
                      <h2>Visão financeira</h2>
                      <p>Comparativo de lucros e despesas</p>
                    </div>
                  </div>
                  <div className="legend">
                    <span>
                      <i className="dot revenue" />
                      Lucros
                    </span>
                    <span>
                      <i className="dot expenses" />
                      Despesas + folha estimada
                    </span>
                  </div>
                  <div className="chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4d78f6" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#4d78f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f6" />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#8b93a7', fontSize: 12 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#8b93a7', fontSize: 11 }}
                          tickFormatter={(v) => `${v / 1000}k`}
                        />
                        <Tooltip formatter={(v: any) => brl(Number(v))} />
                        <Area
                          type="monotone"
                          dataKey="receitas"
                          name="Lucros"
                          stroke="#4d78f6"
                          strokeWidth={2.5}
                          fill="url(#rev)"
                        />
                        <Area
                          type="monotone"
                          dataKey="despesas"
                          name="Despesas"
                          stroke="#f3a64a"
                          strokeWidth={2.5}
                          fill="transparent"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="panel breakdown">
                  <div className="panel-head">
                    <div>
                      <h2>Resumo do período</h2>
                      <p>Distribuição financeira</p>
                    </div>
                  </div>
                  <div className="donut">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Despesas', value: Math.max(despesas + folha, 1) },
                            { name: 'Resultado', value: Math.max(Math.abs(lucro), 1) },
                          ]}
                          innerRadius={62}
                          outerRadius={82}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell fill="#f3a64a" />
                          <Cell fill="#4d78f6" />
                        </Pie>
                        <Tooltip formatter={(v: any) => brl(Number(v))} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="donut-center">
                      <b>{receitas ? Math.round((lucro / receitas) * 100) : 0}%</b>
                      <small>margem</small>
                    </div>
                  </div>
                  <div className="breakdown-row">
                    <span>
                      <i className="dot expenses" />
                      Despesas + folha
                    </span>
                    <b>{brl(despesas + folha)}</b>
                  </div>
                  <div className="breakdown-row">
                    <span>
                      <i className="dot revenue" />
                      Resultado
                    </span>
                    <b>{brl(lucro)}</b>
                  </div>
                  <div className="breakdown-foot">
                    Valores calculados com os lançamentos e a folha do mês selecionado.
                  </div>
                </div>
              </section>
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2>Lançamentos recentes</h2>
                    <p>Movimentações registradas no sistema</p>
                  </div>
                  <button className="text-btn" onClick={() => setPage('relatorios')}>
                    Ver relatórios <ArrowUpRight size={15} />
                  </button>
                </div>
                <EntryTable entries={monthEntries.slice(0, 5)} onDelete={removeEntry} />
              </section>
            </>
          )}
          {page === 'employees' && (
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Equipe</h2>
                  <p>{employees.length} funcionários cadastrados</p>
                </div>
                <div className="searchbox">
                  <Search size={16} />
                  <input
                    placeholder="Buscar funcionário..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Funcionário</th>
                      <th>Cargo</th>
                      <th>Pagamento</th>
                      <th>Valor base</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees
                      .filter((e) =>
                        (e.name + ' ' + e.role).toLowerCase().includes(search.toLowerCase()),
                      )
                      .map((e) => (
                        <tr key={e.id}>
                          <td>
                            <div className="person">
                              <div className="avatar">
                                {e.name
                                  .split(' ')
                                  .map((x) => x[0])
                                  .slice(0, 2)
                                  .join('')}
                              </div>
                              <b>{e.name}</b>
                            </div>
                          </td>
                          <td>{e.role}</td>
                          <td>{e.payType}</td>
                          <td>
                            {brl(e.rate)}
                            {e.payType === 'Hora' ? '/h' : e.payType === 'Dia' ? '/dia' : ''}
                          </td>
                          <td>
                            <span className={`tag ${e.status === 'Ativo' ? 'good' : 'muted'}`}>
                              {e.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="icon-btn"
                              title="Editar"
                              onClick={() => {
                                setEditing(e);
                                setModal('employee');
                              }}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              className="icon-btn"
                              title="Excluir"
                              onClick={() => {
                                if (confirm('Excluir funcionário?'))
                                  setEmployees((old) => old.filter((x) => x.id !== e.id));
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {page === 'folha' && (
            <>
              <section className="stats">
                <Stat
                  icon={<Wallet />}
                  label="Folha total do mês"
                  value={brl(folha)}
                  change={`${payrollRows.length} itens calculados`}
                  tone="blue"
                />
                <Stat
                  icon={<BriefcaseBusiness />}
                  label="Salários mensais"
                  value={brl(monthlySalaryTotal)}
                  change={`${monthlyEmployees.length} funcionários ativos`}
                  tone="purple"
                />
                <Stat
                  icon={<Clock3 />}
                  label="Horas e diárias"
                  value={brl(workPayrollTotal)}
                  change={`${monthWorkRecords.length} registros no mês`}
                  tone="green"
                />
                <Stat
                  icon={<TrendingDown />}
                  label="Resultado após folha"
                  value={brl(receitas - despesas - folha)}
                  change="Lucros − despesas − folha"
                  tone={receitas - despesas - folha >= 0 ? 'blue' : 'red'}
                />
              </section>
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2>Apuração da folha</h2>
                    <p>
                      Valores de{' '}
                      {new Intl.DateTimeFormat('pt-BR', {
                        month: 'long',
                        year: 'numeric',
                      }).format(new Date(`${payrollMonth}-01T12:00:00`))}
                    </p>
                  </div>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Funcionário</th>
                        <th>Cargo</th>
                        <th>Pagamento</th>
                        <th>Data / período</th>
                        <th>Quantidade</th>
                        <th>Valor base</th>
                        <th>Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {payrollRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="empty">
                            Nenhum salário ou hora/diária registrada neste mês.
                          </td>
                        </tr>
                      ) : (
                        payrollRows.map((row) => {
                          const workRecord = workRecords.find((record) => record.id === row.id);
                          return (
                            <tr key={row.id}>
                              <td>
                                <b>{row.employeeName}</b>
                              </td>
                              <td>{row.role}</td>
                              <td>{row.payType}</td>
                              <td>{row.period}</td>
                              <td>
                                {row.quantity === null
                                  ? 'Mensal'
                                  : `${row.quantity} ${row.payType === 'Hora' ? 'h' : 'diárias'}`}
                              </td>
                              <td>
                                {brl(row.rate)}
                                {row.payType === 'Hora'
                                  ? '/h'
                                  : row.payType === 'Dia'
                                    ? '/dia'
                                    : ''}
                              </td>
                              <td className="positive">
                                <b>{brl(row.total)}</b>
                              </td>
                              <td>
                                {workRecord && (
                                  <>
                                    <button
                                      className="icon-btn"
                                      title="Editar registro"
                                      onClick={() => {
                                        setEditingWorkRecord(workRecord);
                                        setWorkRecordModal(true);
                                      }}
                                    >
                                      <Pencil size={15} />
                                    </button>
                                    <button
                                      className="icon-btn"
                                      title="Excluir registro"
                                      onClick={() => removeWorkRecord(workRecord.id)}
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
          {(page === 'receitas' || page === 'despesas') && (
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>{page === 'receitas' ? 'Entradas registradas' : 'Custos registrados'}</h2>
                  <p>
                    Ainda falta por no supabase para não perder dados
                    {!supabase ? ' ·           ' : ''}
                  </p>
                </div>
                <div className="searchbox">
                  <Search size={16} />
                  <input
                    placeholder="Buscar lançamento..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <EntryTable
                entries={filtered}
                onDelete={removeEntry}
                onEdit={(e) => {
                  setEditing(e);
                  setModal(e.type === 'Receita' ? 'receita' : 'despesa');
                }}
              />
            </section>
          )}
          {page === 'resultado' && (
            <>
              <section className="stats">
                <Stat
                  icon={<TrendingUp />}
                  label="Lucros"
                  value={brl(receitas)}
                  change="Entradas registradas"
                  tone="green"
                />
                <Stat
                  icon={<TrendingDown />}
                  label="Despesas operacionais"
                  value={brl(despesas)}
                  change="Saídas registradas"
                  tone="orange"
                />
                <Stat
                  icon={<BriefcaseBusiness />}
                  label="Folha do período"
                  value={brl(folha)}
                  change="Salários + horas e diárias"
                  tone="purple"
                />
                <Stat
                  icon={<Wallet />}
                  label={lucro >= 0 ? 'Lucro estimado' : 'Prejuízo estimado'}
                  value={brl(lucro)}
                  change="Lucros − despesas − folha"
                  tone={lucro >= 0 ? 'blue' : 'red'}
                />
              </section>
              <section className="panel result-panel">
                <h2>Como o resultado é calculado</h2>
                <div className="formula">
                  <span>Lucros</span>
                  <b>{brl(receitas)}</b>
                  <span>− Despesas</span>
                  <b>{brl(despesas)}</b>
                  <span>− Folha mensal estimada</span>
                  <b>{brl(folha)}</b>
                  <strong>Resultado</strong>
                  <strong className={lucro >= 0 ? 'positive' : 'negative'}>{brl(lucro)}</strong>
                </div>
              </section>
            </>
          )}
          {page === 'relatorios' && (
            <>
              <section className="stats">
                <Stat
                  icon={<TrendingUp />}
                  label="Lucros registrados"
                  value={brl(receitas)}
                  change={`${monthEntries.filter((entry) => entry.type === 'Receita').length} lançamentos`}
                  tone="green"
                />
                <Stat
                  icon={<TrendingDown />}
                  label="Despesas registradas"
                  value={brl(despesas)}
                  change={`${monthEntries.filter((entry) => entry.type === 'Despesa').length} lançamentos`}
                  tone="orange"
                />
                <Stat
                  icon={<Wallet />}
                  label="Resultado estimado"
                  value={brl(lucro)}
                  change="Com folha do período"
                  tone={lucro >= 0 ? 'blue' : 'red'}
                />
              </section>
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2>Relatório financeiro</h2>
                    <p>Exporte os lançamentos em PDF com a paleta do sistema.</p>
                  </div>
                  <button
                    className="btn primary"
                    onClick={() => {
                      void exportPDF(
                        monthEntries,
                        employees,
                        payrollRows,
                        payrollMonth,
                        receitas,
                        despesas,
                        folha,
                        lucro,
                      ).catch((error) => {
                        console.error('Falha ao exportar PDF:', error);
                        toast('Não foi possível gerar o PDF. Tente novamente.');
                      });
                    }}
                  >
                    <Download size={16} /> Exportar PDF
                  </button>
                </div>
                <EntryTable entries={monthEntries} onDelete={removeEntry} />
              </section>
            </>
          )}
          {page === 'config' && (
            <section className="panel settings-panel">
              <div className="panel-head">
                <div>
                  <h2>Configurações do sistema</h2>
                  <p>Preferências e conexão com o banco de dados</p>
                </div>
              </div>
              <div className="setting-row">
                <div>
                  <b>Persistência local</b>
                  <p>Os dados atuais ficam salvos neste navegador.</p>
                </div>
                <span className="tag good">Ativa</span>
              </div>
              <div className="setting-row">
                <div>
                  <b>Supabase</b>
                  <p>
                    {supabase
                      ? 'As variáveis de ambiente foram encontradas.'
                      : 'Ainda não conectado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local.'}
                  </p>
                </div>
                <span className={`tag ${supabase ? 'good' : 'warn'}`}>
                  {supabase ? 'Configurado' : 'Pendente'}
                </span>
              </div>
              <div className="setting-row">
                <div>
                  <b>Exportação</b>
                  <p>Baixe os lançamentos em PDF na seção Relatórios.</p>
                </div>
                <button className="btn secondary" onClick={() => setPage('relatorios')}>
                  Abrir relatórios
                </button>
              </div>
              <div className="setting-row">
                <div>
                  <b>Dados de demonstração</b>
                  <p>Apaga lançamentos e funcionários locais e restaura os exemplos.</p>
                </div>
                <button
                  className="btn danger"
                  onClick={() => {
                    if (
                      confirm(
                        'Restaurar os dados de demonstração? Isso substituirá os dados locais atuais.',
                      )
                    ) {
                      setEmployees(initialEmployees);
                      setEntries(initialEntries);
                      setWorkRecords([]);
                      setPayrollMonth(currentMonth);
                      toast('Dados de demonstração restaurados.');
                    }
                  }}
                >
                  Restaurar exemplos
                </button>
              </div>
            </section>
          )}
          <footer>
            <span> </span>
          </footer>
        </div>
      </main>
      {modal && (
        <FormModal
          type={modal}
          initial={editing}
          onClose={() => {
            setModal(null);
            setEditing(null);
          }}
          onSaveEmployee={saveEmployee}
          onSaveEntry={saveEntry}
        />
      )}
      {workRecordModal && (
        <WorkRecordModal
          employees={employees}
          initial={editingWorkRecord}
          month={payrollMonth}
          onClose={() => {
            setWorkRecordModal(false);
            setEditingWorkRecord(null);
          }}
          onSave={(record) => {
            saveWorkRecord(record);
            setPayrollMonth(record.date.slice(0, 7));
          }}
        />
      )}
      {notice && <div className="toast">{notice}</div>}
    </div>
  );
}
function Stat({
  icon,
  label,
  value,
  change,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  tone: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <div className={`stat-icon ${tone}`}>{icon}</div>
      </div>
      <strong>{value}</strong>
      <small className={tone === 'green' ? 'up' : tone === 'red' ? 'down' : ''}>
        {tone === 'green' ? (
          <ArrowUpRight size={14} />
        ) : tone === 'red' ? (
          <ArrowDownRight size={14} />
        ) : null}
        {change}
      </small>
    </div>
  );
}
function EntryTable({
  entries,
  onDelete,
  onEdit,
}: {
  entries: Entry[];
  onDelete: (id: string) => void;
  onEdit?: (e: Entry) => void;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Categoria</th>
            <th>Data</th>
            <th>Tipo</th>
            <th>Valor</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={6} className="empty">
                Nenhum lançamento encontrado.
              </td>
            </tr>
          ) : (
            entries.map((e) => (
              <tr key={e.id}>
                <td>
                  <b>{e.description}</b>
                </td>
                <td>{e.category}</td>
                <td>{new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                <td>
                  <span className={`tag ${e.type === 'Receita' ? 'good' : 'warn'}`}>{e.type}</span>
                </td>
                <td className={e.type === 'Receita' ? 'positive' : 'negative'}>
                  {e.type === 'Receita' ? '+' : '−'} {brl(e.amount)}
                </td>
                <td>
                  {onEdit && (
                    <button className="icon-btn" title="Editar" onClick={() => onEdit(e)}>
                      <Pencil size={15} />
                    </button>
                  )}
                  <button className="icon-btn" title="Excluir" onClick={() => onDelete(e.id)}>
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
function FormModal({
  type,
  initial,
  onClose,
  onSaveEmployee,
  onSaveEntry,
}: {
  type: 'employee' | 'receita' | 'despesa';
  initial: Employee | Entry | null;
  onClose: () => void;
  onSaveEmployee: (e: Employee) => void;
  onSaveEntry: (e: Entry) => void;
}) {
  const emp = type === 'employee';
  const ie = initial as Employee;
  const it = initial as Entry;
  const [name, setName] = useState(ie?.name || ''),
    [role, setRole] = useState(ie?.role || ''),
    [payType, setPayType] = useState<Employee['payType']>(ie?.payType || 'Hora'),
    [status, setStatus] = useState<Employee['status']>(ie?.status || 'Ativo'),
    [description, setDescription] = useState(it?.description || ''),
    [category, setCategory] = useState(it?.category || ''),
    [amount, setAmount] = useState(it?.amount ? String(it.amount) : ''),
    [date, setDate] = useState(it?.date || today);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (emp) {
      if (!name.trim() || !role.trim() || Number(amount) < 0) return;
      onSaveEmployee({
        id: ie?.id || crypto.randomUUID(),
        name: name.trim(),
        role: role.trim(),
        payType,
        rate: Number(amount),
        status,
      });
    } else {
      if (!description.trim() || !category.trim() || Number(amount) <= 0) return;
      onSaveEntry({
        id: it?.id || crypto.randomUUID(),
        description: description.trim(),
        category: category.trim(),
        amount: Number(amount),
        date,
        type: type === 'receita' ? 'Receita' : 'Despesa',
      });
    }
  }
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="modal" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>
              {emp
                ? ie
                  ? 'Editar funcionário'
                  : 'Novo funcionário'
                : it
                  ? 'Editar lançamento'
                  : type === 'receita'
                    ? 'Nova receita'
                    : 'Nova despesa'}
            </h2>
            <p>Preencha os campos abaixo.</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X />
          </button>
        </div>
        {emp ? (
          <>
            <label>
              Nome completo
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Ana Souza"
              />
            </label>
            <label>
              Cargo
              <input
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ex.: Assistente"
              />
            </label>
            <div className="form-grid">
              <label>
                Tipo de pagamento
                <select
                  value={payType}
                  onChange={(e) => setPayType(e.target.value as Employee['payType'])}
                >
                  <option>Hora</option>
                  <option>Dia</option>
                  <option>Mês</option>
                </select>
              </label>
              <label>
                Valor base (R$)
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>
            </div>
            <label>
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Employee['status'])}
              >
                <option>Ativo</option>
                <option>Inativo</option>
              </select>
            </label>
          </>
        ) : (
          <>
            <label>
              Descrição
              <input
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex.: Compra de materiais"
              />
            </label>
            <div className="form-grid">
              <label>
                Categoria
                <input
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex.: Operacional"
                />
              </label>
              <label>
                Valor (R$)
                <input
                  required
                  min="0.01"
                  step="0.01"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>
            </div>
            <label>
              Data
              <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
          </>
        )}
        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn primary" type="submit">
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}

function WorkRecordModal({
  employees,
  initial,
  month,
  onClose,
  onSave,
}: {
  employees: Employee[];
  initial: WorkRecord | null;
  month: string;
  onClose: () => void;
  onSave: (record: WorkRecord) => void;
}) {
  const eligibleEmployees = employees.filter(isHourlyOrDaily);
  const fallbackEmployee: (Employee & { payType: WorkRecord['payType'] }) | undefined = initial
    ? {
        id: initial.employeeId,
        name: initial.employeeName,
        role: initial.role,
        payType: initial.payType,
        rate: initial.rate,
        status: 'Inativo',
      }
    : undefined;
  const [employeeId, setEmployeeId] = useState(
    initial?.employeeId || eligibleEmployees[0]?.id || '',
  );
  const [date, setDate] = useState(
    initial?.date || (month === currentMonth ? today : `${month}-01`),
  );
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : '');
  const selectedEmployee =
    eligibleEmployees.find((employee) => employee.id === employeeId) ||
    (fallbackEmployee?.id === employeeId ? fallbackEmployee : undefined);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const workedQuantity = Number(quantity);
    if (!selectedEmployee || !date || !Number.isFinite(workedQuantity) || workedQuantity <= 0) {
      return;
    }

    onSave({
      id: initial?.id || crypto.randomUUID(),
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      role: selectedEmployee.role,
      payType: selectedEmployee.payType,
      rate: selectedEmployee.rate,
      date,
      quantity: workedQuantity,
    });
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>{initial ? 'Editar horas/diárias' : 'Registrar horas/diárias'}</h2>
            <p>O valor será calculado pelo pagamento cadastrado para o funcionário.</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X />
          </button>
        </div>
        {eligibleEmployees.length === 0 && !fallbackEmployee ? (
          <p className="note">
            Cadastre primeiro um funcionário com pagamento por hora ou por dia.
          </p>
        ) : (
          <>
            <label>
              Funcionário
              <select
                required
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
              >
                {fallbackEmployee &&
                  !eligibleEmployees.some((employee) => employee.id === fallbackEmployee.id) && (
                    <option value={fallbackEmployee.id}>
                      {fallbackEmployee.name} (dados do registro)
                    </option>
                  )}
                {eligibleEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} · {employee.payType} · {brl(employee.rate)}
                    {employee.payType === 'Hora' ? '/h' : '/dia'}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-grid">
              <label>
                Data trabalhada
                <input
                  required
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </label>
              <label>
                {selectedEmployee?.payType === 'Dia' ? 'Diárias trabalhadas' : 'Horas trabalhadas'}
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.25"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  placeholder={selectedEmployee?.payType === 'Dia' ? 'Ex.: 1' : 'Ex.: 8'}
                />
              </label>
            </div>
            {selectedEmployee && (
              <p className="note">
                Valor base: {brl(selectedEmployee.rate)}
                {selectedEmployee.payType === 'Hora' ? '/hora' : '/diária'}
                {Number(quantity) > 0 &&
                  ` · Total deste registro: ${brl(Number(quantity) * selectedEmployee.rate)}`}
              </p>
            )}
          </>
        )}
        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn primary"
            type="submit"
            disabled={eligibleEmployees.length === 0 && !fallbackEmployee}
          >
            Salvar registro
          </button>
        </div>
      </form>
    </div>
  );
}
