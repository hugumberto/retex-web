'use client';

import { useEffect, useState } from 'react';
import Coleta from './coleta';
import DriverRoute from './driver-route';

/**
 * Recolha no terreno: abre o ecrã do motorista (Figma 14-Motorista). A recolha
 * por código (ler um pedido ou uma rota à mão, e o "adicionar saco" do MASTER)
 * continua em `?manual=1`, ligada a partir do Perfil.
 */
export default function ColetaPage() {
  const [manual, setManual] = useState<boolean | null>(null);
  useEffect(() => {
    setManual(new URLSearchParams(window.location.search).get('manual') === '1');
  }, []);
  if (manual === null) return null;
  return manual ? <Coleta /> : <DriverRoute />;
}
