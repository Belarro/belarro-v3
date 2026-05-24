import { prisma } from '../index';

async function testInvoicing() {
  console.log('\n=== INVOICING TESTS ===\n');

  try {
    // 1. Create test customer
    console.log('1. Creating test customer...');
    const customer = await prisma.customer.create({
      data: {
        name: 'Test Restaurant Invoice',
        email: 'test.invoice@restaurant.de',
        phone: '+49123456789',
        status: 'active',
      },
    });
    console.log('✓ Customer created:', customer.id);

    // 2. Create test crop
    console.log('2. Creating test crop...');
    const crop = await prisma.crop.create({
      data: {
        name_en: 'Arugula',
        name_de: 'Rucola',
        seeds_per_tray: 50,
        yield_per_tray: 100,
        total_growth_days: 10,
        seeding_schedule: 'FRIDAY',
        status: 'active',
        seed_inventory: { create: { quantity_grams: 500 } },
        sample_inventory: { create: { available_grams: 0 } },
      },
      include: { seed_inventory: true },
    });
    console.log('✓ Crop created:', crop.id);

    // 3. Create test variant
    console.log('3. Creating test product variant...');
    const variant = await prisma.productVariant.create({
      data: {
        crop_id: crop.id,
        size_name: '100g',
        size_grams: 100,
        price_eur: 12.50,
      },
    });
    console.log('✓ Variant created:', variant.id);

    // 4. Create test orders for this month
    console.log('4. Creating test orders...');
    const currentDate = new Date();
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    const order1 = await prisma.order.create({
      data: {
        customer_id: customer.id,
        product_variant_id: variant.id,
        quantity: 2,
        order_date: monthStart,
        status: 'pending_seed',
      },
    });
    console.log('✓ Order 1 created: 2 units × €12.50 = €25');

    const order2 = await prisma.order.create({
      data: {
        customer_id: customer.id,
        product_variant_id: variant.id,
        quantity: 3,
        order_date: monthStart,
        status: 'pending_seed',
      },
    });
    console.log('✓ Order 2 created: 3 units × €12.50 = €37.50');

    // 5. Generate invoice
    console.log('5. Generating invoice for this month...');
    const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    const invoiceRes = await fetch('http://localhost:3001/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: customer.id, invoice_month: monthStr }),
    });
    const invoiceData = await invoiceRes.json() as any;
    if (!invoiceRes.ok || !invoiceData.data) {
      throw new Error(`Invoice creation failed: ${JSON.stringify(invoiceData)}`);
    }
    console.log('✓ Invoice created:');
    console.log(`  - Orders found: ${invoiceData.details.order_count}`);
    console.log(`  - Subtotal: €${invoiceData.data.total_amount_eur}`);
    console.log(`  - VAT (19%): €${invoiceData.data.vat_amount_eur}`);
    console.log(`  - Total with VAT: €${invoiceData.data.total_amount_eur + invoiceData.data.vat_amount_eur}`);

    // 6. List invoices
    console.log('6. Listing invoices...');
    const listRes = await fetch(`http://localhost:3001/api/invoices?customer_id=${customer.id}`);
    const listData = await listRes.json() as any;
    console.log(`✓ Found ${listData.pagination.total} invoice(s)`);

    // 7. Update invoice status
    console.log('7. Updating invoice status to "sent"...');
    const updateRes = await fetch(`http://localhost:3001/api/invoices/${invoiceData.data.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'sent', sent_at: new Date().toISOString() }),
    });
    const updatedInvoice = await updateRes.json() as any;
    console.log(`✓ Invoice status updated: ${updatedInvoice.data.status}`);

    // Cleanup
    await prisma.order.deleteMany({ where: { customer_id: customer.id } });
    await prisma.invoice.deleteMany({ where: { customer_id: customer.id } });
    await prisma.productVariant.deleteMany({ where: { crop_id: crop.id } });
    await prisma.crop.delete({ where: { id: crop.id } });
    await prisma.customer.delete({ where: { id: customer.id } });

    console.log('\n✅ INVOICING TESTS PASSED\n');
  } catch (error) {
    console.error('❌ INVOICING TEST FAILED:', error);
    throw error;
  }
}

async function testStandingOrders() {
  console.log('\n=== STANDING ORDERS TESTS ===\n');

  try {
    // 1. Create test customer
    console.log('1. Creating test customer...');
    const customer = await prisma.customer.create({
      data: {
        name: 'Standing Order Restaurant',
        email: 'standing@restaurant.de',
        status: 'active',
      },
    });
    console.log('✓ Customer created:', customer.id);

    // 2. Create test crop and variants
    console.log('2. Creating test crop with variants...');
    const crop = await prisma.crop.create({
      data: {
        name_en: 'Basil',
        name_de: 'Basilikum',
        seeds_per_tray: 40,
        yield_per_tray: 80,
        total_growth_days: 14,
        seeding_schedule: 'TUESDAY',
        seed_inventory: { create: { quantity_grams: 500 } },
        sample_inventory: { create: { available_grams: 0 } },
      },
    });
    console.log('✓ Crop created:', crop.id);

    // Create multiple size variants
    const variant100 = await prisma.productVariant.create({
      data: { crop_id: crop.id, size_name: '100g', size_grams: 100, price_eur: 10 },
    });
    const variant225 = await prisma.productVariant.create({
      data: { crop_id: crop.id, size_name: '225g', size_grams: 225, price_eur: 18 },
    });
    console.log('✓ Variants created: 100g and 225g');

    // 3. Create standing order with multiple items
    console.log('3. Creating standing order...');
    const soRes = await fetch('http://localhost:3001/api/standing-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: customer.id,
        notes: 'Every Tuesday delivery',
        items: [
          { variant_id: variant100.id, size_name: '100g', quantity: 5, price_at_time_eur: 10, delivery_day_of_week: 2 },
          { variant_id: variant225.id, size_name: '225g', quantity: 3, price_at_time_eur: 18, delivery_day_of_week: 2 },
        ],
      }),
    });
    const soData = await soRes.json() as any;
    if (!soRes.ok || !soData.data) {
      throw new Error(`Standing order creation failed: ${JSON.stringify(soData)}`);
    }
    console.log('✓ Standing order created with 2 items');
    console.log(`  - Item 1: 5 × 100g @ €10`);
    console.log(`  - Item 2: 3 × 225g @ €18`);

    // 4. List standing orders
    console.log('4. Listing standing orders...');
    const listRes = await fetch(`http://localhost:3001/api/standing-orders?customer_id=${customer.id}`);
    const listData = await listRes.json() as any;
    console.log(`✓ Found ${listData.pagination.total} standing order(s)`);
    console.log(`  - Order has ${listData.data[0].items.length} items`);

    // 5. Update standing order status
    console.log('5. Updating standing order status to "paused"...');
    const updateRes = await fetch(`http://localhost:3001/api/standing-orders/${soData.data.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paused', notes: 'Paused until July' }),
    });
    const updated = await updateRes.json() as any;
    console.log(`✓ Status updated: ${updated.data.status}`);

    // 6. Resume standing order
    console.log('6. Resuming standing order...');
    const resumeRes = await fetch(`http://localhost:3001/api/standing-orders/${soData.data.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    });
    const resumed = await resumeRes.json() as any;
    console.log(`✓ Status resumed: ${resumed.data.status}`);

    // Cleanup
    await prisma.standingOrder.deleteMany({ where: { customer_id: customer.id } });
    await prisma.productVariant.deleteMany({ where: { crop_id: crop.id } });
    await prisma.crop.delete({ where: { id: crop.id } });
    await prisma.customer.delete({ where: { id: customer.id } });

    console.log('\n✅ STANDING ORDERS TESTS PASSED\n');
  } catch (error) {
    console.error('❌ STANDING ORDERS TEST FAILED:', error);
    throw error;
  }
}

async function runAllTests() {
  try {
    await testInvoicing();
    await testStandingOrders();
    console.log('\n🟢 ALL TESTS PASSED\n');
    process.exit(0);
  } catch (error) {
    console.error('\n🔴 TESTS FAILED\n');
    process.exit(1);
  }
}

// Run tests
runAllTests();
