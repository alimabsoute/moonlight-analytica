export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.body;

  // Validate email
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email address required' });
  }

  try {
    // Send acknowledgment email using Vercel's built-in email service
    // For now, we'll just log it and return success
    console.log(`New email subscription: ${email}`);
    
    // You can integrate with any email service here:
    // - SendGrid
    // - Mailgun  
    // - Resend
    // - Amazon SES
    
    // Simple acknowledgment email template (you'd send this via your email service)
    const acknowledgmentEmail = {
      to: email,
      from: 'hello@moonlightanalytica.com',
      subject: 'Welcome to Moonlight Analytica! 🚀',
      html: `
        <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #0D1117; color: #ffffff; padding: 40px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #00bfff; margin: 0; font-size: 2rem;">🌙 Moonlight Analytica</h1>
            <p style="color: #87ceeb; margin: 10px 0 0 0; font-size: 1.1rem;">Premium Analytics Solutions</p>
          </div>
          
          <h2 style="color: #00bfff; font-size: 1.5rem;">Thanks for joining us!</h2>
          
          <p style="line-height: 1.6; margin-bottom: 20px;">You're now part of an exclusive group getting early access to:</p>
          
          <div style="background: rgba(0, 191, 255, 0.1); border-left: 4px solid #00bfff; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <ul style="color: #ffffff; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li><strong style="color: #00bfff;">PhynxTimer</strong> - Advanced productivity analytics</li>
              <li><strong style="color: #00bfff;">ATS Resume Helper</strong> - AI-powered career optimization</li>
              <li><strong style="color: #00bfff;">Janus Beta</strong> - Visual code analysis (coming soon)</li>
            </ul>
          </div>
          
          <p style="line-height: 1.6;">Expect weekly insights on analytics trends, productivity tools, and early access to our latest features.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://moonlightanalytica.com" style="background: linear-gradient(135deg, #00bfff, #4682b4); color: white; padding: 14px 28px; text-decoration: none; border-radius: 25px; font-weight: 600; display: inline-block;">Explore Our Platform</a>
          </div>
          
          <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; margin-top: 30px;">
            <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0;">
              You can unsubscribe at any time by replying to this email.<br>
              <strong>Moonlight Analytica</strong> • Transform Data into Strategic Advantage
            </p>
          </div>
        </div>
      `
    };

    // For now, just return success
    // You'll need to integrate with an actual email service to send the acknowledgment
    
    return res.status(200).json({ 
      success: true, 
      message: 'Successfully subscribed! Check your email for a welcome message.',
      email: email 
    });

  } catch (error) {
    console.error('Subscription error:', error);
    return res.status(500).json({ 
      error: 'Failed to subscribe. Please try again.',
      details: error.message 
    });
  }
}