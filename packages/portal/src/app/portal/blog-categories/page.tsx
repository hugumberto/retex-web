import { redirect } from 'next/navigation';

// As categorias passaram a ser um separador do blog.
export default function BlogCategoriesPage() {
  redirect('/portal/blog/categorias');
}
