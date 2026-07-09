/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  BookOpen,
  Download,
  Terminal,
  Grid,
} from 'lucide-react';
import { Vehicle, Owner, Driver, CompanyPayment, Expense } from '../types';

interface VbaExportProps {
  vehicles: Vehicle[];
  owners: Owner[];
  drivers: Driver[];
  payments: CompanyPayment[];
  expenses: Expense[];
}

export default function VbaExport({
  vehicles,
  owners,
  drivers,
  payments,
  expenses,
}: VbaExportProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadCsv = (sheetName: string, data: string) => {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `E7_Travels_${sheetName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Convert vehicles to CSV data
  const generateVehicleCsv = () => {
    const headers = [
      'Vehicle ID',
      'Registration Number',
      'Vehicle Model',
      'Manufacturer',
      'Year',
      'Fuel Type',
      'Transmission',
      'Vehicle Type',
      'Owner ID',
      'Owner Name',
      'Driver ID',
      'Driver Name',
      'Company',
      'Site',
      'Joining Date',
      'Status',
      'EMI Amount',
      'EMI Due Date',
      'Insurance Expiry',
      'Permit Expiry',
      'FC Expiry',
      'Pollution Expiry',
      'FASTag Number',
      'Remarks',
    ];
    const rows = vehicles.map((v) => [
      v.id,
      v.registrationNumber,
      v.model,
      v.manufacturer,
      v.year,
      v.fuelType,
      v.transmission,
      v.vehicleType,
      v.ownerId,
      v.ownerName,
      v.driverId,
      v.driverName,
      v.company,
      v.site,
      v.joiningDate,
      v.status,
      v.emiAmount,
      v.emiDueDate,
      v.insuranceExpiry,
      v.permitExpiry,
      v.fcExpiry,
      v.pollutionExpiry,
      v.fastagNumber,
      v.remarks,
    ]);
    return [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
  };

  // VBA macros content
  const macros = [
    {
      id: 'm1',
      title: 'Refresh Dashboard Metrics & Pivot Tables',
      desc: 'Refreshes all Pivot Tables and calculates running balances automatically on worksheet activation.',
      code: `Sub RefreshDashboard()
    Dim pc As PivotCache
    Dim sh As Worksheet
    
    On Error GoTo ErrorHandler
    
    ' Loop through all pivot caches and refresh
    For Each pc In ThisWorkbook.PivotCaches
        pc.Refresh
    Next pc
    
    MsgBox "Dashboard metrics, charts, and audit reports have been successfully refreshed!", vbInformation, "E7 Travels ERP"
    Exit Sub
    
ErrorHandler:
    MsgBox "Error refreshing caches: " & Err.Description, vbCritical, "System Error"
End Sub`,
    },
    {
      id: 'm2',
      title: 'Add New Vehicle to Register Table',
      desc: 'Validates and appends a vehicle record directly into the named Table "tblVehicles" safely, preventing duplicates.',
      code: `Sub AddVehicle()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Vehicle Master")
    Dim tbl As ListObject
    Set tbl = ws.ListObjects("tblVehicles")
    
    Dim regNo As String
    regNo = Trim(ws.Range("B5").Value) ' Cell where user types reg no
    
    If regNo = "" Then
        MsgBox "Registration Number is mandatory!", vbExclamation, "Validation Error"
        Exit Sub
    End If
    
    ' Duplication check
    Dim r As Range
    For Each r In tbl.ListColumns("Registration Number").DataBodyRange
        If UCase(r.Value) = UCase(regNo) Then
            MsgBox "This registration number is already registered!", vbCritical, "Duplicate Plate Error"
            Exit Sub
        End If
    Next r
    
    ' Append new row
    Dim newRow As ListRow
    Set newRow = tbl.ListRows.Add
    
    With newRow
        .Range(1) = "VEH" & Format(tbl.ListRows.Count + 1, "000") ' Auto ID
        .Range(2) = UCase(regNo)
        .Range(3) = ws.Range("B6").Value ' Model
        .Range(4) = ws.Range("B7").Value ' Manufacturer
        .Range(5) = ws.Range("B8").Value ' Year
        .Range(6) = ws.Range("B9").Value ' Fuel Type
        .Range(15) = Date ' Joining date
        .Range(16) = "Active" ' Default Status
    End With
    
    MsgBox "Vehicle " & regNo & " successfully appended to register!", vbInformation, "E7 Travels ERP"
End Sub`,
    },
    {
      id: 'm3',
      title: 'Log Company Billing Payment',
      desc: 'Appends a payments transaction and immediately forces updates on dependent tables.',
      code: `Sub SavePayment()
    Dim wsPay As Worksheet
    Dim tblPay As ListObject
    Dim newRow As ListRow
    
    Set wsPay = ThisWorkbook.Sheets("Company Payments")
    Set tblPay = wsPay.ListObjects("tblPayments")
    
    ' Form validation
    If wsPay.Range("B5").Value = "" Or wsPay.Range("B6").Value = 0 Then
        MsgBox "Please fill Vehicle Number and Amount Received before saving!", vbExclamation, "Validation Failed"
        Exit Sub
    End If
    
    Set newRow = tblPay.ListRows.Add
    With newRow
        .Range(1) = wsPay.Range("B4").Value ' Month (YYYY-MM)
        .Range(2) = UCase(wsPay.Range("B5").Value) ' Vehicle
        .Range(3) = wsPay.Range("B7").Value ' Company
        .Range(4) = wsPay.Range("B8").Value ' Invoice No
        .Range(5) = DateValue(wsPay.Range("B9").Value) ' Payment Date
        .Range(6) = wsPay.Range("B6").Value ' Amount Received
        .Range(7) = wsPay.Range("B10").Value ' Remarks
    End With
    
    Call RefreshDashboard
    MsgBox "Payment voucher saved successfully!", vbInformation, "ERP ledger saved"
End Sub`,
    },
    {
      id: 'm4',
      title: 'Export Active Statement to PDF Document',
      desc: 'Generates and saves a beautifully formatted PDF document of the A4 layout directly to the local directory.',
      code: `Sub ExportStatementAsPDF()
    Dim sh As Worksheet
    Set sh = ActiveSheet
    
    Dim pdfPath As String
    pdfPath = ThisWorkbook.Path & "\\" & sh.Name & "_" & Format(Date, "yyyymmdd") & ".pdf"
    
    On Error GoTo ErrPDF
    
    sh.ExportAsFixedFormat Type:=xlTypePDF, _
                           Filename:=pdfPath, _
                           Quality:=xlQualityStandard, _
                           IncludeDocProperties:=True, _
                           IgnorePrintAreas:=False, _
                           OpenAfterPublish:=True
                           
    MsgBox "Statement PDF successfully generated and saved to: " & vbCrLf & pdfPath, vbInformation, "PDF Export Complete"
    Exit Sub
    
ErrPDF:
    MsgBox "Could not write PDF. Verify you have file system permissions in the folder.", vbCritical, "PDF Export Failure"
End Sub`,
    },
    {
      id: 'm5',
      title: 'Data Backup Module',
      desc: 'Creates a timestamped backup copy of the spreadsheet in the backup folder.',
      code: `Sub BackupData()
    Dim sourcePath As String, backupPath As String
    Dim fileName As String, parts() As String
    
    On Error GoTo ErrBackup
    
    sourcePath = ThisWorkbook.FullName
    parts = Split(ThisWorkbook.Name, ".")
    
    fileName = parts(0) & "_Backup_" & Format(Now, "YYYYMMDD_HHMMSS") & ".xlsm"
    backupPath = ThisWorkbook.Path & "\\" & fileName
    
    ThisWorkbook.SaveCopyAs backupPath
    MsgBox "Durable Backup generated successfully: " & vbCrLf & fileName, vbInformation, "Secure Backup Completed"
    Exit Sub
    
ErrBackup:
    MsgBox "Backup failed: " & Err.Description, vbCritical, "System Error"
End Sub`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* CSV Exporter / Installer Grid */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-md font-bold text-slate-800 tracking-tight flex items-center gap-2 mb-3">
          <Grid className="text-blue-600" /> Excel Data Seed Exporter (CSV Format)
        </h2>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Prepare your Excel workbook tables quickly by downloading the Chennai fleet master database with all 35 sample
          vehicles formatted for instant Excel table loading.
        </p>

        <div className="flex gap-3">
          <button
            id="download-csv-btn"
            onClick={() => handleDownloadCsv('Vehicles_Sample', generateVehicleCsv())}
            className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="h-4 w-4" /> Export 35 Sample Vehicles CSV
          </button>
        </div>
      </div>

      {/* VBA Instructions and Guide */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-md font-bold text-slate-800 tracking-tight flex items-center gap-2 mb-4">
          <BookOpen className="text-blue-600" /> Excel Named Range Setup Instructions
        </h2>

        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <p>
            To deploy this Enterprise Fleet ERP successfully in Microsoft Excel, follow these precise configuration guidelines:
          </p>
          <ul className="list-decimal list-inside space-y-2 pl-2">
            <li>
              Save your workbook with the <strong>Excel Macro-Enabled Workbook (*.xlsm)</strong> extension.
            </li>
            <li>
              Convert your spreadsheets data zones into official Excel Tables using the <strong>Ctrl + T</strong> shortcut:
              <ul className="list-disc list-inside pl-6 mt-1 space-y-1 text-slate-500">
                <li>Vehicle Master range &rarr; Name as <strong>tblVehicles</strong></li>
                <li>Company Payments range &rarr; Name as <strong>tblPayments</strong></li>
                <li>Expense Entry range &rarr; Name as <strong>tblExpenses</strong></li>
              </ul>
            </li>
            <li>
              Create a VBA Module (Alt + F11 &rarr; Insert &rarr; Module) and paste the optimized macro segments displayed below.
            </li>
          </ul>
        </div>
      </div>

      {/* VBA Macro Code Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {macros.map((m) => (
          <div key={m.id} className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col justify-between">
            <div className="p-5 border-b border-slate-800">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
                    <Terminal className="text-blue-400 h-4 w-4" /> {m.title}
                  </h3>
                  <p className="text-3xs text-slate-400 mt-1">{m.desc}</p>
                </div>
                <button
                  id={`btn-copy-${m.id}`}
                  onClick={() => copyToClipboard(m.id, m.code)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded transition-colors flex items-center gap-1 text-2xs"
                >
                  {copiedId === m.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy Code
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="p-5 bg-slate-950 font-mono text-3xs text-slate-300 overflow-x-auto max-h-80">
              <pre><code>{m.code}</code></pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
