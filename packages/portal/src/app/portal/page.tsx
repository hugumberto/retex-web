'use client';
import { useAppStore } from '@/store';
import { useEffect } from 'react';

export default function Index() {
  const { setPageTitle } = useAppStore();
  useEffect(() => {
    setPageTitle('Home');
  }, []);

  return (
    <div className="font-family-poppins">
      <div></div>
    </div>
  );
}
