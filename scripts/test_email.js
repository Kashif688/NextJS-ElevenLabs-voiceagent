const emailToTest = "kashifturk014@gmail.com"; 

async function testEmail() {
  console.log(`Sending test email with new executive template to: ${emailToTest}...`);
  
  const testMessage = `Hi Kashif, Thank you for speaking with me today! It was wonderful hearing about your book concept, "Money is a need, not a goal."

As promised, here are our premium publishing plans for you to review:

1. Global Publishing Plan: $1,299 (Originally $1,899) - Professional Editing & Formatting - Custom Cover Design (front, spine, back) - Published on 10 major platforms (Amazon, Barnes & Noble, IngramSparks, Google Books, Apple Books, KOBO, Walmart, and more) - Copyrights Registration & Premium ISBN - Test Marketing Services (Complimentary) - 100% Ownership & 100% Royalties

2. Nationwide Publishing Plan: $899 (Originally $1,099) - Professional Editing & Formatting - Custom Cover Design - Published on 5 platforms (Amazon, IngramSparks, Barnes & Noble, KOBO, Walmart) - Premium ISBN - Test Marketing Services (Complimentary) - 100% Ownership & 100% Royalties

3. Kickstarter Publishing Kit: $599 (Originally $799) - Professional Editing & Formatting - Custom Cover Design - Published on Amazon - ISBN & Barcode - 100% Ownership & 100% Royalties

Please let me know which plan aligns best with your vision, and we can get started on bringing your book to life!

Warm regards,
Emma
Author Relations Team
Marketing And Publishing House`;

  try {
    const response = await fetch('https://next-js-eleven-labs-voiceagent.vercel.app/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        to: emailToTest,
        subject: 'Your Book Publishing Plans - Marketing And Publishing House',
        message: testMessage
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success! Beautiful executive email sent via Vercel.');
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
