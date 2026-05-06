import { NextResponse } from 'next/server';
import { connectDB, OrderModel, MedicationModel } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Auth' }, { status: 401 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const filter = user.role === 'ADMIN' && searchParams.get('admin') ? {} : { user: user._id };
  return NextResponse.json(await OrderModel.find(filter).sort({ createdAt: -1 }));
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Auth' }, { status: 401 });
  
  await connectDB();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, total } = await req.json();
    
    if (!items || items.length === 0) {
      throw new Error('Кошик порожній');
    }

    // Update stock and verify availability
    for (const item of items) {
      const med = await MedicationModel.findById(item.medication).session(session);
      if (!med || med.stock < item.quantity) {
        throw new Error(`Недостатньо товару: ${med?.name || 'невідомий препарат'}`);
      }
      med.stock -= item.quantity;
      await med.save({ session });
    }

    const order = await OrderModel.create([{
      user: user._id,
      items,
      total,
      status: 'PENDING'
    }], { session });

    await session.commitTransaction();
    return NextResponse.json(order[0]);
  } catch (error: unknown) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 400 });
  } finally {
    session.endSession();
  }
}
