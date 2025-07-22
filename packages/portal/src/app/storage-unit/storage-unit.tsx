'use client';

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StorageUnitForm from "./storage-unit-form";



export default function StorageUnit() {
 

  return (
    <section
      id="contact-form"
      className=" text-white py-16 px-4 flex flex-col items-center "
    >
      <h1 className="text-4xl md:text-5xl font-bold text-center text-neutral-950 ">
        Armazenamento
      </h1>
      <StorageUnitForm/>
      <Table className="mt-8 w-full max-w-4xl">
         <TableCaption>A list of your recent invoices.</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead className="w-[100px]">Invoice</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Method</TableHead>
      <TableHead className="text-right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="font-medium">INV001</TableCell>
      <TableCell>Paid</TableCell>
      <TableCell>Credit Card</TableCell>
      <TableCell className="text-right">$250.00</TableCell>
    </TableRow>
  </TableBody>
      </Table>
    </section>
  );
}
