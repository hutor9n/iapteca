import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h2 className="text-xl font-bold">404 - Сторінку не знайдено</h2>
      <Button asChild><Link href="/">На головну</Link></Button>
    </div>
  );
}
