import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import OrderModel from '@/lib/models/Order';
import { checkAdminAuthorization } from '@/lib/adminAuth';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const rawOrderId = searchParams.get('order_id');
    const orderId = rawOrderId ? String(rawOrderId).trim() : null;
    const pageParam = String(searchParams.get('page') || '').trim();
    const limitParam = String(searchParams.get('limit') || '').trim();
    const statusParam = String(searchParams.get('status') || '').trim();
    const searchParam = String(searchParams.get('search') || '').trim();

    if (orderId) {
      const order = await OrderModel.findOne({ id: orderId }).lean();
      if (order) {
        return NextResponse.json({ success: true, order });
      }
    }

    const filter: Record<string, any> = {};
    if (statusParam && statusParam !== 'all') {
      filter.status = statusParam;
    }
    if (searchParam) {
      const sanitizedQ = searchParam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { id: { $regex: sanitizedQ, $options: 'i' } },
        { customer_name: { $regex: sanitizedQ, $options: 'i' } },
        { customer_email: { $regex: sanitizedQ, $options: 'i' } },
        { customer_phone: { $regex: sanitizedQ, $options: 'i' } }
      ];
    }

    const totalCount = await OrderModel.countDocuments(filter);

    const isPaginated = Boolean(pageParam || limitParam);
    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : (isPaginated ? 10 : (totalCount || 1000));
    const skip = (page - 1) * limit;

    let query = OrderModel.find(filter).sort({ created_at: -1 });
    if (isPaginated) {
      query = query.skip(skip).limit(limit);
    }

    const orders = await query.lean();
    const totalPages = Math.ceil(totalCount / limit) || 1;

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages
      }
    });
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
      id: String(body.id || `ZLAG-${Math.floor(100000 + Math.random() * 900000)}`),
      customer_name: String(body.customerName || body.customer_name || 'Valued Customer'),
      customer_email: String(body.customerEmail || body.email || ''),
      customer_phone: String(body.customerPhone || body.phone || ''),
      secondary_phone: String(body.secondaryPhone || body.secondary_phone || ''),
      shipping_address: String(body.shippingAddress || body.address || ''),
      payment_method: String(body.paymentMethod || body.payment_method || 'bank-transfer'),
      payment_slip_url: String(body.paymentSlipUrl || body.payment_slip_url || body.bankSlipUrl || ''),
      paymentSlipUrl: String(body.paymentSlipUrl || body.payment_slip_url || body.bankSlipUrl || ''),
      shipping_method: String(body.shippingMethod || body.shipping_method || 'Trans Express'),
      items: Array.isArray(body.items) ? body.items : [],
      subtotal: Number(body.subtotalLkr || body.subtotal) || 0,
      shipping_fee: Number(body.shippingFee || body.shippingLkr || body.shipping_fee) || 0,
      total_amount: Number(body.totalLkr || body.totalAmount || body.total_amount) || 0,
      status: String(body.orderStatus || body.status || 'Pending'),
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
    if (!(await checkAdminAuthorization())) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();
    const id = String(body.id || '').trim();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const updateFields: Record<string, unknown> = {};
    if (body.status) updateFields.status = String(body.status);
    if (body.paymentStatus) updateFields.payment_status = String(body.paymentStatus);
    if (body.courier !== undefined) updateFields.courier = String(body.courier);
    if (body.trackingNumber !== undefined) updateFields.tracking_number = String(body.trackingNumber);

    const updatedOrder = await OrderModel.findOneAndUpdate(
      { id },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Failed to update order in MongoDB:', error);
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
  }
}
