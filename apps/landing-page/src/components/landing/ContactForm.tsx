"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";

export default function ContactForm() {
  const { register, handleSubmit } = useForm();

  const onSubmit = (data: unknown) => {
    console.log("Form data:", data);
  };

  return (
    <section className="bg-gradient-to-r from-cyan-700 to-blue-900 text-white py-16 px-4">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">Formulário</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            placeholder="Nome*"
            {...register("nome", { required: "Nome é obrigatório" })}
          />
          <Input
            placeholder="Email*"
            type="email"
            {...register("email", { required: "Email é obrigatório" })}
          />
          <Input
            placeholder="Telemóvel*"
            {...register("telefone", { required: "Telemóvel é obrigatório" })}
          />
          <Input
            placeholder="Assunto*"
            {...register("assunto", { required: "Assunto é obrigatório" })}
          />
          <Button type="submit">Submeter</Button>
        </form>
      </div>
    </section>
  );
}
