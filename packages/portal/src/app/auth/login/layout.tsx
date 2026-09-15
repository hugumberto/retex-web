import Image from 'next/image';
import '../../global.css';

export default function NoAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ver a nota em app/portal/layout.tsx: o <html>/<body> é do layout raiz.
  return (
    <>
      {/* Breadcrumbs */}

      <main className="relative min-h-[calc(100dvh-4rem)] flex flex-col ">
        <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>

        {/* Footer fixed at the bottom */}
        <footer className="w-full flex justify-center items-center py-6 mt-auto">
          <div className="flex flex-col items-center gap-1">
            <Image
              src="/assets/logo.png"
              alt="retex"
              height={28}
              width={100}
              className="h-7 opacity-90"
              priority
            />
            <span className="text-[11px] tracking-wide text-[#0b6b79]">
              wear. care. share. repeat.
            </span>
          </div>
        </footer>
      </main>
    </>
  );
}
