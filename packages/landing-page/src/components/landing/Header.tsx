'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import Link from 'next/link';

const ItemMenu = ({
  children,
  href,
  onClick,
}: {
  children: React.ReactNode;
  href: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement> | undefined;
}) => {
  return (
    <Link
      href={href}
      className="hover:bg-gradient-to-r text-primary hover:from-secondary hover:to-primary hover:text-white hover:border-transparent hover:p-4 hover:rounded-lg"
      onClick={onClick}
    >
      {children}
    </Link>
  );
};
const MobileMenu = () => {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<string | null>(null);
  useEffect(() => {
    if (!open && target) {
      setTimeout(() => {
        document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [open, target]);
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setOpen(false);
    setTarget(id);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(e) => {
        setOpen(e);
        setTarget(null);
      }}
    >
      <SheetTrigger className="md:hidden">
        <Menu className="h-8 w-8 " />
      </SheetTrigger>
      <SheetContent side="right" className="w-44 bg-white">
        <nav className="mt-12 ml-4 flex flex-col gap-4">
          <ItemMenu
            href="#how-it-works"
            onClick={(e) => handleClick(e, 'how-it-works')}
          >
            Como Funciona
          </ItemMenu>
          <ItemMenu
            href="#about-us"
            onClick={(e) => handleClick(e, 'about-us')}
          >
            Sobre nós
          </ItemMenu>
          <ItemMenu href="/faq">
            FAQ&apos;s
          </ItemMenu>
        </nav>
      </SheetContent>
    </Sheet>
  );
};
export const Header = () => {
  return (
    <header className="flex justify-between items-center bg-white shadow-md h-24  ">
      <div className="flex items-center bg-white md:p-12 md:ml-4">
        <Image
          src="/assets/logo.png"
          alt="Logo"
          width={196}
          height={53}
          className=" h-10 w-auto"
        />
      </div>
      <div>
        <nav className=" justify-between items-center hidden md:flex  mr-14 gap-14">
          <ItemMenu href="#how-it-works">Como Funciona</ItemMenu>
          <ItemMenu href="#about-us">Sobre nós</ItemMenu>
          <ItemMenu href="/faq">FAQ&apos;s</ItemMenu>
        </nav>
        <div className="md:hidden mr-4 mt-1">
          <MobileMenu />{' '}
        </div>
      </div>
    </header>
  );
};
