const emailToTest = "kashifturk014@gmail.com"; 

async function testEmail() {
  console.log(`Testing email route for: ${emailToTest} on live Vercel domain...`);
  
  try {
    // We send a POST request to your LIVE Vercel API route
    const response = await fetch('https://next-js-eleven-labs-voiceagent.vercel.app/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        to: emailToTest,
        subject: 'Test Email from VoiceAgent Vercel deployment!',
        message: 'Hello! Your Nodemailer setup hosted on Vercel is working successfully!'
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success! Email sent via Vercel.');
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
