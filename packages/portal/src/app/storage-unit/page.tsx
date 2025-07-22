import StorageUnit from "./storage-unit";

export default function Index() {
  return (
    <div className="font-family-poppins min-h-screen flex flex-col bg-gray-100">
      <main className="flex-grow">
        <StorageUnit />
      </main>
      <footer className="text-xs text-center text-white bg-gradient-to-r from-purple-600 to-indigo-600 py-6">
        <p>
          Política de Privacidade | Política de Cookies | Livro de Reclamações
          Online
        </p>
      </footer>
    </div>
  );
}