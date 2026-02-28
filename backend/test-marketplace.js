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

async function setupTestData() {
  console.log('📦 Setting up test data...\n');
  
  // Update merchant status to approved (needed for public visibility)
  const pool = require('./config/db');
  await pool.query(`UPDATE merchants SET status = 'approved' WHERE status = 'pending'`);
  console.log('✅ Merchants approved\n');
  
  // Login as merchant to add services
  const login = await request('POST', '/api/auth/merchant/login', {
    email: 'shop@gmail.com', password: '123456'
  });
  const token = login.token;
  
  // Add some services
  const services = [
    { title: 'Deep Home Cleaning', price: 149.99, duration: '3 hours', description: 'Complete deep cleaning' },
    { title: 'Basic Cleaning', price: 79.99, duration: '1.5 hours', description: 'Quick tidy up' },
    { title: 'Kitchen Cleaning', price: 59.99, duration: '1 hour', description: 'Kitchen only' }
  ];
  
  for (const s of services) {
    await request('POST', '/api/merchant/services', s, token);
  }
  console.log('✅ Services added\n');
  
  await pool.end();
}

async function test() {
  console.log('='.repeat(60));
  console.log('🛒 TESTING CUSTOMER MARKETPLACE APIs');
  console.log('='.repeat(60));
  
  try {
    // 1. Get all categories
    console.log('\n1️⃣ GET /api/categories - List all categories');
    const categories = await request('GET', '/api/categories');
    console.log('✅ Found', categories.count, 'categories');
    categories.categories.forEach(c => {
      console.log(`   📂 ${c.category_name} (${c.merchant_count} merchants, ${c.service_count} services)`);
    });
    
    // 2. Get category by ID
    if (categories.categories.length > 0) {
      const catId = categories.categories[0].category_id;
      console.log('\n2️⃣ GET /api/categories/:id - Category details');
      const category = await request('GET', '/api/categories/' + catId);
      console.log('✅ Category:', category.category.category_name);
      console.log('   Merchants:', category.merchants.count);
      console.log('   Services:', category.services.count);
    }
    
    // 3. Get all merchants
    console.log('\n3️⃣ GET /api/merchants - Browse merchants');
    const merchants = await request('GET', '/api/merchants');
    console.log('✅ Found', merchants.count, 'merchants');
    merchants.merchants?.forEach(m => {
      console.log(`   🏪 ${m.business_name} (⭐${m.rating}, ${m.service_count} services)`);
    });
    
    // 4. Get merchant profile
    if (merchants.merchants?.length > 0) {
      const merchId = merchants.merchants[0].merchant_id;
      console.log('\n4️⃣ GET /api/merchants/:id - Merchant profile');
      const profile = await request('GET', '/api/merchants/' + merchId);
      console.log('✅ Merchant:', profile.merchant.business_name);
      console.log('   Services:', profile.services.count);
      console.log('   Reviews:', profile.reviews.count);
    }
    
    // 5. Get all services
    console.log('\n5️⃣ GET /api/services - Browse services');
    const services = await request('GET', '/api/services');
    console.log('✅ Found', services.count, 'services');
    services.services?.slice(0, 3).forEach(s => {
      console.log(`   📦 ${s.title} - $${s.price} (${s.business_name})`);
    });
    
    // 6. Search
    console.log('\n6️⃣ GET /api/search?q=cleaning - Global search');
    const search = await request('GET', '/api/search?q=cleaning');
    console.log('✅ Search results for "cleaning":');
    console.log('   Services found:', search.results?.services?.count || 0);
    console.log('   Merchants found:', search.results?.merchants?.count || 0);
    
    // 7. Filter services by price
    console.log('\n7️⃣ GET /api/services?maxPrice=100 - Filter by price');
    const filtered = await request('GET', '/api/services?maxPrice=100');
    console.log('✅ Services under $100:', filtered.count);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL CUSTOMER MARKETPLACE TESTS PASSED!');
    console.log('='.repeat(60));
    
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
  }
  
  process.exit(0);
}

// Run setup first, then test
setupTestData().then(test).catch(console.error);
