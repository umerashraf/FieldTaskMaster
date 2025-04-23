import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Task, ServiceSheet, Timesheet, Note, Photo, ProductUsage, Product } from '@shared/schema';
import { formatDate, formatTime, formatDuration } from './date-utils';

// Type for task details with related data
type TaskWithDetails = Task & {
  assignedUsers?: { id: number; name: string; username: string }[];
  serviceSheet?: ServiceSheet;
  notes?: Note[];
  photos?: (Photo & { url: string })[];
  productUsage?: (ProductUsage & { product: Product })[];
  timesheets?: Timesheet[];
  client?: { id: number; name: string } | null;
};

export const generateTaskPDF = (task: TaskWithDetails) => {
  const doc = new jsPDF();
  
  // Add logo and header
  doc.setFontSize(20);
  doc.setTextColor(41, 98, 255); // Primary color
  doc.text('FieldServe Pro', 14, 22);
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text('Service Report', 14, 30);
  
  // Add task information
  doc.setFontSize(18);
  doc.setTextColor(60);
  doc.text(task.title, 14, 45);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  
  const taskInfo = [
    ['Status:', task.status || 'N/A'],
    ['Priority:', task.priority || 'N/A'],
    ['Location:', `${task.locationName}, ${task.locationAddress}`],
    ['Scheduled Date:', formatDate(task.scheduledDate)],
    ['Client:', task.client?.name || 'N/A'],
    ['Progress:', `${task.progress || 0}%`],
  ];
  
  autoTable(doc, {
    startY: 50,
    head: [],
    body: taskInfo,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
  });
  
  // Add task description
  if (task.description) {
    doc.setFontSize(14);
    doc.setTextColor(60);
    doc.text('Description', 14, doc.lastAutoTable.finalY + 15);
    
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(task.description, 14, doc.lastAutoTable.finalY + 25, {
      maxWidth: 180,
    });
  }
  
  let yPos = doc.lastAutoTable.finalY + 40;
  
  // Add assigned users
  if (task.assignedUsers && task.assignedUsers.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(60);
    doc.text('Assigned Technicians', 14, yPos);
    
    const userRows = task.assignedUsers.map(user => [user.name]);
    
    autoTable(doc, {
      startY: yPos + 5,
      head: [['Technician Name']],
      body: userRows,
      theme: 'striped',
      headStyles: { fillColor: [41, 98, 255] },
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
  }
  
  // Add service sheet if available
  if (task.serviceSheet) {
    doc.setFontSize(14);
    doc.setTextColor(60);
    doc.text('Service Sheet', 14, yPos);
    
    const sheet = task.serviceSheet;
    const serviceInfo = [
      ['Service Type:', sheet.serviceType],
      ['Equipment Type:', sheet.equipmentType],
    ];
    
    autoTable(doc, {
      startY: yPos + 5,
      head: [],
      body: serviceInfo,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
    });
    
    // Add checklist items
    if (sheet.checklist) {
      const checklistItems: any = sheet.checklist;
      if (Array.isArray(checklistItems)) {
        const checklistRows = checklistItems.map(item => [
          item.label,
          item.checked ? '✓' : '✗',
          item.notes || '',
        ]);
        
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 10,
          head: [['Item', 'Status', 'Notes']],
          body: checklistRows,
          theme: 'striped',
          headStyles: { fillColor: [41, 98, 255] },
        });
      }
    }
    
    // Add signatures if available
    if (sheet.technicianSignature || sheet.customerSignature) {
      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(60);
      doc.text('Signatures', 14, 20);
      
      if (sheet.technicianSignature) {
        doc.setFontSize(10);
        doc.text('Technician Signature:', 14, 30);
        try {
          doc.addImage(sheet.technicianSignature, 'PNG', 14, 35, 80, 40);
        } catch (e) {
          // If image loading fails
          doc.text('(Signature available in digital format)', 14, 40);
        }
      }
      
      if (sheet.customerSignature) {
        doc.setFontSize(10);
        doc.text('Customer Signature:', 14, 90);
        doc.text(`Name: ${sheet.customerName || 'N/A'}`, 14, 100);
        try {
          doc.addImage(sheet.customerSignature, 'PNG', 14, 105, 80, 40);
        } catch (e) {
          // If image loading fails
          doc.text('(Signature available in digital format)', 14, 110);
        }
      }
      
      if (sheet.completionDate) {
        doc.text(`Completion Date: ${formatDate(sheet.completionDate)}`, 14, 160);
      }
      
      yPos = 180;
    } else {
      yPos = doc.lastAutoTable.finalY + 15;
    }
  }
  
  // Add product usage if available (on a new page)
  if (task.productUsage && task.productUsage.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(60);
    doc.text('Materials Used', 14, 20);
    
    const productRows = task.productUsage.map(usage => [
      usage.product.name,
      usage.product.sku,
      usage.quantity.toString(),
      `$${usage.product.unitPrice.toFixed(2)}`,
      `$${(usage.quantity * usage.product.unitPrice).toFixed(2)}`,
    ]);
    
    // Add total row
    const total = task.productUsage.reduce(
      (sum, usage) => sum + usage.quantity * usage.product.unitPrice,
      0
    );
    
    autoTable(doc, {
      startY: 25,
      head: [['Material', 'SKU', 'Quantity', 'Unit Price', 'Total']],
      body: productRows,
      foot: [['', '', '', 'Total:', `$${total.toFixed(2)}`]],
      theme: 'striped',
      headStyles: { fillColor: [41, 98, 255] },
      footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
  }
  
  // Add timesheets if available
  if (task.timesheets && task.timesheets.length > 0) {
    // Check if we need a new page
    if (yPos > 180) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(60);
    doc.text('Time Tracking', 14, yPos);
    
    const timesheetRows = task.timesheets.map(timesheet => {
      const duration = timesheet.durationMinutes || 0;
      return [
        formatDate(timesheet.startTime),
        timesheet.startTime ? formatTime(timesheet.startTime) : 'N/A',
        timesheet.endTime ? formatTime(timesheet.endTime) : 'N/A',
        formatDuration(duration),
        timesheet.notes || '',
      ];
    });
    
    // Calculate total time
    const totalMinutes = task.timesheets.reduce(
      (sum, timesheet) => sum + (timesheet.durationMinutes || 0),
      0
    );
    
    autoTable(doc, {
      startY: yPos + 5,
      head: [['Date', 'Start Time', 'End Time', 'Duration', 'Notes']],
      body: timesheetRows,
      foot: [['', '', 'Total Hours:', formatDuration(totalMinutes), '']],
      theme: 'striped',
      headStyles: { fillColor: [41, 98, 255] },
      footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
    });
  }
  
  // Add footer
  const totalPages = doc.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `FieldServe Pro Service Report - Generated on ${new Date().toLocaleString()}`,
      14,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `Page ${i} of ${totalPages}`,
      doc.internal.pageSize.width - 25,
      doc.internal.pageSize.height - 10
    );
  }
  
  return doc;
};

// Utility function to save PDF
export const saveTaskPDF = (task: TaskWithDetails, filename?: string) => {
  const pdf = generateTaskPDF(task);
  const defaultFilename = `service-report-${task.id}-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename || defaultFilename);
  return pdf;
};