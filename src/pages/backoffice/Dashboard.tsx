import {
  DollarSign,
  FileText,
  Users,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Calendar
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useTranslation } from 'react-i18next';
import TreasuryWidget from '@/components/treasury/TreasuryWidget';



export default function Dashboard() {
  const { t } = useTranslation();

  const stats = [
    {
      title: t('dashboard.revenue'),
      value: '45,200 TND',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'indigo'
    },
    {
      title: t('dashboard.expenses'),
      value: '12,800 TND',
      change: '-3.2%',
      trend: 'down',
      icon: Receipt,
      color: 'red'
    },
    {
      title: t('salesInvoices.title'),
      value: '23',
      change: '+5',
      trend: 'up',
      icon: FileText,
      color: 'yellow'
    },
    {
      title: t('clients.title'),
      value: '127',
      change: '+8',
      trend: 'up',
      icon: Users,
      color: 'green'
    }
  ];

  const invoiceStatusData = [
    { name: t('salesInvoices.paid'), value: 65, color: '#22C55E' },
    { name: t('common.pending'), value: 23, color: '#EAB308' },
    { name: t('salesInvoices.overdue'), value: 12, color: '#EF4444' }
  ];

  const statusLabels = {
    paid: t('salesInvoices.paid'),
    pending: t('common.pending'),
    overdue: t('salesInvoices.overdue')
  };

  return (
    <>
    <TreasuryWidget />
    </>
  );
}
