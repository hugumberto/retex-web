'use client';

import Title from '@/components/custom/title';
import api from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

type ConfirmState = 'loading' | 'success' | 'error' | 'invalid';

function messageForStatus(status?: number): string {
  switch (status) {
    case 404:
      return 'Link de confirmação inválido ou já utilizado.';
    case 400:
      return 'O prazo para confirmar a recolha já expirou.';
    default:
      return 'Não foi possível confirmar a recolha. Tente novamente.';
  }
}

function ConfirmContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<ConfirmState>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setState('invalid');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await api.post('/package/confirm-collection', { token });
        if (!cancelled) setState('success');
      } catch (err) {
        if (cancelled) return;
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        setMessage(messageForStatus(status));
        setState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary-muted/10 p-6">
      <div className="w-full max-w-md rounded-2xl border border-secondary/25 bg-white p-8 text-center shadow-sm">
        <Title as="h1">Confirmação de recolha</Title>
        <div className="mt-4 text-sm text-secondary">
          {state === 'loading' && <p>A confirmar a sua recolha...</p>}
          {state === 'success' && (
            <p className="text-green-700">
              Recolha confirmada! O nosso motorista passará no dia agendado.
              Obrigado.
            </p>
          )}
          {state === 'invalid' && (
            <p className="text-red-600">Link de confirmação inválido.</p>
          )}
          {state === 'error' && <p className="text-red-600">{message}</p>}
        </div>
      </div>
    </div>
  );
}

export default function ConfirmarColetaPage() {
  return (
    <Suspense>
      <ConfirmContent />
    </Suspense>
  );
}
