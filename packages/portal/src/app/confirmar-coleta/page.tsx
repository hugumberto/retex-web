'use client';

import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

type Info = {
  code: string | null;
  firstName: string | null;
  start: string | null;
  interval: string | null;
  estimatedBags: number | null;
  street: string | null;
  city: string | null;
};

type State = 'loading' | 'ready' | 'busy' | 'confirmed' | 'rejected' | 'error';

function errorKeyForStatus(status: number | undefined, isReject: boolean): string {
  switch (status) {
    case 404:
      return 'errorInvalidLink';
    case 400:
      return isReject ? 'errorRejectFailed' : 'errorDeadlineExpired';
    default:
      return isReject ? 'errorRejectGeneric' : 'errorConfirmGeneric';
  }
}

/**
 * Link do email "confirma a tua recolha". Abrir a página só mostra o dia;
 * confirma-se (ou recusa-se) com um botão. Assim, os leitores de email que
 * abrem os links para os verificar já não confirmam recolhas sozinhos.
 */
function ConfirmContent() {
  const t = useTranslations('collectionConfirmation');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const wantsReject = searchParams.get('action') === 'reject';
  const [state, setState] = useState<State>('loading');
  const [info, setInfo] = useState<Info | null>(null);
  const [errorKey, setErrorKey] = useState('errorInvalidLink');

  useEffect(() => {
    if (!token) {
      setState('error');
      return;
    }
    api
      .get<Info>('/collection-request/confirmation', { params: { token } })
      .then(({ data }) => {
        setInfo(data);
        setState('ready');
      })
      .catch((err) => {
        setErrorKey(errorKeyForStatus((err as { response?: { status?: number } })?.response?.status, false));
        setState('error');
      });
  }, [token]);

  const act = async (reject: boolean) => {
    setState('busy');
    try {
      await api.post(reject ? '/collection-request/reject-collection' : '/collection-request/confirm-collection', {
        token,
      });
      setState(reject ? 'rejected' : 'confirmed');
    } catch (err) {
      setErrorKey(errorKeyForStatus((err as { response?: { status?: number } })?.response?.status, reject));
      setState('error');
    }
  };

  const day = info?.start ? format(new Date(info.start), 'dd/MM/yyyy') : null;
  const hours = info?.interval ? info.interval.replace(' - ', '–') : null;

  const primary = 'h-12 rounded-full px-6 text-[15px] font-semibold disabled:opacity-60';

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas p-4">
      <div className="flex w-full max-w-[440px] flex-col gap-5 rounded-2xl bg-white p-7 text-navy shadow-[0_1px_2px_rgba(1,51,100,0.06)]">
        <span className="text-[22px] font-bold">ReTeX:ID</span>
        {state === 'loading' ? <p className="text-sm text-ink">{t('loadingInfo')}</p> : null}

        {(state === 'ready' || state === 'busy') && info ? (
          <>
            <div>
              <h1 className="text-left text-[26px] font-bold leading-tight">
                {t('askTitle', { name: info.firstName ?? '' })}
              </h1>
              <p className="mt-1.5 text-[15px] text-ink">{t('askBody')}</p>
            </div>
            <dl className="grid grid-cols-2 gap-3 rounded-xl bg-canvas p-4 text-sm">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink">{t('day')}</dt>
                <dd className="text-[17px] font-semibold">{day ?? '—'}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink">{t('hours')}</dt>
                <dd className="text-[17px] font-semibold">{hours ?? '—'}</dd>
              </div>
              <div className="col-span-2">
                <dt className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink">{t('where')}</dt>
                <dd className="font-semibold">{[info.street, info.city].filter(Boolean).join(', ') || '—'}</dd>
              </div>
              <div className="col-span-2 font-mono text-[11px] text-ink">
                {[info.code, info.estimatedBags ? t('bags', { count: info.estimatedBags }) : null].filter(Boolean).join(' · ')}
              </div>
            </dl>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={state === 'busy'}
                onClick={() => act(false)}
                className={cn(primary, wantsReject ? 'border-[1.5px] border-navy bg-white text-navy' : 'bg-navy text-white')}
              >
                {t('confirmButton')}
              </button>
              <button
                type="button"
                disabled={state === 'busy'}
                onClick={() => act(true)}
                className={cn(
                  primary,
                  wantsReject ? 'bg-[#a12a1e] text-white' : 'text-[#a12a1e] underline underline-offset-2'
                )}
              >
                {t('rejectButton')}
              </button>
            </div>
          </>
        ) : null}

        {state === 'confirmed' ? <p className="text-[15px] font-semibold text-forest">{t('confirmSuccess')}</p> : null}
        {state === 'rejected' ? <p className="text-[15px] font-semibold text-forest">{t('rejectSuccess')}</p> : null}
        {state === 'error' ? <p className="text-[15px] text-[#a12a1e]">{t(errorKey)}</p> : null}
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
