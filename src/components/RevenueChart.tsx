import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Appointment, Patient } from '../types';

interface RevenueChartProps {
  appointments: Appointment[];
  patients: Patient[];
}

const COLORS = ['#059669', '#8b5cf6', '#ea580c']; // Emerald (Cash), Violet (Insurance), Orange (NHIF)

export function RevenueChart({ appointments, patients }: RevenueChartProps) {
  const chartData = React.useMemo(() => {
    const revenueByCategory = {
      'Cash': 0,
      'Insurance': 0,
      'NHIF': 0
    };

    appointments.forEach((appt) => {
      if (appt.billingStatus !== 'Paid') return;

      const patient = patients.find((p) => p.id === appt.patientId);
      if (!patient) return;

      let category = 'Cash';
      if (patient.paymentMode === 'Insurance') {
        if (patient.insuranceCompany === 'NHIF') {
          category = 'NHIF';
        } else {
          category = 'Insurance';
        }
      }

      revenueByCategory[category as keyof typeof revenueByCategory] += appt.billingAmount || 0;
    });

    return Object.entries(revenueByCategory)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  }, [appointments, patients]);

  if (chartData.length === 0) {
    return <div className="text-xs text-stone-500 p-4 text-center">No revenue data available for the selected period.</div>;
  }

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => `Ksh ${value.toLocaleString()}`}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}
          />
          <Legend iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
