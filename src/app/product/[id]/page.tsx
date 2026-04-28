import { connectDB, MedicationModel } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/ProductCard';
import Image from 'next/image';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const med = await MedicationModel.findById((await params).id).lean();
  if (!med || med.isDeleted) notFound();

  return (
    <div className="container mx-auto py-8 px-4 grid md:grid-cols-2 gap-8">
      <div className="aspect-square bg-muted rounded-xl flex items-center justify-center relative overflow-hidden">
        {med.image ? <Image src={med.image} alt={med.name} fill className="object-cover" /> : 'Немає фото'}
      </div>
      <div className="space-y-4">
        <Badge variant={med.stock > 0 ? 'secondary' : 'destructive'}>{med.stock > 0 ? 'В наявності' : 'Немає'}</Badge>
        <h1 className="text-3xl font-bold">{med.name}</h1>
        <p className="text-muted-foreground">{med.manufacturer}</p>
        <div className="text-2xl font-bold text-primary">{med.price} ₴</div>
        <p className="border-t pt-4">{med.description}</p>
        <ProductCard medication={JSON.parse(JSON.stringify(med))} />
      </div>
    </div>
  );
}
