import StorageUnitForm from "./storage-unit";

export default function Index() {
  /*
   * Replace the elements below with your own.
   *
   * Note: The corresponding styles are in the ./index.tailwind file.
   */
  return (
    <div className="font-family-poppins">
      <div>
        <StorageUnitForm />
      </div>
      <footer className="text-xs text-center text-white  bg-gradient-horizontal py-6">
        <p>
          Política de Privacidade | Política de Cookies | Livro de Reclamações
          Online
        </p>
      </footer>
    </div>
  );
}
