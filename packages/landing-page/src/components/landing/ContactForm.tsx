'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';

type LandingFormValues = {
  nome: string;
  nif: string;
  email: string;
  telemovel: string;
  local: string;
  horario: string;
  mensagem: string;
};

function isApiError(err: unknown): err is { message?: string; error?: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    ('message' in err || 'error' in err)
  );
}

function inferDayOfWeek(horario: string): string {
  const h = horario.toLowerCase();
  const patterns: [string, string][] = [
    ['segunda', 'Segunda-Feira'],
    ['terça', 'Terça-Feira'],
    ['terca', 'Terça-Feira'],
    ['quarta', 'Quarta-Feira'],
    ['quinta', 'Quinta-Feira'],
    ['sexta', 'Sexta-Feira'],
    ['sábado', 'Sábado'],
    ['sabado', 'Sábado'],
    ['domingo', 'Domingo'],
  ];
  for (const [kw, day] of patterns) {
    if (h.includes(kw)) return day;
  }
  return 'Sábado';
}

function inferTimeOfDay(horario: string): string {
  const h = horario.toLowerCase();
  if (h.includes('manhã') || h.includes('manha')) return 'Manhã';
  if (h.includes('tarde')) return 'Tarde';
  if (h.includes('noite')) return 'Noite';
  return 'Tarde';
}

function splitName(nome: string): { firstName: string; lastName: string } {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '-' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export default function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LandingFormValues>({
    mode: 'onChange',
    defaultValues: {
      nome: '',
      nif: '',
      email: '',
      telemovel: '',
      local: '',
      horario: '',
      mensagem: '',
    },
  });
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'success' | 'error'>('success');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: LandingFormValues) => {
    setIsSubmitting(true);
    setMessage('');
    setMessageTone('success');
    const { firstName, lastName } = splitName(data.nome);
    const complement = [
      `Horário indicado: ${data.horario}`,
      `Mensagem: ${data.mensagem}`,
    ].join('\n\n');

    const body = {
      firstName,
      lastName,
      email: data.email,
      contactPhone: data.telemovel,
      nif: data.nif,
      dayOfWeek: inferDayOfWeek(data.horario),
      timeOfDay: inferTimeOfDay(data.horario),
      address: {
        street: data.local,
        number: 's/n',
        complement,
        city: 'N/D',
        cityDivision: 'N/D',
        country: 'Portugal',
        countryDivision: 'N/D',
        zipCode: '0000-000',
        lat: '0',
        long: '0',
      },
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}package`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 409) {
        setMessageTone('success');
        setMessage('Formulário enviado com sucesso!');
        reset();
        return;
      }
      if (!res.ok) throw new Error('Erro na requisição');
      setMessageTone('success');
      setMessage('Formulário enviado com sucesso!');
      reset();
    } catch (e: unknown) {
      if (isApiError(e) && e.error === 'Conflict') {
        setMessageTone('success');
        setMessage('Formulário enviado com sucesso!');
        reset();
      } else {
        setMessageTone('error');
        setMessage('Erro ao enviar o formulário.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const req = { required: 'Campo obrigatório' as const };

  return (
    <form className="landing-form-card" onSubmit={handleSubmit(onSubmit)} noValidate>
      {message ? (
        <p
          className={
            messageTone === 'error'
              ? 'landing-form-feedback landing-form-feedback--error'
              : 'landing-form-feedback'
          }
        >
          {message}
        </p>
      ) : null}
      <div className="form-row">
        <label>
          <span className="form-label">
            Nome
            <span className="form-req">*</span>
          </span>
          <input
            type="text"
            autoComplete="name"
            className={errors.nome ? 'field-error' : undefined}
            aria-invalid={errors.nome ? true : undefined}
            {...register('nome', req)}
          />
          {errors.nome ? (
            <span className="form-field-error">{errors.nome.message}</span>
          ) : null}
        </label>
        <label>
          <span className="form-label">
            NIF
            <span className="form-req">*</span>
          </span>
          <input
            type="text"
            autoComplete="off"
            className={errors.nif ? 'field-error' : undefined}
            aria-invalid={errors.nif ? true : undefined}
            {...register('nif', req)}
          />
          {errors.nif ? (
            <span className="form-field-error">{errors.nif.message}</span>
          ) : null}
        </label>
      </div>
      <div className="form-row">
        <label>
          <span className="form-label">
            Email
            <span className="form-req">*</span>
          </span>
          <input
            type="email"
            autoComplete="email"
            className={errors.email ? 'field-error' : undefined}
            aria-invalid={errors.email ? true : undefined}
            {...register('email', req)}
          />
          {errors.email ? (
            <span className="form-field-error">{errors.email.message}</span>
          ) : null}
        </label>
        <label>
          <span className="form-label">
            Telemóvel
            <span className="form-req">*</span>
          </span>
          <input
            type="tel"
            autoComplete="tel"
            className={errors.telemovel ? 'field-error' : undefined}
            aria-invalid={errors.telemovel ? true : undefined}
            {...register('telemovel', req)}
          />
          {errors.telemovel ? (
            <span className="form-field-error">{errors.telemovel.message}</span>
          ) : null}
        </label>
      </div>
      <label>
        <span className="form-label">
          Local de recolha
          <span className="form-req">*</span>
        </span>
        <input
          type="text"
          placeholder="Rua Eng. Duarte Pacheco, nº33 1º Dto 4470-136 Maia"
          className={errors.local ? 'field-error' : undefined}
          aria-invalid={errors.local ? true : undefined}
          {...register('local', req)}
        />
        {errors.local ? (
          <span className="form-field-error">{errors.local.message}</span>
        ) : null}
      </label>
      <label>
        <span className="form-label">
          Horário de recolha
          <span className="form-req">*</span>
        </span>
        <input
          type="text"
          className={errors.horario ? 'field-error' : undefined}
          aria-invalid={errors.horario ? true : undefined}
          {...register('horario', req)}
        />
        {errors.horario ? (
          <span className="form-field-error">{errors.horario.message}</span>
        ) : null}
      </label>
      <label>
        <span className="form-label">
          Mensagem
          <span className="form-req">*</span>
        </span>
        <textarea
          rows={5}
          className={errors.mensagem ? 'field-error' : undefined}
          aria-invalid={errors.mensagem ? true : undefined}
          {...register('mensagem', req)}
        />
        {errors.mensagem ? (
          <span className="form-field-error">{errors.mensagem.message}</span>
        ) : null}
      </label>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'A enviar…' : 'Submeter'}
      </button>
    </form>
  );
}
