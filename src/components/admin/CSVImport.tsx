import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileSpreadsheet, 
  X, 
  AlertCircle, 
  CheckCircle2,
  Download
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CSVImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'products' | 'categories';
  requiredColumns: string[];
  optionalColumns?: string[];
  onImport: (data: Record<string, string>[]) => Promise<{ success: number; errors: string[] }>;
  sampleData?: Record<string, string>[];
}

export function CSVImport({ 
  open, 
  onOpenChange, 
  type, 
  requiredColumns, 
  optionalColumns = [],
  onImport,
  sampleData
}: CSVImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): { headers: string[]; data: Record<string, string>[] } => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return { headers: [], data: [] };

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      return row;
    });

    return { headers, data };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast({ title: 'Please select a CSV file', variant: 'destructive' });
      return;
    }

    setFile(selectedFile);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { headers, data } = parseCSV(text);
      setHeaders(headers);
      setParsedData(data);
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    // Validate required columns
    const missingColumns = requiredColumns.filter(col => !headers.includes(col.toLowerCase()));
    if (missingColumns.length > 0) {
      toast({ 
        title: 'Missing required columns', 
        description: `Please include: ${missingColumns.join(', ')}`,
        variant: 'destructive' 
      });
      return;
    }

    setImporting(true);
    setProgress(0);

    // Simulate progress during import
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      const result = await onImport(parsedData);
      setResult(result);
      setProgress(100);
      
      if (result.success > 0) {
        toast({ 
          title: 'Import completed', 
          description: `${result.success} ${type} imported successfully` 
        });
      }
    } catch (error: any) {
      toast({ 
        title: 'Import failed', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      clearInterval(progressInterval);
      setImporting(false);
    }
  };

  const downloadSampleCSV = () => {
    const allColumns = [...requiredColumns, ...optionalColumns];
    const csvContent = [
      allColumns.join(','),
      ...(sampleData || []).map(row => allColumns.map(col => row[col] || '').join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample_${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setResult(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) resetState();
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import {type === 'products' ? 'Products' : 'Categories'} from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import {type}. Make sure your file includes all required columns.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Required Columns Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Required Columns</h4>
            <div className="flex flex-wrap gap-2 mb-3">
              {requiredColumns.map(col => (
                <Badge key={col} variant="default">{col}</Badge>
              ))}
            </div>
            {optionalColumns.length > 0 && (
              <>
                <h4 className="font-medium mb-2 mt-4">Optional Columns</h4>
                <div className="flex flex-wrap gap-2">
                  {optionalColumns.map(col => (
                    <Badge key={col} variant="secondary">{col}</Badge>
                  ))}
                </div>
              </>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={downloadSampleCSV}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Sample CSV
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Select CSV File</Label>
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex-1"
              />
              {file && (
                <Button variant="ghost" size="icon" onClick={resetState}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Preview */}
          {parsedData.length > 0 && !result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Preview ({parsedData.length} rows)</h4>
                <div className="flex gap-2">
                  {requiredColumns.map(col => (
                    <Badge 
                      key={col}
                      variant={headers.includes(col.toLowerCase()) ? 'default' : 'destructive'}
                    >
                      {headers.includes(col.toLowerCase()) ? (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      ) : (
                        <AlertCircle className="h-3 w-3 mr-1" />
                      )}
                      {col}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="border rounded-lg overflow-x-auto max-h-64">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.slice(0, 6).map(h => (
                        <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>
                      ))}
                      {headers.length > 6 && <TableHead>...</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 5).map((row, i) => (
                      <TableRow key={i}>
                        {headers.slice(0, 6).map(h => (
                          <TableCell key={h} className="max-w-[150px] truncate">
                            {row[h]}
                          </TableCell>
                        ))}
                        {headers.length > 6 && <TableCell>...</TableCell>}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {parsedData.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  ...and {parsedData.length - 5} more rows
                </p>
              )}
            </div>
          )}

          {/* Import Progress */}
          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importing...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">{result.success} imported successfully</span>
                </div>
                {result.errors.length > 0 && (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">{result.errors.length} failed</span>
                  </div>
                )}
              </div>
              
              {result.errors.length > 0 && (
                <div className="bg-destructive/10 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <h5 className="font-medium text-destructive mb-2">Errors:</h5>
                  <ul className="text-sm space-y-1">
                    {result.errors.slice(0, 10).map((err, i) => (
                      <li key={i} className="text-destructive">{err}</li>
                    ))}
                    {result.errors.length > 10 && (
                      <li className="text-muted-foreground">...and {result.errors.length - 10} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => handleClose(false)}>
              {result ? 'Close' : 'Cancel'}
            </Button>
            {!result && (
              <Button 
                onClick={handleImport} 
                disabled={parsedData.length === 0 || importing}
              >
                <Upload className="h-4 w-4 mr-2" />
                {importing ? 'Importing...' : `Import ${parsedData.length} ${type}`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
