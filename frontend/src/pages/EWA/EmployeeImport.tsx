import React, { useState } from 'react';
import { Upload, Download, CheckCircle, AlertCircle } from 'lucide-react';

interface Employee {
  external_id: string;
  name: string;
  email: string;
  hourly_rate: number;
}

export default function EmployeeImport() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Employee[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  const downloadTemplate = () => {
    const csvContent = 'external_id,name,email,hourly_rate\nEMP001,John Doe,john@company.com,25.00\nEMP002,Jane Smith,jane@company.com,30.00';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImported(false);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      parseCSV(csv);
    };
    reader.readAsText(selectedFile);
  };

  const parseCSV = (csv: string) => {
    const lines = csv.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      setErrors(['CSV must have header and at least one employee']);
      return;
    }

    const header = lines[0].split(',');
    const expectedHeaders = ['external_id', 'name', 'email', 'hourly_rate'];
    
    if (!expectedHeaders.every(h => header.includes(h))) {
      setErrors(['CSV must have columns: external_id, name, email, hourly_rate']);
      return;
    }

    const employees: Employee[] = [];
    const newErrors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < 4) {
        newErrors.push(`Row ${i + 1}: Missing columns`);
        continue;
      }

      const hourlyRate = parseFloat(values[3]);
      if (isNaN(hourlyRate) || hourlyRate <= 0) {
        newErrors.push(`Row ${i + 1}: Invalid hourly rate`);
        continue;
      }

      if (!values[2].includes('@')) {
        newErrors.push(`Row ${i + 1}: Invalid email format`);
        continue;
      }

      employees.push({
        external_id: values[0].trim(),
        name: values[1].trim(),
        email: values[2].trim(),
        hourly_rate: hourlyRate
      });
    }

    setPreview(employees);
    setErrors(newErrors);
  };

  const importEmployees = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('csv', file);

      const response = await fetch('/api/ewa/admin/upload-employees', {
        method: 'POST',
        headers: {
          'X-Org-ID': 'current'
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setImported(true);
        alert(`Successfully imported ${result.data.imported_count} employees`);
      } else {
        const error = await response.text();
        alert(`Import failed: ${error}`);
      }
    } catch (error) {
      alert('Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Import Employees</h1>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          <Download size={20} />
          Download Template
        </button>
      </div>

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-lg shadow border mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload CSV File</h2>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-600 mb-4">
            Choose a CSV file with employee data or drag and drop it here
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-700"
          >
            Choose File
          </label>
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {file.name}
            </p>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p className="font-medium">CSV Format Requirements:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Headers: external_id, name, email, hourly_rate</li>
            <li>External ID: Unique identifier from your system</li>
            <li>Hourly Rate: Numeric value (e.g., 25.00)</li>
            <li>Email: Valid email address</li>
          </ul>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="text-red-600" size={20} />
            <h3 className="font-semibold text-red-800">Validation Errors</h3>
          </div>
          <ul className="list-disc list-inside text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && errors.length === 0 && (
        <div className="bg-white p-6 rounded-lg shadow border mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-600" size={20} />
              <h2 className="text-xl font-semibold">Preview ({preview.length} employees)</h2>
            </div>
            <button
              onClick={importEmployees}
              disabled={importing || imported}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {importing ? 'Importing...' : imported ? 'Imported!' : 'Import Employees'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">External ID</th>
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Email</th>
                  <th className="text-left py-2">Hourly Rate</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 10).map((employee, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{employee.external_id}</td>
                    <td className="py-2">{employee.name}</td>
                    <td className="py-2">{employee.email}</td>
                    <td className="py-2">${employee.hourly_rate.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 10 && (
              <p className="text-sm text-gray-600 mt-2">
                Showing first 10 of {preview.length} employees
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}