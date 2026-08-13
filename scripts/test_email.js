const emailToTest = "kashifturk014@gmail.com"; 

async function testEmail() {
  console.log(`Testing email route for: ${emailToTest}`);
  
  try {
    // We send a POST request to your LOCAL Next.js API route
    const response = await fetch('http://localhost:3000/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        to: emailToTest,
        subject: 'Test Email from Next.js!',
        message: 'Hello! If you are reading this, your Nodemailer setup with Gmail is working perfectly!'
      }),
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
