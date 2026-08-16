import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import OrderModel from '@/lib/models/Order';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    if (orderId) {
      const order = await OrderModel.findOne({ id: orderId }).lean();
      if (order) {
        return NextResponse.json({ success: true, order });
      }
    }

    const orders = await OrderModel.find({}).sort({ created_at: -1 }).lean();
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('Failed to fetch orders from MongoDB:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const orderData = {
      id: body.id || `ZLAG-${Math.floor(100000 + Math.random() * 900000)}`,
      customer_name: body.customerName || body.customer_name || 'Valued Customer',
      customer_email: body.customerEmail || body.email || '',
      customer_phone: body.customerPhone || body.phone || '',
      secondary_phone: body.secondaryPhone || body.secondary_phone || '',
      shipping_address: body.shippingAddress || body.address || '',
      payment_method: body.paymentMethod || body.payment_method || 'bank-transfer',
      payment_slip_url: body.paymentSlipUrl || body.payment_slip_url || body.bankSlipUrl || '',
      paymentSlipUrl: body.paymentSlipUrl || body.payment_slip_url || body.bankSlipUrl || '',
      shipping_method: body.shippingMethod || body.shipping_method || 'Trans Express',
      items: body.items || [],
      subtotal: body.subtotalLkr || body.subtotal || 0,
      shipping_fee: body.shippingFee || body.shippingLkr || body.shipping_fee || 0,
      total_amount: body.totalLkr || body.totalAmount || body.total_amount || 0,
      status: body.orderStatus || body.status || 'Pending',
    };

    const newOrder = await OrderModel.create(orderData);
    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (error) {
    console.error('Failed to create order in MongoDB:', error);
    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { id, status, paymentStatus, courier, trackingNumber } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const updateFields: Record<string, unknown> = {};
    if (status) updateFields.status = status;
    if (paymentStatus) updateFields.payment_status = paymentStatus;
    if (courier !== undefined) updateFields.courier = courier;
    if (trackingNumber !== undefined) updateFields.tracking_number = trackingNumber;

    const updatedOrder = await OrderModel.findOneAndUpdate(
      { id },
      { $set: updateFields },
      { new: true }
    );

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Failed to update order in MongoDB:', error);
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
  }
}
