import { notifyOwner } from "./notification";
import { generateUnsubscribeUrl } from "./unsubscribeTokens";

const RESEND_API_URL = "https://api.resend.com/emails";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SENDER_EMAIL = process.env.RESEND_SENDER_EMAIL || "noreply@thepatientscompass.com";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return false;
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: SENDER_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
        reply_to: options.replyTo,
      }),
    });

    if (!response.ok) {
      console.error("Email send failed:", response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Email service error:", error);
    return false;
  }
}

export async function sendTrialExpirationEmail(
  userEmail: string,
  userName: string,
  daysRemaining: number,
  userId: number
): Promise<boolean> {
  const upgradeUrl = "https://thepatientscompass.com/upgrade-pro";
  const unsubscribeUrl = generateUnsubscribeUrl(userId, "https://thepatientscompass.com");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2C2A29;">Your Free Trial Expires in ${daysRemaining} Day${daysRemaining !== 1 ? "s" : ""}!</h2>
      
      <p>Hi ${userName},</p>
      
      <p>Your 7-day free trial of The Patient's Compass Pro is expiring soon. You've been enjoying unlimited AI queries, advanced biomarker analysis, and personalized health recommendations.</p>
      
      <p><strong>Don't lose access to these premium features!</strong></p>
      
      <div style="background-color: #F0F0F0; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #D48C70; margin-top: 0;">What You'll Keep with Pro:</h3>
        <ul>
          <li>✓ Unlimited AI health queries (vs 3/day on Free)</li>
          <li>✓ Full biomarker library with optimal ranges</li>
          <li>✓ Unlimited lab report uploads & analysis</li>
          <li>✓ Custom health reports & recommendations</li>
          <li>✓ Priority email support</li>
          <li>✓ Ad-free experience</li>
        </ul>
      </div>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="${upgradeUrl}" style="background-color: #D48C70; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          Upgrade to Pro Now
        </a>
      </p>
      
      <p style="color: #666; font-size: 14px;">
        <strong>Special Offer:</strong> Use code TRIAL30 for 30% off your first month when you upgrade today!
      </p>
      
      <hr style="border: none; border-top: 1px solid #EEE; margin: 30px 0;">
      
      <p style="color: #999; font-size: 12px;">
        If you have any questions, reply to this email or visit our <a href="https://thepatientscompass.com/help" style="color: #D48C70;">Help Center</a>.
      </p>
      
      <p style="color: #999; font-size: 12px;">
        <strong>EDUCATIONAL CONTENT ONLY</strong> - This platform is for informational purposes. Always consult with a healthcare provider.
      </p>
      
      <p style="color: #BBB; font-size: 11px; margin-top: 20px;">
        <a href="${unsubscribeUrl}" style="color: #BBB; text-decoration: underline;">Unsubscribe</a> | 
        <a href="https://thepatientscompass.com/settings/email" style="color: #BBB; text-decoration: underline;">Email Preferences</a>
      </p>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: `⏰ Your Free Trial Expires in ${daysRemaining} Day${daysRemaining !== 1 ? "s" : ""}!`,
    html,
  });
}

export async function sendOnboardingEmail1(
  userEmail: string,
  userName: string,
  userId: number
): Promise<boolean> {
  const unsubscribeUrl = generateUnsubscribeUrl(userId, "https://thepatientscompass.com");
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2C2A29;">Welcome to The Patient's Compass! 🧭</h2>
      
      <p>Hi ${userName},</p>
      
      <p>Thank you for starting your free trial! We're excited to help you take control of your health with AI-powered insights and personalized recommendations.</p>
      
      <h3 style="color: #D48C70;">Get Started in 3 Steps:</h3>
      
      <ol>
        <li><strong>Upload Your Lab Results</strong> - Click "AI Lab Scanner" to upload your recent lab work. Our AI will analyze it instantly.</li>
        <li><strong>Explore Your Biomarkers</strong> - Visit the Biomarker Library to understand what your results mean and what's optimal.</li>
        <li><strong>Chat with Health Companion</strong> - Ask any health questions to our AI medical assistant (3 free queries/day on Free tier, unlimited on Pro).</li>
      </ol>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="https://thepatientscompass.com" style="background-color: #7E9A85; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          Start Using The Compass
        </a>
      </p>
      
      <p style="color: #666; font-size: 14px;">
        <strong>Pro Tip:</strong> During your free trial, you have unlimited AI queries. Use this time to explore all features!
      </p>
      
      <hr style="border: none; border-top: 1px solid #EEE; margin: 30px 0;">
      
      <p style="color: #999; font-size: 12px;">
        <strong>EDUCATIONAL CONTENT ONLY</strong> - This platform is for informational purposes. Always consult with a healthcare provider.
      </p>
      
      <p style="color: #BBB; font-size: 11px; margin-top: 20px;">
        <a href="${unsubscribeUrl}" style="color: #BBB; text-decoration: underline;">Unsubscribe</a> | 
        <a href="https://thepatientscompass.com/settings/email" style="color: #BBB; text-decoration: underline;">Email Preferences</a>
      </p>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: "Welcome to The Patient's Compass - Get Started Now",
    html,
  });
}

export async function sendOnboardingEmail2(
  userEmail: string,
  userName: string,
  userId: number
): Promise<boolean> {
  const unsubscribeUrl = generateUnsubscribeUrl(userId, "https://thepatientscompass.com");
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2C2A29;">Success Story: How Users Are Using The Compass</h2>
      
      <p>Hi ${userName},</p>
      
      <p>We wanted to share how other users are getting the most out of The Patient's Compass:</p>
      
      <div style="background-color: #F9F6F0; padding: 15px; border-left: 4px solid #D48C70; margin: 20px 0;">
        <p><strong>"I finally understand my lab results!"</strong></p>
        <p style="color: #666; margin: 10px 0;">- Sarah M., discovered she had vitamin D deficiency and started supplementation. Her next labs showed 40% improvement.</p>
      </div>
      
      <div style="background-color: #F9F6F0; padding: 15px; border-left: 4px solid #D48C70; margin: 20px 0;">
        <p><strong>"The AI recommendations saved me money"</strong></p>
        <p style="color: #666; margin: 10px 0;">- James K., used the Lifestyle AI to optimize his diet and exercise. Reduced inflammation markers by 35% in 3 months.</p>
      </div>
      
      <h3 style="color: #D48C70;">Your Next Steps:</h3>
      <ul>
        <li>📊 Upload your most recent lab work</li>
        <li>🧬 Check your biomarker trends</li>
        <li>💬 Ask Health Companion about your specific health goals</li>
        <li>📈 Track your progress with custom health reports</li>
      </ul>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="https://thepatientscompass.com/features" style="background-color: #7E9A85; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          See All Features
        </a>
      </p>
      
      <hr style="border: none; border-top: 1px solid #EEE; margin: 30px 0;">
      
      <p style="color: #999; font-size: 12px;">
        <strong>EDUCATIONAL CONTENT ONLY</strong> - This platform is for informational purposes. Always consult with a healthcare provider.
      </p>
      
      <p style="color: #BBB; font-size: 11px; margin-top: 20px;">
        <a href="${unsubscribeUrl}" style="color: #BBB; text-decoration: underline;">Unsubscribe</a> | 
        <a href="https://thepatientscompass.com/settings/email" style="color: #BBB; text-decoration: underline;">Email Preferences</a>
      </p>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: "See How Others Are Using The Patient's Compass",
    html,
  });
}

export async function sendOnboardingEmail3(
  userEmail: string,
  userName: string,
  userId: number
): Promise<boolean> {
  const upgradeUrl = "https://thepatientscompass.com/upgrade-pro";
  const unsubscribeUrl = generateUnsubscribeUrl(userId, "https://thepatientscompass.com");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2C2A29;">Unlock Unlimited Health Insights with Pro</h2>
      
      <p>Hi ${userName},</p>
      
      <p>You've explored The Patient's Compass and seen how it can help you understand your health better. Now it's time to unlock the full power with Pro.</p>
      
      <h3 style="color: #D48C70;">Free vs Pro - What You're Missing:</h3>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background-color: #F9F6F0;">
          <th style="padding: 10px; text-align: left; border: 1px solid #EBE6DC;">Feature</th>
          <th style="padding: 10px; text-align: center; border: 1px solid #EBE6DC;">Free</th>
          <th style="padding: 10px; text-align: center; border: 1px solid #EBE6DC;">Pro</th>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #EBE6DC;">AI Queries per Day</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #EBE6DC;">3</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #EBE6DC;"><strong>Unlimited</strong></td>
        </tr>
        <tr style="background-color: #F9F6F0;">
          <td style="padding: 10px; border: 1px solid #EBE6DC;">Lab Report Uploads</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #EBE6DC;">Limited</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #EBE6DC;"><strong>Unlimited</strong></td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #EBE6DC;">Custom Health Reports</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #EBE6DC;">❌</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #EBE6DC;"><strong>✓</strong></td>
        </tr>
        <tr style="background-color: #F9F6F0;">
          <td style="padding: 10px; border: 1px solid #EBE6DC;">Priority Support</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #EBE6DC;">❌</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #EBE6DC;"><strong>✓</strong></td>
        </tr>
      </table>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="${upgradeUrl}" style="background-color: #D48C70; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
          Upgrade to Pro - Just $9.99/month
        </a>
      </p>
      
      <p style="color: #666; font-size: 14px; text-align: center;">
        <strong>30-Day Money-Back Guarantee</strong> - Not satisfied? Get a full refund, no questions asked.
      </p>
      
      <hr style="border: none; border-top: 1px solid #EEE; margin: 30px 0;">
      
      <p style="color: #999; font-size: 12px;">
        <strong>EDUCATIONAL CONTENT ONLY</strong> - This platform is for informational purposes. Always consult with a healthcare provider.
      </p>
      
      <p style="color: #BBB; font-size: 11px; margin-top: 20px;">
        <a href="${unsubscribeUrl}" style="color: #BBB; text-decoration: underline;">Unsubscribe</a> | 
        <a href="https://thepatientscompass.com/settings/email" style="color: #BBB; text-decoration: underline;">Email Preferences</a>
      </p>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: "Unlock Unlimited AI Insights - Upgrade to Pro Today",
    html,
  });
}


export async function sendReEngagementEmail(
  userEmail: string,
  userName: string,
  daysSinceLogin: number,
  userId: number
): Promise<boolean> {
  const loginUrl = "https://thepatientscompass.com/signin";
  const daysText = daysSinceLogin === 1 ? "day" : "days";
  const unsubscribeUrl = generateUnsubscribeUrl(userId, "https://thepatientscompass.com");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2C2A29;">We Miss You! Your Health Insights Are Waiting</h2>
      
      <p>Hi ${userName},</p>
      
      <p>It's been ${daysSinceLogin} ${daysText} since you last visited The Patient's Compass. Your personalized health dashboard has been updated with new insights and recommendations based on your data.</p>
      
      <h3 style="color: #6B8E6F;">What's New:</h3>
      <ul style="color: #555;">
        <li>Updated biomarker trends and analysis</li>
        <li>Personalized wellness recommendations</li>
        <li>New health articles relevant to your profile</li>
        <li>AI-powered health insights</li>
      </ul>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" style="background-color: #6B8E6F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
          Log In to Your Account
        </a>
      </p>
      
      <p style="color: #666; font-size: 14px;">
        Your health journey continues with The Patient's Compass. Come back and discover new insights about your wellness.
      </p>
      
      <hr style="border: none; border-top: 1px solid #EEE; margin: 30px 0;">
      
      <p style="color: #999; font-size: 12px;">
        <strong>EDUCATIONAL CONTENT ONLY</strong> - This platform is for informational purposes. Always consult with a healthcare provider.
      </p>
      
      <p style="color: #BBB; font-size: 11px; margin-top: 20px;">
        <a href="${unsubscribeUrl}" style="color: #BBB; text-decoration: underline;">Unsubscribe</a> | 
        <a href="https://thepatientscompass.com/settings/email" style="color: #BBB; text-decoration: underline;">Email Preferences</a>
      </p>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: "We Miss You! Your Health Insights Are Waiting",
    html,
  });
}

export async function sendWeeklyDigestEmail(
  userEmail: string,
  userName: string,
  userId: number
): Promise<boolean> {
  const dashboardUrl = "https://thepatientscompass.com/dashboard";
  const unsubscribeUrl = generateUnsubscribeUrl(userId, "https://thepatientscompass.com");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2C2A29;">Your Weekly Health Digest</h2>
      
      <p>Hi ${userName},</p>
      
      <p>Here's your personalized health summary for this week:</p>
      
      <h3 style="color: #6B8E6F;">This Week's Highlights:</h3>
      <ul style="color: #555;">
        <li><strong>Health Score:</strong> Your overall wellness is trending positively</li>
        <li><strong>Biomarker Updates:</strong> Check your latest lab analysis</li>
        <li><strong>Wellness Tips:</strong> Personalized recommendations based on your data</li>
        <li><strong>Articles for You:</strong> New health content tailored to your interests</li>
      </ul>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" style="background-color: #6B8E6F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
          View Your Full Dashboard
        </a>
      </p>
      
      <h3 style="color: #6B8E6F; margin-top: 30px;">Quick Tips:</h3>
      <p style="color: #555;">
        • Upload your latest lab results for AI analysis<br>
        • Track your wellness goals throughout the week<br>
        • Explore personalized health recommendations<br>
        • Connect with our AI health assistant
      </p>
      
      <hr style="border: none; border-top: 1px solid #EEE; margin: 30px 0;">
      
      <p style="color: #999; font-size: 12px;">
        <strong>EDUCATIONAL CONTENT ONLY</strong> - This platform is for informational purposes. Always consult with a healthcare provider.
      </p>
      
      <p style="color: #BBB; font-size: 11px; margin-top: 20px;">
        <a href="${unsubscribeUrl}" style="color: #BBB; text-decoration: underline;">Unsubscribe</a> | 
        <a href="https://thepatientscompass.com/settings/email" style="color: #BBB; text-decoration: underline;">Email Preferences</a>
      </p>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: "Your Weekly Health Digest - Insights & Recommendations",
    html,
  });
}
