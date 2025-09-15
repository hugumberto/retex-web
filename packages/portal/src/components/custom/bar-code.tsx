'use client';
import JsBarcode from 'jsbarcode';
import { useEffect, useRef } from 'react';

export default function Barcode({
  value,
  width = 1,
  height = 28,
  fontSize = 12,
}: {
  value: string;
  width?: number;
  height?: number;
  fontSize?: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        lineColor: '#02748e',
        width: width || 1, // diminui a largura de cada barra
        height: height || 28, // diminui a altura do código de barras
        displayValue: true,
        fontSize: fontSize || 12, // diminui o texto abaixo do código
      });
    }
  }, [fontSize, height, value, width]);

  return <svg ref={svgRef}></svg>;
}
