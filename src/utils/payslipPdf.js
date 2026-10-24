import { jsPDF } from 'jspdf';

function amount(value) { return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 2 }).format(Number(value) || 0); }

export function buildPayslipPdf(payslip, companyName = 'HCM Lite') {
  if (payslip?.status !== 'Finalized' || !/^\d{4}-\d{2}$/.test(payslip.month || '') || !payslip.employeeName) throw new Error('A finalized payslip is required.');
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  pdf.setFillColor(35, 37, 78); pdf.rect(0, 0, 595, 110, 'F');
  pdf.setTextColor(255, 255, 255); pdf.setFontSize(23); pdf.text(companyName, 42, 55);
  pdf.setFontSize(12); pdf.text('SALARY STATEMENT', 42, 80);
  pdf.setTextColor(35, 37, 78); pdf.setFontSize(11);
  pdf.text(`Employee: ${payslip.employeeName}`, 42, 145);
  pdf.text(`Code: ${payslip.employeeCode || '—'}`, 42, 163);
  pdf.text(`Month: ${payslip.month}`, 42, 181);
  const fields = [
    ['Basic salary', payslip.basic], ['House rent allowance (40%)', Number(payslip.basic) * 0.4],
    ['Medical allowance (10%)', Number(payslip.basic) * 0.1], ['Full monthly gross', payslip.gross],
    ['Gross after joining/leaving proration', payslip.prorated], ['Attendance and unpaid leave deductions', payslip.deduction],
    ['Illustrative monthly income tax', payslip.tax], ['NET PAY', payslip.net],
  ];
  let y = 230;
  for (const [label, value] of fields) {
    if (label === 'NET PAY') { pdf.setDrawColor(200, 200, 210); pdf.line(42, y - 14, 553, y - 14); pdf.setFont(undefined, 'bold'); }
    pdf.text(label, 42, y); pdf.text(amount(value), 553, y, { align: 'right' });
    y += 34;
  }
  pdf.setFont(undefined, 'normal'); pdf.setFontSize(9); pdf.setTextColor(110, 110, 125);
  pdf.text('Generated from a finalized HCM Lite payroll record. Tax uses the Saylani challenge’s illustrative slabs.', 42, 545);
  return pdf;
}

export function downloadPayslipPdf(payslip, companyName) {
  buildPayslipPdf(payslip, companyName).save(`payslip-${payslip.month}-${payslip.employeeCode || payslip.uid}.pdf`);
}
