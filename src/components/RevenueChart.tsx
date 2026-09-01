import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Appointment, Patient, LabTest, MedicationDispense } from '../types';
import { normalizeInsuranceCompany } from '../insuranceUtils';

interface RevenueChartProps {
  appointments: Appointment[];
  patients: Patient[];
  labTests?: LabTest[];
  dispenses?: MedicationDispense[];
}

const COLORS = ['#059669', '#8b5cf6', '#ea580c']; // Emerald (Cash), Violet (Insurance), Orange (NHIF)

export function RevenueChart({ appointments, patients, labTests, dispenses }: RevenueChartProps) {
  const chartData = React.useMemo(() => {
    const revenueByCategory = {
      'Cash (Self-Pay)': 0,
      'Private Insurance': 0,
      'NHIF / SHA': 0
    };

    const patMap = new Map<string, Patient>();
    patients.forEach(p => patMap.set(p.id, p));

    // 1. Clinical Appointments Revenue
    appointments.forEach((appt) => {
      const isPaid = appt.billingStatus === 'Paid' || appt.status === 'Completed' || (Number(appt.billingAmount) || 0) > 0;
      if (!isPaid) return;

      const amt = Number(appt.billingAmount) || 0;
      if (amt <= 0) return;

      const patient = patMap.get(appt.patientId);
      const isInsurance = patient?.paymentMode === 'Insurance' || appt.paymentMode === 'Insurance';
      const company = normalizeInsuranceCompany(patient?.insuranceCompany || appt.insuranceCompany);

      if (isInsurance) {
        if (company === 'NHIF / SHA') {
          revenueByCategory['NHIF / SHA'] += amt;
        } else {
          revenueByCategory['Private Insurance'] += amt;
        }
      } else {
        revenueByCategory['Cash (Self-Pay)'] += amt;
      }
    });

    // 2. Lab Diagnostics Revenue
    if (labTests && labTests.length > 0) {
      labTests.forEach(test => {
        const fee = Number(test.fee) || 0;
        if (fee <= 0) return;

        const patient = test.patientId ? patMap.get(test.patientId) : undefined;
        const isInsurance = patient?.paymentMode === 'Insurance';
        const company = normalizeInsuranceCompany(patient?.insuranceCompany);

        if (isInsurance) {
          if (company === 'NHIF / SHA') {
            revenueByCategory['NHIF / SHA'] += fee;
          } else {
            revenueByCategory['Private Insurance'] += fee;
          }
        } else {
          revenueByCategory['Cash (Self-Pay)'] += fee;
        }
      });
    }

    // 3. Pharmacy Dispenses Revenue
    if (dispenses && dispenses.length > 0) {
      dispenses.forEach(disp => {
        const cost = Number(disp.totalCost) || 0;
        if (cost <= 0) return;

        const patient = disp.patientId ? patMap.get(disp.patientId) : undefined;
        const isInsurance = patient?.paymentMode === 'Insurance';
        const company = normalizeInsuranceCompany(patient?.insuranceCompany);

        if (isInsurance) {
          if (company === 'NHIF / SHA') {
            revenueByCategory['NHIF / SHA'] += cost;
          } else {
            revenueByCategory['Private Insurance'] += cost;
          }
        } else {
          revenueByCategory['Cash (Self-Pay)'] += cost;
        }
      });
    }

    return Object.entries(revenueByCategory)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  }, [appointments, patients, labTests, dispenses]);

  if (chartData.length === 0) {
    return <div className="text-xs text-stone-500 p-4 text-center">No revenue data recorded for the selected period.</div>;
  }

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={75}
            paddingAngle={4}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => `Ksh ${value.toLocaleString()}`}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px' }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
