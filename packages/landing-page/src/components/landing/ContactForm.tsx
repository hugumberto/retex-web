'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';

type LandingFormValues = {
  nome: string;
  telemovel: string;
  email: string;
  titulo: string;
  mensagem: string;
};

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
      telemovel: '',
      email: '',
      titulo: '',
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

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.nome,
          phone: data.telemovel,
          email: data.email,
          title: data.titulo,
          message: data.mensagem,
        }),
      });
      if (!res.ok) throw new Error('Erro na requisição');
      setMessageTone('success');
      setMessage('Formulário enviado com sucesso!');
      reset();
    } catch {
      setMessageTone('error');
      setMessage('Erro ao enviar o formulário.');
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
          Email
          <span className="form-req">*</span>
        </span>
        <input
          type="email"
          autoComplete="email"
          className={errors.email ? 'field-error' : undefined}
          aria-invalid={errors.email ? true : undefined}
          {...register('email', {
            ...req,
            pattern: {
              value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
              message: 'Email inválido',
            },
          })}
        />
        {errors.email ? (
          <span className="form-field-error">{errors.email.message}</span>
        ) : null}
      </label>
      <label>
        <span className="form-label">
          Título
          <span className="form-req">*</span>
        </span>
        <input
          type="text"
          className={errors.titulo ? 'field-error' : undefined}
          aria-invalid={errors.titulo ? true : undefined}
          {...register('titulo', req)}
        />
        {errors.titulo ? (
          <span className="form-field-error">{errors.titulo.message}</span>
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
