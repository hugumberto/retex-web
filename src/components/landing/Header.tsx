import React from "react";
import Image from "next/image";

export const Header = () => {
  return (
    <section className="flex justify-between items-center bg-white shadow-md">
      <div className="flex items-center bg-white p-12">
        <Image
          src="/assets/logo.png"
          alt="Logo"
          width={196}
          height={53}
          className="mr-2"
        />
      </div>
      <div>
        <nav className="flex justify-between items-center  pr-14 gap-14">
          <div className="flex items-center">Como Funciona</div>
          <div className="flex items-center">Sobre nós</div>
          <div className="flex items-center bg-gradient-horizontal text-white">
            Descobre Mais
          </div>
        </nav>
      </div>
    </section>
  );
};
