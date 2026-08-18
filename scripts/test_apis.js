const fs = require('fs');

async function testApi(plan) {
  console.log(`Testing ${plan} API...`);
  try {
    const response = await fetch(`http://localhost:3000/api/contracts/${plan}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Kashif Turk',
        email: 'kashifturk014@gmail.com',
        date: 'August 18, 2026',
        sendEmail: true
      }),
    });

    const data = await response.json();
    if (response.ok) {
      console.log(`✅ ${plan} API returned successfully: ${data.message || 'ok'}`);
    } else {
      console.error(`❌ ${plan} API failed:`, data);
    }
  } catch (error) {
    console.error(`❌ ${plan} API Fetch Error:`, error);
  }
}

async function runAll() {
  await testApi('kickstarter');
  await testApi('nationwide');
  await testApi('global');
}

runAll();
