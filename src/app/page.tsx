import { connectDB, MedicationModel } from '@/lib/db';
import { ProductCard } from '@/components/ProductCard';
import { SearchAndFilters } from '@/components/SearchAndFilters';
import { Pagination } from '@/components/Pagination';
import { Suspense } from 'react';
import { Medication } from '@/lib/types';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await connectDB();
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const limit = 20;
  const filter: Record<string, unknown> = { isDeleted: { $ne: true } };
  if (sp.search) {
    filter.name = { $regex: sp.search, $options: 'i' };
    logger.info('medications.searched', { query: sp.search });
  }
  if (sp.category) filter.category = sp.category;
  if (sp.inStock === 'true') filter.stock = { $gt: 0 };

  const sort: Record<string, 1 | -1> = sp.sort === 'price_asc' ? { price: 1 } : sp.sort === 'price_desc' ? { price: -1 } : { createdAt: -1 };
  const total = await MedicationModel.countDocuments(filter);
  const medications = (await MedicationModel.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean()) as unknown as Medication[];

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <h1 className="text-2xl font-bold">Каталог iApteca</h1>
      <Suspense><SearchAndFilters /></Suspense>
      <div className="text-sm opacity-70">Знайдено: {total}</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {medications.map((m) => <ProductCard key={m._id.toString()} medication={JSON.parse(JSON.stringify(m)) as Medication} />)}
        {medications.length === 0 && <p className="col-span-full py-10 text-center">Немає товарів</p>}
      </div>
      <Pagination currentPage={page} totalPages={Math.ceil(total / limit)} />
    </div>
  );
}
