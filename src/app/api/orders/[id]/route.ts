import { NextResponse } from 'next/server';
import { connectDB, OrderModel, MedicationModel } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import mongoose from 'mongoose';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'Auth' }, { status: 403 });

  await connectDB();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { status } = await req.json();
    const orderId = (await params).id;
    const oldOrder = await OrderModel.findById(orderId).session(session);

    if (!oldOrder) throw new Error('Order not found');

    if (status === 'CANCELLED' && oldOrder.status !== 'CANCELLED') {
      for (const item of oldOrder.items) {
        await MedicationModel.findByIdAndUpdate(item.medication, { $inc: { stock: item.quantity } }).session(session);
      }
    }
    else if (oldOrder.status === 'CANCELLED' && status !== 'CANCELLED') {
      for (const item of oldOrder.items) {
        const med = await MedicationModel.findById(item.medication).session(session);
        if (!med || med.stock < item.quantity) {
          throw new Error(`Недостатньо товару для відновлення замовлення: ${med?.name || 'невідомий'}`);
        }
        med.stock -= item.quantity;
        await med.save({ session });
      }
    }

    const updatedOrder = await OrderModel.findByIdAndUpdate(orderId, { status }, { new: true, session });
    await session.commitTransaction();
    return NextResponse.json(updatedOrder);
  } catch (error: unknown) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 400 });
  } finally {
    session.endSession();
  }
}
