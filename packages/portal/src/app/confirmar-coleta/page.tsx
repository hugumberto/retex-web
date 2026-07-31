'use client';

import Title from '@/components/custom/title';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

type ConfirmState = 'loading' | 'success' | 'error' | 'invalid';

function errorKeyForStatus(
  status: number | undefined,
  isReject: boolean
): string {
  switch (status) {
    case 404:
      return 'errorInvalidLink';
    case 400:
      return isReject ? 'errorRejectFailed' : 'errorDeadlineExpired';
    default:
      return isReject ? 'errorRejectGeneric' : 'errorConfirmGeneric';
  }
}

function ConfirmContent() {
  const t = useTranslations('collectionConfirmation');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const isReject = searchParams.get('action') === 'reject';
  const [state, setState] = useState<ConfirmState>('loading');
  const [errorKey, setErrorKey] = useState('errorConfirmGeneric');

  useEffect(() => {
    if (!token) {
      setState('invalid');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await api.post(
          isReject
            ? '/collection-request/reject-collection'
            : '/collection-request/confirm-collection',
          { token }
        );
        if (!cancelled) setState('success');
      } catch (err) {
        if (cancelled) return;
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        setErrorKey(errorKeyForStatus(status, isReject));
        setState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, isReject]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary-muted/10 p-6">
      <div className="w-full max-w-md rounded-2xl border border-secondary/25 bg-white p-8 text-center shadow-sm">
        <Title as="h1">{isReject ? t('rejectTitle') : t('confirmTitle')}</Title>
        <div className="mt-4 text-sm text-secondary">
          {state === 'loading' && (
            <p>{isReject ? t('rejectLoading') : t('confirmLoading')}</p>
          )}
          {state === 'success' && !isReject && (
            <p className="text-green-700">{t('confirmSuccess')}</p>
          )}
          {state === 'success' && isReject && (
            <p className="text-green-700">{t('rejectSuccess')}</p>
          )}
          {state === 'invalid' && (
            <p className="text-red-600">{t('invalidLink')}</p>
          )}
          {state === 'error' && <p className="text-red-600">{t(errorKey)}</p>}
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
