const emailToTest = process.env.TEST_EMAIL || "kashifturk014@gmail.com";
const nameToTest = process.env.TEST_NAME || "Kashif";

async function testEmail() {
  const targetUrl = process.env.API_URL || 'https://next-js-eleven-labs-voiceagent.vercel.app/api/send-email';
  console.log(`Sending test email with executive template to: ${emailToTest} (Name: ${nameToTest})...`);
  console.log(`Target endpoint: ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: emailToTest,
        name: nameToTest,
        subject: 'Your Book Publishing Proposal - Marketing And Publishing House'
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Success! Beautiful executive email sent.');
      console.log(data);
    } else {
      console.error('❌ Failed to send email.');
      console.error(data);
    }
  } catch (error) {
    console.error('❌ Error during fetch:', error);
  }
}

testEmail();
