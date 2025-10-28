'use client';
import BlogForm from './blog-form';

export default function BlogPage() {
  return (
    <BlogForm
      onSave={() => {
        console.log('Blog post saved!');
      }}
    />
  );
}
