const emailToTest = "developer.3knots@gmail.com"; // <-- IMPORTANT: Replace this with your actual email address

async function testEmail() {
  console.log(`Testing email route for: ${emailToTest}`);
  
  try {
    // We send a POST request to our Next.js API route just like ElevenLabs would
    const response = await fetch('http://localhost:3000/api/elevenlabs/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email_address: emailToTest }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success! Email sent.');
      console.log(data);
    } else {
      console.error('❌ Failed to send email.');
      console.error(data);
    }
  } catch (error) {
    console.error('❌ Error during fetch. Make sure your Next.js server is running on localhost:3000!', error);
  }
}

testEmail();
