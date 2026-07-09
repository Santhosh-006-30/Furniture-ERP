import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { authenticateRequest } from '../../../../lib/auth-middleware';

export async function GET(req: Request) {
  const { errorResponse, user } = await authenticateRequest(req, ['CUSTOMER']);
  if (errorResponse) return errorResponse;

  try {
    const dbUser = await db.user.findUnique({ where: { id: user?.id } });
    if (!dbUser || !dbUser.isActive) {
      return NextResponse.json({ error: 'Account not active' }, { status: 403 });
    }

    const customer = await db.customer.findUnique({ where: { userId: dbUser.id } });
    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').trim();
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const pageSize = Math.max(1, Number(searchParams.get('pageSize') || 8));

    const whereClause: any = {
      customerId: customer.id,
    };

    if (search) {
      whereClause.product = {
        OR: [
          { name: { contains: search } },
          { sku: { contains: search } },
        ],
      };
    }

    const [wishlistItems, totalItems] = await Promise.all([
      db.wishlist.findMany({
        where: whereClause,
        include: {
          product: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.wishlist.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      wishlist: wishlistItems,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to retrieve wishlist' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { errorResponse, user } = await authenticateRequest(req, ['CUSTOMER']);
  if (errorResponse) return errorResponse;

  try {
    const dbUser = await db.user.findUnique({ where: { id: user?.id } });
    if (!dbUser || !dbUser.isActive) {
      return NextResponse.json({ error: 'Account not active' }, { status: 403 });
    }

    const customer = await db.customer.findUnique({ where: { userId: dbUser.id } });
    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const wishlistItem = await db.wishlist.upsert({
      where: {
        customerId_productId: {
          customerId: customer.id,
          productId: product.id,
        },
      },
      update: {},
      create: {
        customerId: customer.id,
        productId: product.id,
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json(wishlistItem);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add to wishlist' }, { status: 500 });
  }
}
