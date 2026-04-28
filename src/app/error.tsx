'use client';
import { Button } from '@/components/ui/button';

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h2 className="text-xl font-bold">Щось пішло не так</h2>
      <Button onClick={() => reset()}>Спробувати знову</Button>
    </div>
  );
}
