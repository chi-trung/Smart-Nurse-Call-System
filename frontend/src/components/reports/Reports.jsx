import React, { useEffect, useMemo, useState } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { reportService } from '../../services/api';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, Title, Tooltip, Legend, ArcElement, Filler
);

/* ─── helpers ─────────────────────────────────────────── */
const pad = (v) => String(v).padStart(2, '0');

const toDateInputValue = (date) => {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}-${m}-${d}`;
};

const toMonthInputValue = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

const toSqliteDateTime = (date) => {
  const y = date.getFullYear();
  const mo = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}-${mo}-${d} ${h}:${mi}:${s}`;
};

const formatDisplayDateTime = (value) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('vi-VN');
};

const formatSeconds = (value) => {
  if (value === null || value === undefined) return '-';
  const total = Number(value);
  if (Number.isNaN(total) || total < 0) return '-';
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const safeFilePart = (v) => String(v || '').replace(/[\s:]/g, '-');

const buildDateRange = (filterType, date, month, fromDate, toDate) => {
  if (filterType === 'all') return { from: '', to: '', label: 'Tất cả' };
  if (filterType === 'day') {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59`);
    return { from: toSqliteDateTime(start), to: toSqliteDateTime(end), label: `Ngày ${date}` };
  }
  if (filterType === 'month') {
    const [year, mv] = month.split('-').map(Number);
    const start = new Date(year, mv - 1, 1, 0, 0, 0);
    const end = new Date(year, mv, 0, 23, 59, 59);
    return { from: toSqliteDateTime(start), to: toSqliteDateTime(end), label: `Tháng ${month}` };
  }
  const start = new Date(`${fromDate}T00:00:00`);
  const end = new Date(`${toDate}T23:59:59`);
  return { from: toSqliteDateTime(start), to: toSqliteDateTime(end), label: `${fromDate} → ${toDate}` };
};

/* Build daily trend from logs array */
const buildTrendData = (logs) => {
  const map = {};
  logs.forEach((log) => {
    if (!log.RequestTime) return;
    const day = log.RequestTime.slice(0, 10);
    if (!map[day]) map[day] = { total: 0, emergency: 0, normal: 0 };
    map[day].total += 1;
    if (log.CallType === 'Emergency') map[day].emergency += 1;
    else map[day].normal += 1;
  });
  const days = Object.keys(map).sort();
  return {
    labels: days,
    total: days.map((d) => map[d].total),
    emergency: days.map((d) => map[d].emergency),
    normal: days.map((d) => map[d].normal)
  };
};

/* ─── PDF export ──────────────────────────────────────── */
const exportPdf = (reportData, rangeInfo, exportScope, selectedNurse) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header banner
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, 297, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('BAO CAO HE THONG GOI Y TA', 14, 10);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Thoi gian: ${rangeInfo.label}`, 14, 17);
  doc.text(`Xuat ngay: ${new Date().toLocaleString('vi-VN')}`, 200, 17);

  // Choose scope
  const logsToExport =
    exportScope === 'nurse' && selectedNurse
      ? reportData.logs.filter((l) => l.NurseName === selectedNurse)
      : reportData.logs;

  const nurseToExport =
    exportScope === 'nurse' && selectedNurse
      ? reportData.nurseStats.filter((n) => n.NurseName === selectedNurse)
      : reportData.nurseStats;

  // Re-compute summary if per-nurse
  const sum = exportScope === 'nurse' && selectedNurse
    ? {
        totalCalls: logsToExport.length,
        emergencyCalls: logsToExport.filter((l) => l.CallType === 'Emergency').length,
        normalCalls: logsToExport.filter((l) => l.CallType !== 'Emergency').length,
        completedCalls: logsToExport.filter((l) => l.Status === 'Completed').length,
        pendingCalls: logsToExport.filter((l) => l.Status !== 'Completed').length,
        avgResponseSeconds: reportData.summary.avgResponseSeconds
      }
    : reportData.summary;

  const completionRate = sum.totalCalls
    ? ((sum.completedCalls / sum.totalCalls) * 100).toFixed(1)
    : '0';

  doc.setTextColor(0, 0, 0);
  let startY = 30;

  if (exportScope === 'nurse' && selectedNurse) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Y ta: ${selectedNurse}`, 14, startY);
    startY += 6;
  }

  // Summary table
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Tong quan', 14, startY);
  startY += 2;

  autoTable(doc, {
    startY,
    head: [['Chi so', 'Gia tri']],
    body: [
      ['Tong cuoc goi', sum.totalCalls],
      ['Cuoc goi khan cap', sum.emergencyCalls],
      ['Cuoc goi thuong', sum.normalCalls],
      ['Da xu ly', sum.completedCalls],
      ['Chua xu ly', sum.pendingCalls],
      ['TG phan hoi trung binh', formatSeconds(sum.avgResponseSeconds)],
      ['Ty le hoan thanh', `${completionRate}%`]
    ],
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [239, 246, 255] },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 40 } },
    margin: { left: 14 },
    tableWidth: 110
  });

  // Nurse stats table
  if (nurseToExport.length > 0) {
    const afterSummary = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Thong ke theo nhan vien', 130, startY);

    autoTable(doc, {
      startY,
      head: [['Nhan vien', 'So cuoc goi', 'TG phan hoi TB']],
      body: nurseToExport.map((r) => [r.NurseName, r.totalCalls, formatSeconds(r.avgResponseSeconds)]),
      headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [236, 253, 245] },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: 130 },
      tableWidth: 150
    });

    startY = Math.max(afterSummary, doc.lastAutoTable.finalY + 8);
  } else {
    startY = doc.lastAutoTable.finalY + 8;
  }

  // Detail log table
  if (logsToExport.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Danh sach chi tiet cuoc goi', 14, startY);
    startY += 2;

    autoTable(doc, {
      startY,
      head: [['#', 'Phong', 'Loai', 'Thoi gian goi', 'Thoi gian xu ly', 'Nhan vien', 'Trang thai', 'TG phan hoi']],
      body: logsToExport.map((log, i) => [
        i + 1,
        `Phong ${log.RoomId}`,
        log.CallType === 'Emergency' ? 'Khan cap' : 'Thuong',
        formatDisplayDateTime(log.RequestTime),
        formatDisplayDateTime(log.ResponseTime),
        log.NurseName || '-',
        log.Status === 'Completed' ? 'Da xu ly' : 'Chua xu ly',
        formatSeconds(log.ResponseSeconds)
      ]),
      headStyles: { fillColor: [71, 85, 105], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell(data) {
        if (data.section === 'body') {
          const status = logsToExport[data.row.index]?.Status;
          const type = logsToExport[data.row.index]?.CallType;
          if (status !== 'Completed') {
            data.cell.styles.textColor = type === 'Emergency' ? [185, 28, 28] : [146, 64, 14];
          }
        }
      }
    });
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Smart Nurse Call System | Trang ${i}/${pageCount}`,
      297 / 2,
      205,
      { align: 'center' }
    );
  }

  const filename = `bao-cao-${exportScope === 'nurse' ? safeFilePart(selectedNurse) + '-' : ''}${safeFilePart(rangeInfo.from)}-${safeFilePart(rangeInfo.to)}.pdf`;
  doc.save(filename);
};

/* ─── Excel export (ExcelJS – full colour support) ───────── */

// Style presets
const STYLE = {
  headerBlue:  { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } }, // dark blue
  headerGreen: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } }, // dark green
  headerGray:  { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } }, // slate
  rowAlt:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } }, // light blue
  rowAltGreen: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } }, // light green
  rowEmergencyPending: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }, // light red
  rowNormalPending:    { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }, // light yellow
  rowCompleted:        { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } }, // light green
  fontWhiteBold: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
  fontBold:      { bold: true, size: 11 },
  fontNormal:    { size: 10 },
  fontRed:       { bold: true, color: { argb: 'FFB91C1C' }, size: 10 },
  fontOrange:    { bold: true, color: { argb: 'FF92400E' }, size: 10 },
  alignCenter:   { vertical: 'middle', horizontal: 'center', wrapText: false },
  alignLeft:     { vertical: 'middle', horizontal: 'left' },
  thinBorder: {
    top:    { style: 'thin', color: { argb: 'FFD1D5DB' } },
    left:   { style: 'thin', color: { argb: 'FFD1D5DB' } },
    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    right:  { style: 'thin', color: { argb: 'FFD1D5DB' } }
  }
};

const styleCell = (cell, { fill, font, alignment, border } = {}) => {
  if (fill)      cell.fill      = fill;
  if (font)      cell.font      = font;
  if (alignment) cell.alignment = alignment;
  if (border)    cell.border    = border;
};

const addSheetHeader = (ws, headers, fill) => {
  const row = ws.addRow(headers);
  row.height = 22;
  row.eachCell((cell) => {
    styleCell(cell, {
      fill,
      font:      STYLE.fontWhiteBold,
      alignment: STYLE.alignCenter,
      border:    STYLE.thinBorder
    });
  });
  return row;
};

const addDataRow = (ws, values, { fill, font } = {}) => {
  const row = ws.addRow(values);
  row.height = 18;
  row.eachCell((cell) => {
    styleCell(cell, {
      fill:      fill || { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } },
      font:      font || STYLE.fontNormal,
      alignment: STYLE.alignLeft,
      border:    STYLE.thinBorder
    });
  });
  return row;
};

const exportExcel = async (reportData, rangeInfo, exportScope, selectedNurse) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Smart Nurse Call System';
  wb.created = new Date();

  const logsToExport =
    exportScope === 'nurse' && selectedNurse
      ? reportData.logs.filter((l) => l.NurseName === selectedNurse)
      : reportData.logs;

  const nurseList =
    exportScope === 'nurse' && selectedNurse
      ? reportData.nurseStats.filter((n) => n.NurseName === selectedNurse)
      : reportData.nurseStats;

  const sum = exportScope === 'nurse' && selectedNurse
    ? {
        totalCalls:       logsToExport.length,
        emergencyCalls:   logsToExport.filter((l) => l.CallType === 'Emergency').length,
        normalCalls:      logsToExport.filter((l) => l.CallType !== 'Emergency').length,
        completedCalls:   logsToExport.filter((l) => l.Status === 'Completed').length,
        pendingCalls:     logsToExport.filter((l) => l.Status !== 'Completed').length,
        avgResponseSeconds: reportData.summary.avgResponseSeconds
      }
    : reportData.summary;

  const completionRate = sum.totalCalls
    ? ((sum.completedCalls / sum.totalCalls) * 100).toFixed(1) + '%'
    : '0%';

  /* ══ Sheet 1: Tổng quan ══ */
  const wsSum = wb.addWorksheet('Tổng quan');
  wsSum.columns = [
    { key: 'label', width: 32 },
    { key: 'value', width: 22 }
  ];

  // Title rows
  const titleRow = wsSum.addRow(['BÁO CÁO HỆ THỐNG GỌI Y TÁ', '']);
  titleRow.height = 28;
  titleRow.getCell(1).font      = { bold: true, size: 14, color: { argb: 'FF1E40AF' } };
  titleRow.getCell(1).alignment = { vertical: 'middle' };
  wsSum.mergeCells(`A${titleRow.number}:B${titleRow.number}`);

  const metaRows = [
    [`Thời gian: ${rangeInfo.label}`, ''],
    [`Xuất ngày: ${new Date().toLocaleString('vi-VN')}`, '']
  ];
  if (exportScope === 'nurse' && selectedNurse)
    metaRows.push([`Y tá: ${selectedNurse}`, '']);

  metaRows.forEach((r) => {
    const metaRow = wsSum.addRow(r);
    metaRow.getCell(1).font = { italic: true, color: { argb: 'FF6B7280' }, size: 10 };
    wsSum.mergeCells(`A${metaRow.number}:B${metaRow.number}`);
  });

  wsSum.addRow([]); // blank

  // Header row
  addSheetHeader(wsSum, ['Chỉ số', 'Giá trị'], STYLE.headerBlue);

  // Summary metric rows – colour each one
  const summaryMetrics = [
    { label: 'Tổng cuộc gọi',      value: sum.totalCalls,                         fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } } },
    { label: 'Cuộc gọi khẩn cấp', value: sum.emergencyCalls,                      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } } },
    { label: 'Cuộc gọi thường',   value: sum.normalCalls,                          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } } },
    { label: 'Đã xử lý',          value: sum.completedCalls,                       fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCFBF1' } } },
    { label: 'Chưa xử lý',        value: sum.pendingCalls,                         fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } } },
    { label: 'TG phản hồi TB',    value: formatSeconds(sum.avgResponseSeconds),    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDE9FE' } } },
    { label: 'Tỷ lệ hoàn thành', value: completionRate,                            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } } }
  ];

  summaryMetrics.forEach(({ label, value, fill }) => {
    const r = addDataRow(wsSum, [label, value], { fill });
    r.getCell(1).font = { bold: true, size: 10 };
    r.getCell(2).font = { bold: true, size: 10 };
    r.getCell(2).alignment = STYLE.alignCenter;
  });

  /* ══ Sheet 2: Thống kê nhân viên ══ */
  if (nurseList.length > 0) {
    const wsNurse = wb.addWorksheet('Thống kê nhân viên');
    wsNurse.columns = [
      { key: 'name',    width: 28 },
      { key: 'calls',   width: 16 },
      { key: 'avgSec',  width: 22 },
      { key: 'avgFmt',  width: 18 }
    ];

    addSheetHeader(wsNurse, ['Nhân viên', 'Số cuộc gọi', 'TG phản hồi TB (giây)', 'TG phản hồi TB'], STYLE.headerGreen);

    nurseList.forEach((r, idx) => {
      const fill = idx % 2 === 0
        ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
        : STYLE.rowAltGreen;
      const dataRow = addDataRow(wsNurse, [r.NurseName, r.totalCalls, r.avgResponseSeconds, formatSeconds(r.avgResponseSeconds)], { fill });
      dataRow.getCell(2).alignment = STYLE.alignCenter;
      dataRow.getCell(3).alignment = STYLE.alignCenter;
      dataRow.getCell(4).alignment = STYLE.alignCenter;
    });
  }

  /* ── Helper: build a coloured log sheet ── */
  const buildLogSheet = (wsName, logs) => {
    const ws = wb.addWorksheet(wsName);
    ws.columns = [
      { key: 'stt',      width: 6  },
      { key: 'room',     width: 12 },
      { key: 'type',     width: 14 },
      { key: 'reqTime',  width: 22 },
      { key: 'resTime',  width: 22 },
      { key: 'nurse',    width: 22 },
      { key: 'status',   width: 16 },
      { key: 'secNum',   width: 20 },
      { key: 'secFmt',   width: 14 }
    ];

    addSheetHeader(ws,
      ['#', 'Phòng', 'Loại', 'Thời gian gọi', 'Thời gian xử lý', 'Nhân viên', 'Trạng thái', 'TG p/h (giây)', 'TG p/h'],
      STYLE.headerGray
    );

    logs.forEach((log, i) => {
      const isPending   = log.Status !== 'Completed';
      const isEmergency = log.CallType === 'Emergency';

      let fill;
      let font = STYLE.fontNormal;

      if (isPending && isEmergency) {
        fill = STYLE.rowEmergencyPending; // light red
        font = STYLE.fontRed;
      } else if (isPending) {
        fill = STYLE.rowNormalPending;    // light yellow
        font = STYLE.fontOrange;
      } else if (i % 2 === 0) {
        fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      } else {
        fill = STYLE.rowAlt;              // light blue
      }

      const row = addDataRow(ws, [
        i + 1,
        `Phòng ${log.RoomId}`,
        isEmergency ? 'Khẩn cấp' : 'Thường',
        formatDisplayDateTime(log.RequestTime),
        formatDisplayDateTime(log.ResponseTime),
        log.NurseName || '-',
        isPending ? 'Chưa xử lý' : 'Đã xử lý',
        log.ResponseSeconds ?? '-',
        formatSeconds(log.ResponseSeconds)
      ], { fill, font });

      row.getCell(1).alignment = STYLE.alignCenter;
      row.getCell(8).alignment = STYLE.alignCenter;
      row.getCell(9).alignment = STYLE.alignCenter;

      // Loại cell: tô màu riêng bất kể row bg
      if (isEmergency) {
        row.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        row.getCell(3).font = { bold: true, color: { argb: 'FFB91C1C' }, size: 10 };
      } else {
        row.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        row.getCell(3).font = { bold: true, color: { argb: 'FF065F46' }, size: 10 };
      }

      // Trạng thái cell
      if (isPending) {
        row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        row.getCell(7).font = { bold: true, color: { argb: 'FF92400E' }, size: 10 };
      } else {
        row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        row.getCell(7).font = { bold: true, color: { argb: 'FF065F46' }, size: 10 };
      }
    });
    return ws;
  };

  if (exportScope === 'nurse' && selectedNurse) {
    buildLogSheet(`LS-${selectedNurse}`.slice(0, 31), logsToExport);
  } else {
    buildLogSheet('Tất cả cuộc gọi', logsToExport);
    // Per-nurse sheets
    const names = [...new Set(logsToExport.map((l) => l.NurseName).filter(Boolean))];
    names.forEach((name) => {
      buildLogSheet(name.slice(0, 31), logsToExport.filter((l) => l.NurseName === name));
    });
  }

  /* ── Save ── */
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bao-cao-${exportScope === 'nurse' ? safeFilePart(selectedNurse) + '-' : ''}${safeFilePart(rangeInfo.from || 'all')}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};

/* ─── Component ───────────────────────────────────────── */
const Reports = () => {
  const today = useMemo(() => new Date(), []);
  const [filterType, setFilterType] = useState('range');
  const [date, setDate] = useState(toDateInputValue(today));
  const [month, setMonth] = useState(toMonthInputValue(today));
  const [fromDate, setFromDate] = useState(toDateInputValue(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [toDate, setToDate] = useState(toDateInputValue(today));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exportFormat, setExportFormat] = useState('xlsx');
  const [exporting, setExporting] = useState(false);
  const [exportScope, setExportScope] = useState('total'); // 'total' | 'nurse'
  const [selectedNurse, setSelectedNurse] = useState('');
  const [filterRoom, setFilterRoom] = useState('all');
  const [filterCallType, setFilterCallType] = useState('all');

  const reportData = report || {
    summary: { totalCalls: 0, emergencyCalls: 0, normalCalls: 0, completedCalls: 0, pendingCalls: 0, avgResponseSeconds: 0 },
    logs: [],
    nurseStats: [],
    charts: { byRoom: [], byType: [] }
  };

  const rangeInfo = useMemo(
    () => buildDateRange(filterType, date, month, fromDate, toDate),
    [filterType, date, month, fromDate, toDate]
  );

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await reportService.getReport(rangeInfo.from, rangeInfo.to);
      setReport(data);
    } catch (err) {
      console.error('Fetch report error:', err);
      setError('Không thể tải dữ liệu báo cáo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); /* eslint-disable-next-line */ }, []);

  /* Filtered logs for display */
  const filteredLogs = useMemo(() => {
    return reportData.logs.filter((log) => {
      if (filterRoom !== 'all' && String(log.RoomId) !== filterRoom) return false;
      if (filterCallType !== 'all' && log.CallType !== filterCallType) return false;
      return true;
    });
  }, [reportData.logs, filterRoom, filterCallType]);

  /* Unique rooms + nurses for dropdowns */
  const roomOptions = useMemo(() => [...new Set(reportData.logs.map((l) => String(l.RoomId)))].sort(), [reportData.logs]);
  const nurseOptions = useMemo(() => [...new Set(reportData.logs.map((l) => l.NurseName).filter(Boolean))].sort(), [reportData.logs]);

  /* completion rate */
  const completionRate = reportData.summary.totalCalls
    ? ((reportData.summary.completedCalls / reportData.summary.totalCalls) * 100).toFixed(1)
    : 0;

  /* ── Chart data ── */
  const trendData = useMemo(() => buildTrendData(reportData.logs), [reportData.logs]);

  const trendChartData = {
    labels: trendData.labels,
    datasets: [
      {
        label: 'Tổng',
        data: trendData.total,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 3
      },
      {
        label: 'Khẩn cấp',
        data: trendData.emergency,
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220,38,38,0.08)',
        fill: false,
        tension: 0.3,
        pointRadius: 3
      },
      {
        label: 'Thường',
        data: trendData.normal,
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22,163,74,0.08)',
        fill: false,
        tension: 0.3,
        pointRadius: 3
      }
    ]
  };

  const roomChartData = {
    labels: reportData.charts.byRoom.map((item) => `Phòng ${item.RoomId}`),
    datasets: [{
      label: 'Số cuộc gọi',
      data: reportData.charts.byRoom.map((item) => item.callCount),
      backgroundColor: '#2563eb',
      borderRadius: 6
    }]
  };

  const typeChartData = {
    labels: reportData.charts.byType.map((item) => item.CallType === 'Emergency' ? 'Khẩn cấp' : 'Thường'),
    datasets: [{
      data: reportData.charts.byType.map((item) => item.callCount),
      backgroundColor: ['#dc2626', '#16a34a'],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  const nurseChartData = {
    labels: reportData.nurseStats.map((r) => r.NurseName),
    datasets: [{
      label: 'Số cuộc gọi',
      data: reportData.nurseStats.map((r) => r.totalCalls),
      backgroundColor: '#0891b2',
      borderRadius: 6
    }]
  };

  const responseTimeByRoomData = {
    labels: reportData.charts.byRoom.map((item) => `Phòng ${item.RoomId}`),
    datasets: [{
      label: 'TG phản hồi TB (giây)',
      data: reportData.charts.byRoom.map((item) => {
        const logs = reportData.logs.filter((l) => String(l.RoomId) === String(item.RoomId) && l.ResponseSeconds != null);
        if (!logs.length) return 0;
        return Math.round(logs.reduce((a, l) => a + Number(l.ResponseSeconds), 0) / logs.length);
      }),
      backgroundColor: '#7c3aed',
      borderRadius: 6
    }]
  };

  const handleExport = async () => {
    if (!report || exporting) return;
    const scope = exportScope === 'nurse' && selectedNurse ? 'nurse' : 'total';
    setExporting(true);
    try {
      if (exportFormat === 'pdf') {
        exportPdf(reportData, rangeInfo, scope, selectedNurse);
      } else {
        await exportExcel(reportData, rangeInfo, scope, selectedNurse);
      }
    } finally {
      setExporting(false);
    }
  };

  const chartOpts = { responsive: true, plugins: { legend: { position: 'bottom' } } };
  const barOpts = { ...chartOpts, scales: { y: { beginAtZero: true } } };

  /* ── render ── */
  return (
    <div className="space-y-6">

      {/* ── Filter card ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Báo cáo</h2>
            <p className="text-sm text-gray-500 mt-1">Lọc theo ngày, tháng hoặc khoảng thời gian.</p>
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">Tất cả</option>
              <option value="day">Ngày</option>
              <option value="month">Tháng</option>
              <option value="range">Khoảng thời gian</option>
            </select>

            {filterType === 'day' && (
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            )}
            {filterType === 'month' && (
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            )}
            {filterType === 'range' && (
              <div className="flex gap-2 items-center">
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <span className="text-gray-400 text-sm">→</span>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            )}

            <button
              onClick={fetchReport}
              disabled={loading}
              className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-60 transition"
            >
              {loading ? 'Đang tải...' : 'Xem báo cáo'}
            </button>
          </div>
        </div>

        {/* Export row */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-3">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="xlsx">Excel (.xlsx)</option>
            <option value="pdf">PDF</option>
          </select>

          <select
            value={exportScope}
            onChange={(e) => { setExportScope(e.target.value); if (e.target.value === 'total') setSelectedNurse(''); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="total">Xuất tổng</option>
            <option value="nurse">Xuất theo nhân viên</option>
          </select>

          {exportScope === 'nurse' && (
            <select
              value={selectedNurse}
              onChange={(e) => setSelectedNurse(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">-- Chọn nhân viên --</option>
              {nurseOptions.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          )}

          <button
            onClick={handleExport}
            disabled={!report || loading || (exportScope === 'nurse' && !selectedNurse)}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition"
          >
            Xuất báo cáo
          </button>

          <span className="text-sm text-gray-400">Thời gian: <span className="text-gray-700 font-medium">{rangeInfo.label}</span></span>
        </div>

        {error && <p className="mt-3 text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {[
          { label: 'Tổng cuộc gọi', value: reportData.summary.totalCalls, color: 'blue' },
          { label: 'Khẩn cấp', value: reportData.summary.emergencyCalls, color: 'red' },
          { label: 'Thường', value: reportData.summary.normalCalls, color: 'green' },
          { label: 'Đã xử lý', value: reportData.summary.completedCalls, color: 'teal' },
          { label: 'Chưa xử lý', value: reportData.summary.pendingCalls, color: 'yellow' },
          { label: 'TG phản hồi TB', value: formatSeconds(reportData.summary.avgResponseSeconds), color: 'purple' },
          { label: 'Tỷ lệ hoàn thành', value: `${completionRate}%`, color: 'indigo' }
        ].map(({ label, value, color }) => {
          const colors = {
            blue: 'bg-blue-50 border-blue-200 text-blue-700',
            red: 'bg-red-50 border-red-200 text-red-700',
            green: 'bg-green-50 border-green-200 text-green-700',
            teal: 'bg-teal-50 border-teal-200 text-teal-700',
            yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
            purple: 'bg-purple-50 border-purple-200 text-purple-700',
            indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700'
          };
          return (
            <div key={label} className={`rounded-xl border p-4 ${colors[color]}`}>
              <p className="text-xs font-medium opacity-80 mb-1">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          );
        })}
      </div>

      {/* ── Trend chart (full width) ── */}
      {trendData.labels.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Xu hướng cuộc gọi theo ngày</h3>
          <Line data={trendChartData} options={barOpts} />
        </div>
      )}

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Số cuộc gọi theo phòng</h3>
          {reportData.charts.byRoom.length === 0
            ? <p className="text-sm text-gray-400">Chưa có dữ liệu.</p>
            : <Bar data={roomChartData} options={barOpts} />}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Phân loại cuộc gọi</h3>
          {reportData.charts.byType.length === 0
            ? <p className="text-sm text-gray-400">Chưa có dữ liệu.</p>
            : <Pie data={typeChartData} options={chartOpts} />}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Thời gian phản hồi TB theo phòng</h3>
          {reportData.charts.byRoom.length === 0
            ? <p className="text-sm text-gray-400">Chưa có dữ liệu.</p>
            : <Bar data={responseTimeByRoomData} options={barOpts} />}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Hiệu suất nhân viên (số cuộc gọi)</h3>
          {reportData.nurseStats.length === 0
            ? <p className="text-sm text-gray-400">Chưa có dữ liệu.</p>
            : <Bar data={nurseChartData} options={barOpts} />}
        </div>
      </div>

      {/* ── Nurse stats table ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Thống kê theo nhân viên</h3>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
                <th className="text-left px-4 py-3 font-semibold">Nhân viên</th>
                <th className="text-right px-4 py-3 font-semibold">Số cuộc gọi</th>
                <th className="text-right px-4 py-3 font-semibold">TG phản hồi TB</th>
              </tr>
            </thead>
            <tbody>
              {reportData.nurseStats.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-4 text-gray-400 text-center">Chưa có dữ liệu.</td></tr>
              ) : reportData.nurseStats.map((row) => (
                <tr key={row.NurseName} className="border-t hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-800">{row.NurseName}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{row.totalCalls}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatSeconds(row.avgResponseSeconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Detail table ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-base font-semibold text-gray-800">Danh sách chi tiết</h3>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="all">Tất cả phòng</option>
              {roomOptions.map((r) => (
                <option key={r} value={r}>Phòng {r}</option>
              ))}
            </select>
            <select
              value={filterCallType}
              onChange={(e) => setFilterCallType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="all">Tất cả loại</option>
              <option value="Emergency">Khẩn cấp</option>
              <option value="Normal">Thường</option>
            </select>
            <span className="text-xs text-gray-400 self-center">{filteredLogs.length} bản ghi</span>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
                <th className="text-left px-3 py-3 font-semibold">#</th>
                <th className="text-left px-3 py-3 font-semibold">Phòng</th>
                <th className="text-left px-3 py-3 font-semibold">Loại</th>
                <th className="text-left px-3 py-3 font-semibold">Thời gian gọi</th>
                <th className="text-left px-3 py-3 font-semibold">Thời gian xử lý</th>
                <th className="text-left px-3 py-3 font-semibold">Nhân viên</th>
                <th className="text-left px-3 py-3 font-semibold">Trạng thái</th>
                <th className="text-right px-3 py-3 font-semibold">TG phản hồi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-4 text-gray-400 text-center">Đang tải dữ liệu...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-4 text-gray-400 text-center">Không có dữ liệu trong khoảng này.</td></tr>
              ) : filteredLogs.map((log, idx) => {
                const isEmergency = log.CallType === 'Emergency';
                const isPending = log.Status !== 'Completed';
                return (
                  <tr
                    key={log.Id}
                    className={`border-t transition ${
                      isEmergency && isPending
                        ? 'bg-red-50 hover:bg-red-100'
                        : isPending
                          ? 'bg-yellow-50 hover:bg-yellow-100'
                          : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-800">Phòng {log.RoomId}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isEmergency ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {isEmergency ? '🔴 Khẩn cấp' : '🟢 Thường'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{formatDisplayDateTime(log.RequestTime)}</td>
                    <td className="px-3 py-2.5 text-gray-600">{formatDisplayDateTime(log.ResponseTime)}</td>
                    <td className="px-3 py-2.5 text-gray-700">{log.NurseName || '-'}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isPending ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {isPending ? '⏳ Chưa xử lý' : '✅ Đã xử lý'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-700">{formatSeconds(log.ResponseSeconds)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
