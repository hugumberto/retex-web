import Barcode from '@/components/custom/bar-code';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Check, X } from 'lucide-react';

export default function AddTriage() {
  return (
    <div className="rounded-[24px] border border-secondary/45 bg-white p-4 md:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-secondary">Add - Triage</h2>
        <X className="size-5 text-secondary" />
      </div>

      <div className="space-y-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Items</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="h-20 text-center text-secondary/55">
                Item table
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            className="h-24 w-40 rounded-lg border-secondary/40 bg-secondary-muted/30"
          >
            <div className="flex flex-col items-center gap-2">
              <Barcode
                value="TRIAGE-ITEM"
                width={1.2}
                height={26}
                fontSize={10}
              />
              <span className="text-[11px] text-secondary">Add items</span>
            </div>
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Storage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="h-24 text-center text-secondary/55">
                Storage table
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div className="flex justify-center pt-1">
          <Button type="button" variant="secondary" className="min-w-40">
            <Check className="size-4" />
            Finish Triage
          </Button>
        </div>
      </div>
    </div>
  );
}
