'use client';

import { useForm, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

interface FormUserData {
  firstName: string;
  lastName: string;
  email: string;
  contactPhone: string;
  dayOfWeek: string;
  timeOfDay: string;
  nif: string;
  address: {
    street: string;
    number: string;
    complement: string;
    city: string;
    cityDivision: string;
    country: string;
    countryDivision: string;
    zipCode: string;
    lat: string;
    long: string;
  };
}

const diasDaSemana = [
  'Segunda-Feira',
  'Terça-Feira',
  'Quarta-Feira',
  'Quinta-Feira',
  'Sexta-Feira',
  'Sábado',
  'Domingo',
];
const turnos = ['Manhã', 'Tarde', 'Noite'];

export default function Formulario() {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormUserData>();
  const [formData, setFormData] = useState<FormUserData>();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: FormUserData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}package`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          address: {
            ...formData?.address,
            number: data.address.number,
            complement: data.address.complement,
          },
        }),
      });
      if (!res.ok) throw new Error('Erro na requisição');
      setMessage('Formulário enviado com sucesso!');
      reset();
      setValue('dayOfWeek', '');
      setValue('timeOfDay', '');
    } catch (e) {
      setMessage('Erro ao enviar o formulário.');
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlurPostalCode = async (
    e: React.FocusEvent<HTMLInputElement>
  ) => {
    const postalCode = e.target.value;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_TOMTOM_API_URL}${postalCode}.json?typeahead=false&limit=1&countrySet=pt&extendedPostalCodesFor=addr&minFuzzyLevel=1&maxFuzzyLevel=2&view=Unified&relatedPois=off&key=${process.env.NEXT_PUBLIC_TOMTOM_API_KEY}`
      );
      if (!res.ok) throw new Error('Erro ao buscar endereço');
      const { results } = await res.json();
      if (results.length === 0) {
        setMessage('Código postal não encontrado.');
        return;
      }
      const { address, position } = results[0];
      const {
        streetName,
        municipality,
        countrySubdivision,
        municipalitySubdivision,
        country,
      } = address;

      setValue('address.street', streetName);
      setValue('address.cityDivision', municipalitySubdivision);
      setValue('address.city', municipality);
      setValue('address.countryDivision', countrySubdivision);
      setValue('address.zipCode', postalCode);
      setValue('address.country', country);
      const { lat, lon } = position;
      setValue('address.lat', lat);
      setValue('address.long', lon);
      setFormData((prev) => ({
        firstName: prev?.firstName ?? '',
        lastName: prev?.lastName ?? '',
        email: prev?.email ?? '',
        contactPhone: prev?.contactPhone ?? '',
        dayOfWeek: prev?.dayOfWeek ?? '',
        timeOfDay: prev?.timeOfDay ?? '',
        nif: prev?.nif ?? '',
        address: {
          street: streetName,
          number: '',
          complement: '',
          city: municipality,
          cityDivision: municipalitySubdivision,
          country: country,
          countryDivision: countrySubdivision,
          zipCode: postalCode,
          lat: lat.toString(),
          long: lon.toString(),
        },
      }));
    } catch (error) {
      console.error('Erro ao buscar endereço', error);
    }
  };

  return (
    <section
      id="contact-form"
      className="bg-gradient-to-r from-cyan-700 to-blue-900 text-white py-16 px-4 flex flex-col items-center "
    >
      <h1 className="text-4xl md:text-5xl font-bold text-center ">
        Formulário
      </h1>
      <p className="max-w-lg text-center mt-8">
        Agenda a tua recolha e dá uma nova vida aos teus têxteis.
        <br /> Menos lixo no planeta, mais futuro para todos.
      </p>
      <div className="max-w-md mx-auto bg-white rounded-2xl min-w-80 md:min-w-2xl shadow-lg mt-8 p-2 md:p-6 text-black">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className=" flex flex-col items-center mt-4 md:mt-0"
        >
          <div className="md:min-w-xl max-w-2xl mx-auto p-2 md:p-4 space-y-4">
            {message && (
              <p className="text-center text-sm text-gray-700">{message}</p>
            )}

            {/* Nome e Apelido */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full">
                <Input
                  placeholder="Nome*"
                  className={errors.firstName ? 'border-red-500' : ''}
                  {...register('firstName', { required: 'Campo obrigatório' })}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">Campo obrigatório</p>
                )}
              </div>
              <div className="w-full">
                <Input
                  placeholder="Apelido*"
                  className={errors.lastName ? 'border-red-500' : ''}
                  {...register('lastName', { required: 'Campo obrigatório' })}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">Campo obrigatório</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <Input
                placeholder="Email*"
                type="email"
                className={errors.email ? 'border-red-500' : ''}
                {...register('email', { required: 'Campo obrigatório' })}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">Campo obrigatório</p>
              )}
            </div>

            {/* Contacto e NIF */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full">
                <Input
                  placeholder="Contacto*"
                  className={errors.contactPhone ? 'border-red-500' : ''}
                  {...register('contactPhone', {
                    required: 'Campo obrigatório',
                  })}
                />
                {errors.contactPhone && (
                  <p className="text-red-500 text-xs mt-1">Campo obrigatório</p>
                )}
              </div>
              <div className="w-full">
                <Input
                  placeholder="NIF*"
                  className={errors.nif ? 'border-red-500' : ''}
                  {...register('nif', { required: 'Campo obrigatório' })}
                />
                {errors.nif && (
                  <p className="text-red-500 text-xs mt-1">Campo obrigatório</p>
                )}
              </div>
            </div>

            {/* Dia da semana e turno */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full">
                <Controller
                  name="dayOfWeek"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger
                          className={errors.dayOfWeek ? 'border-red-500' : ''}
                        >
                          <SelectValue placeholder="Dia da Semana*" />
                        </SelectTrigger>
                        <SelectContent>
                          {diasDaSemana.map((dia) => (
                            <SelectItem key={dia} value={dia}>
                              {dia}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                />
              </div>

              <div className="w-full">
                <Controller
                  name="timeOfDay"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger
                          className={errors.timeOfDay ? 'border-red-500' : ''}
                        >
                          <SelectValue placeholder="Turno" />
                        </SelectTrigger>
                        <SelectContent>
                          {turnos.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                />
              </div>
            </div>

            {/* Código Postal */}
            <div>
              <Input
                placeholder="Código Postal"
                className={`w-44 ${
                  errors.address?.zipCode ? 'border-red-500' : ''
                }`}
                {...register('address.zipCode', {
                  required: 'Campo obrigatório',
                })}
                onBlur={handleBlurPostalCode}
              />
              {errors.address?.zipCode && (
                <p className="text-red-500 text-xs mt-1">Campo obrigatório</p>
              )}
            </div>

            {/* Morada e Endereço */}
            <Input
              placeholder="Morada"
              disabled
              {...register('address.street')}
            />

            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Freguesia"
                disabled
                {...register('address.cityDivision')}
              />
              <Input
                placeholder="Concelho"
                disabled
                {...register('address.city')}
              />
              <Input
                placeholder="Distrito"
                disabled
                {...register('address.countryDivision')}
              />
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full">
                <Input
                  placeholder="Nº edifício/porta*"
                  {...register('address.number')}
                />
                {errors.address?.number && (
                  <p className="text-red-500 text-xs mt-1">Campo obrigatório</p>
                )}
              </div>
              <Input
                placeholder="Complemento Morada (opcional)"
                {...register('address.complement')}
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-64 text-md bg-gradient-horizontal mt-8 p-4 pt-6 pb-6 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Submeter'
            )}
          </Button>
        </form>
      </div>
    </section>
  );
}
