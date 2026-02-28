require('dotenv').config();
const http = require('http');

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) options.headers['Authorization'] = 'Bearer ' + token;
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } 
        catch (e) { resolve({ raw: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  console.log('='.repeat(60));
  console.log('🛒 TESTING CHECKOUT & ORDER APIs');
  console.log('='.repeat(60));
  
  try {
    // ============================================
    // SETUP: Get tokens and service ID
    // ============================================
    console.log('\n📋 SETUP: Getting tokens...');
    
    // Login as customer
    const customerLogin = await request('POST', '/api/auth/user/login', {
      email: 'tony@gmail.com', password: '123456'
    });
    if (customerLogin.error) throw new Error('Customer login failed: ' + customerLogin.error);
    const customerToken = customerLogin.token;
    console.log('✅ Customer logged in');
    
    // Login as merchant
    const merchantLogin = await request('POST', '/api/auth/merchant/login', {
      email: 'shop@gmail.com', password: '123456'
    });
    if (merchantLogin.error) throw new Error('Merchant login failed: ' + merchantLogin.error);
    const merchantToken = merchantLogin.token;
    console.log('✅ Merchant logged in');
    
    // Get a service to order
    const services = await request('GET', '/api/services');
    if (!services.services || services.services.length === 0) {
      throw new Error('No services available');
    }
    const service = services.services[0];
    console.log('✅ Found service:', service.title, '- $' + service.price);
    
    // ============================================
    // TEST 1: Create Order (Customer)
    // ============================================
    console.log('\n' + '-'.repeat(60));
    console.log('1️⃣ CUSTOMER: Create Order');
    console.log('-'.repeat(60));
    
    const createOrder = await request('POST', '/api/orders', {
      service_id: service.service_id,
      notes: 'Please arrive by 10 AM',
      scheduled_date: '2026-03-01 10:00:00'
    }, customerToken);
    
    if (createOrder.error) throw new Error('Create order failed: ' + createOrder.error);
    console.log('✅ Order created!');
    console.log('   Order ID:', createOrder.order.order_id);
    console.log('   Service:', createOrder.order.service.title);
    console.log('   Total:', '$' + createOrder.order.total_amount);
    console.log('   Status:', createOrder.order.order_status);
    
    const orderId = createOrder.order.order_id;
    
    // ============================================
    // TEST 2: Get My Orders (Customer)
    // ============================================
    console.log('\n' + '-'.repeat(60));
    console.log('2️⃣ CUSTOMER: Get My Orders');
    console.log('-'.repeat(60));
    
    const myOrders = await request('GET', '/api/orders', null, customerToken);
    console.log('✅ Found', myOrders.count, 'orders');
    myOrders.orders.forEach(o => {
      console.log('   📦', o.service_title, '-', o.order_status, '- $' + o.total_amount);
    });
    
    // ============================================
    // TEST 3: Get Single Order (Customer)
    // ============================================
    console.log('\n' + '-'.repeat(60));
    console.log('3️⃣ CUSTOMER: Get Order Details');
    console.log('-'.repeat(60));
    
    const orderDetails = await request('GET', '/api/orders/' + orderId, null, customerToken);
    if (orderDetails.error) throw new Error('Get order failed: ' + orderDetails.error);
    console.log('✅ Order Details:');
    console.log('   Service:', orderDetails.service_title);
    console.log('   Merchant:', orderDetails.business_name);
    console.log('   Status:', orderDetails.order_status);
    
    // ============================================
    // TEST 4: Merchant Views Orders
    // ============================================
    console.log('\n' + '-'.repeat(60));
    console.log('4️⃣ MERCHANT: View Incoming Orders');
    console.log('-'.repeat(60));
    
    const merchantOrders = await request('GET', '/api/merchant/orders', null, merchantToken);
    console.log('✅ Merchant has', merchantOrders.count, 'orders');
    merchantOrders.orders.forEach(o => {
      console.log('   📦', o.service_title, '- Customer:', o.customer_name, '- Status:', o.order_status);
    });
    
    // ============================================
    // TEST 5: Merchant Confirms Order
    // ============================================
    console.log('\n' + '-'.repeat(60));
    console.log('5️⃣ MERCHANT: Confirm Order');
    console.log('-'.repeat(60));
    
    const confirmOrder = await request('PUT', '/api/merchant/orders/' + orderId + '/status', {
      status: 'confirmed'
    }, merchantToken);
    
    if (confirmOrder.error) throw new Error('Confirm order failed: ' + confirmOrder.error);
    console.log('✅', confirmOrder.message);
    console.log('   Previous:', confirmOrder.previous_status, '→ New:', confirmOrder.new_status);
    
    // ============================================
    // TEST 6: Merchant Starts Work
    // ============================================
    console.log('\n' + '-'.repeat(60));
    console.log('6️⃣ MERCHANT: Start Work (In Progress)');
    console.log('-'.repeat(60));
    
    const startOrder = await request('PUT', '/api/merchant/orders/' + orderId + '/status', {
      status: 'in_progress'
    }, merchantToken);
    
    if (startOrder.error) throw new Error('Start order failed: ' + startOrder.error);
    console.log('✅', startOrder.message);
    
    // ============================================
    // TEST 7: Merchant Completes Order
    // ============================================
    console.log('\n' + '-'.repeat(60));
    console.log('7️⃣ MERCHANT: Complete Order');
    console.log('-'.repeat(60));
    
    const completeOrder = await request('PUT', '/api/merchant/orders/' + orderId + '/status', {
      status: 'completed'
    }, merchantToken);
    
    if (completeOrder.error) throw new Error('Complete order failed: ' + completeOrder.error);
    console.log('✅', completeOrder.message);
    
    // ============================================
    // TEST 8: Merchant Dashboard Stats
    // ============================================
    console.log('\n' + '-'.repeat(60));
    console.log('8️⃣ MERCHANT: Dashboard Stats');
    console.log('-'.repeat(60));
    
    const stats = await request('GET', '/api/merchant/orders/stats', null, merchantToken);
    console.log('✅ Merchant Stats:');
    console.log('   Total Orders:', stats.total_orders);
    console.log('   Pending:', stats.pending_orders);
    console.log('   Completed:', stats.completed_orders);
    console.log('   Total Earnings: $' + stats.total_earnings);
    
    // ============================================
    // TEST 9: Cancel Order (New Order)
    // ============================================
    console.log('\n' + '-'.repeat(60));
    console.log('9️⃣ CUSTOMER: Cancel Order (testing cancel flow)');
    console.log('-'.repeat(60));
    
    // Create new order to cancel
    const newOrder = await request('POST', '/api/orders', {
      service_id: service.service_id
    }, customerToken);
    
    const cancelResult = await request('PUT', '/api/orders/' + newOrder.order.order_id + '/cancel', null, customerToken);
    if (cancelResult.error) throw new Error('Cancel failed: ' + cancelResult.error);
    console.log('✅', cancelResult.message);
    
    // ============================================
    // COMPLETE
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL CHECKOUT & ORDER TESTS PASSED!');
    console.log('='.repeat(60));
    
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
  }
  
  process.exit(0);
}

test();
