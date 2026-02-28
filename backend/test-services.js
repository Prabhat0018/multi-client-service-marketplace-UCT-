require('dotenv').config();
const http = require('http');

// Helper to make HTTP requests
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
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  console.log('='.repeat(50));
  console.log('🧪 TESTING SERVICE APIs');
  console.log('='.repeat(50));
  
  try {
    // 1. Login as merchant
    console.log('\n1️⃣ Merchant Login...');
    const login = await request('POST', '/api/auth/merchant/login', {
      email: 'shop@gmail.com', password: '123456'
    });
    if (login.error) throw new Error(login.error);
    console.log('✅ Login successful!');
    const token = login.token;
    
    // 2. Create a service
    console.log('\n2️⃣ Creating service...');
    const create = await request('POST', '/api/merchant/services', {
      title: 'Home Cleaning',
      price: 99.99,
      duration: '2 hours',
      description: 'Professional home cleaning'
    }, token);
    if (create.error) throw new Error(create.error);
    console.log('✅ Service created:', create.message);
    const serviceId = create.service.service_id;
    console.log('   Service ID:', serviceId);
    
    // 3. Get all my services
    console.log('\n3️⃣ Getting all my services...');
    const myServices = await request('GET', '/api/merchant/services', null, token);
    if (myServices.error) throw new Error(myServices.error);
    console.log('✅ Found', myServices.count, 'services');
    myServices.services.forEach(s => {
      console.log('   -', s.title, '($' + s.price + ')');
    });
    
    // 4. Update service
    console.log('\n4️⃣ Updating service...');
    const update = await request('PUT', '/api/merchant/services/' + serviceId, {
      price: 149.99,
      description: 'Premium home cleaning service'
    }, token);
    if (update.error) throw new Error(update.error);
    console.log('✅', update.message);
    console.log('   New price: $' + update.service.price);
    
    // 5. Get single service
    console.log('\n5️⃣ Getting single service...');
    const single = await request('GET', '/api/merchant/services/' + serviceId, null, token);
    if (single.error) throw new Error(single.error);
    console.log('✅ Service:', single.title, '- $' + single.price);
    
    // 6. Delete service
    console.log('\n6️⃣ Deleting service...');
    const del = await request('DELETE', '/api/merchant/services/' + serviceId, null, token);
    if (del.error) throw new Error(del.error);
    console.log('✅', del.message);
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 ALL SERVICE CRUD TESTS PASSED!');
    console.log('='.repeat(50));
    
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
  }
  
  process.exit(0);
}

test();
