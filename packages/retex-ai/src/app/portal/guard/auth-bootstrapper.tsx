'use client';
import { bootstrapAuth } from '@/service/auth';
import { useEffect } from 'react';

export default function AuthBootstrapper() {
  useEffect(() => { bootstrapAuth(); }, []);
  return null;
}
