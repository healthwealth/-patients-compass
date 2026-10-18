import { sendEmail } from "./email";
import { getUnsubscribeLink } from "./unsubscribeHandler";

/**
 * Welcome Email Sequence Templates
 * 3-email sequence over 7 days for new sign-ups
 */

export interface WelcomeEmailContext {
  userName: string;
  userEmail: string;
  userId: number;
}

/**
 * Email 1: Welcome + Popular Books (Day 0)
 * Sent immediately after sign-up
 */
export async function sendWelcomeEmail1(context: WelcomeEmailContext): Promise<boolean> {
  const { userName, userEmail } = context;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b9d83 0%, #d4c5b9 100%); padding: 30px; border-radius: 8px; color: white; text-align: center; }
    .content { padding: 30px 0; }
    .section { margin: 20px 0; }
    .book-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .book-card { border: 1px solid #e0e0e0; padding: 15px; border-radius: 6px; text-align: center; }
    .book-card img { max-width: 100%; height: 150px; object-fit: cover; border-radius: 4px; }
    .book-title { font-weight: 600; margin-top: 10px; font-size: 14px; }
    .cta-button { display: inline-block; background: #8b9d83; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 10px 5px 10px 0; }
    .footer { border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to The Patient's Compass</h1>
      <p>Your Health Intelligence System</p>
    </div>

    <div class="content">
      <p>Hi ${userName || "there"},</p>

      <p>Welcome to <strong>The Patient's Compass</strong>! We're thrilled to have you join our community of health-conscious individuals who are taking control of their wellness journey.</p>

      <div class="section">
        <h2>🎯 What You Can Do Now</h2>
        <ul>
          <li><strong>Analyze Lab Results</strong> — Upload your lab reports and get AI-powered insights into your biomarkers</li>
          <li><strong>Explore Biomarker Library</strong> — Understand what your test results really mean</li>
          <li><strong>Get Personalized Recommendations</strong> — AI-driven lifestyle suggestions based on your health data</li>
          <li><strong>Chat with Our AI Assistant</strong> — Ask health questions and get evidence-based answers</li>
        </ul>
      </div>

      <div class="section">
        <h2>📚 Our Most Popular Books</h2>
        <p>Start your health education with these bestsellers:</p>
        <div class="book-grid">
          <div class="book-card">
            <img src="https://images-na.ssl-images-amazon.com/images/P/B0BVFX5H7K.01.L.jpg" alt="The Core Health Moat">
            <div class="book-title">The Core Health Moat</div>
            <p style="font-size: 12px; margin: 5px 0;">Ecosystem Foundation</p>
            <a href="https://thepatientscompass.com/books/core-health-moat" class="cta-button" style="font-size: 12px;">View</a>
          </div>
          <div class="book-card">
            <img src="https://images-na.ssl-images-amazon.com/images/P/B0BVFX5H7K.01.L.jpg" alt="Functional Wellness">
            <div class="book-title">Functional Wellness</div>
            <p style="font-size: 12px; margin: 5px 0;">Optimal Health Guide</p>
            <a href="https://thepatientscompass.com/books/functional-wellness" class="cta-button" style="font-size: 12px;">View</a>
          </div>
        </div>
      </div>

      <div class="section">
        <p><a href="https://thepatientscompass.com/books" class="cta-button">Browse All Books</a></p>
      </div>

      <div class="section">
        <h2>🚀 Get Started</h2>
        <p>Ready to dive in? Here's what we recommend:</p>
        <ol>
          <li>Take our <a href="https://thepatientscompass.com/symptom-quiz">Symptom Quiz</a> to identify your health focus areas</li>
          <li>Upload your latest lab results to our <a href="https://thepatientscompass.com/ai-lab-scanner">AI Lab Scanner</a></li>
          <li>Explore our <a href="https://thepatientscompass.com/biomarker-library">Biomarker Library</a> to understand your results</li>
        </ol>
      </div>

      <div class="section">
        <p>Questions? Our AI Assistant is available 24/7 to help. Just click the chat icon on any page.</p>
      </div>
    </div>

    <div class="footer">
      <p>The Patient's Compass — Built by a Clinical Laboratory Scientist with 20+ Years of Experience</p>
      <p><a href="https://thepatientscompass.com/privacy">Privacy Policy</a> | <a href="https://thepatientscompass.com/terms">Terms of Service</a> | <a href="${getUnsubscribeLink(context.userId, userEmail)}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: userEmail,
    subject: "Welcome to The Patient's Compass 🎯",
    html,
  });
}

/**
 * Email 2: Biomarker Guides Deep Dive (Day 2)
 * Focus on biomarker education and lab analysis
 */
export async function sendWelcomeEmail2(context: WelcomeEmailContext): Promise<boolean> {
  const { userName, userEmail } = context;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b9d83 0%, #d4c5b9 100%); padding: 30px; border-radius: 8px; color: white; text-align: center; }
    .content { padding: 30px 0; }
    .section { margin: 20px 0; }
    .biomarker-list { list-style: none; padding: 0; }
    .biomarker-item { background: #f5f5f5; padding: 15px; margin: 10px 0; border-left: 4px solid #8b9d83; border-radius: 4px; }
    .biomarker-item strong { color: #8b9d83; }
    .cta-button { display: inline-block; background: #8b9d83; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 10px 5px 10px 0; }
    .footer { border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Understanding Your Biomarkers</h1>
      <p>The Key to Personalized Health</p>
    </div>

    <div class="content">
      <p>Hi ${userName || "there"},</p>

      <p>We hope you're enjoying The Patient's Compass! Today, we want to help you understand the biomarkers that matter most to your health.</p>

      <div class="section">
        <h2>📊 Core Biomarkers Explained</h2>
        <ul class="biomarker-list">
          <li class="biomarker-item">
            <strong>Glucose & Insulin:</strong> The foundation of metabolic health. Learn how these affect your energy, weight, and disease risk.
            <br><a href="https://thepatientscompass.com/biomarker-library/glucose">Explore Guide →</a>
          </li>
          <li class="biomarker-item">
            <strong>Lipid Panel:</strong> Cholesterol, triglycerides, and more. Understand what "normal" really means for your health.
            <br><a href="https://thepatientscompass.com/biomarker-library/lipids">Explore Guide →</a>
          </li>
          <li class="biomarker-item">
            <strong>Liver & Kidney Function:</strong> Critical detox organs. See how your lifestyle impacts these vital systems.
            <br><a href="https://thepatientscompass.com/biomarker-library/organ-function">Explore Guide →</a>
          </li>
          <li class="biomarker-item">
            <strong>Inflammation Markers:</strong> The silent driver of chronic disease. Learn how to reduce yours.
            <br><a href="https://thepatientscompass.com/biomarker-library/inflammation">Explore Guide →</a>
          </li>
        </ul>
      </div>

      <div class="section">
        <h2>🔬 Ready to Analyze Your Labs?</h2>
        <p>Upload your lab results and our AI will:</p>
        <ul>
          <li>Identify out-of-range values</li>
          <li>Explain what they mean for your health</li>
          <li>Suggest actionable next steps</li>
          <li>Compare to optimal functional ranges</li>
        </ul>
        <p><a href="https://thepatientscompass.com/ai-lab-scanner" class="cta-button">Upload Lab Results</a></p>
      </div>

      <div class="section">
        <h2>📚 Deep Dive Books</h2>
        <p>Want to become a biomarker expert? Check out these detailed guides:</p>
        <ul>
          <li><a href="https://thepatientscompass.com/books/optimal-ranges">Optimal Ranges: Beyond Normal</a></li>
          <li><a href="https://thepatientscompass.com/books/functional-wellness">Functional Wellness Framework</a></li>
          <li><a href="https://thepatientscompass.com/books/case-studies">Real Patient Case Studies</a></li>
        </ul>
      </div>

      <div class="section">
        <p>Next email: We'll introduce you to our AI Assistant and show you how to get personalized health recommendations.</p>
      </div>
    </div>

    <div class="footer">
      <p>The Patient's Compass — Built by a Clinical Laboratory Scientist with 20+ Years of Experience</p>
      <p><a href="https://thepatientscompass.com/privacy">Privacy Policy</a> | <a href="https://thepatientscompass.com/terms">Terms of Service</a> | <a href="${getUnsubscribeLink(context.userId, userEmail)}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: userEmail,
    subject: "Understanding Your Biomarkers 📊",
    html,
  });
}

/**
 * Email 3: AI Assistant + Lab Analysis (Day 5)
 * Focus on AI features and personalized recommendations
 */
export async function sendWelcomeEmail3(context: WelcomeEmailContext): Promise<boolean> {
  const { userName, userEmail } = context;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b9d83 0%, #d4c5b9 100%); padding: 30px; border-radius: 8px; color: white; text-align: center; }
    .content { padding: 30px 0; }
    .section { margin: 20px 0; }
    .feature-box { background: #f9f9f9; border: 1px solid #e0e0e0; padding: 20px; border-radius: 6px; margin: 15px 0; }
    .feature-box h3 { margin-top: 0; color: #8b9d83; }
    .cta-button { display: inline-block; background: #8b9d83; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 10px 5px 10px 0; }
    .footer { border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Meet Your AI Health Assistant</h1>
      <p>Personalized Guidance, 24/7</p>
    </div>

    <div class="content">
      <p>Hi ${userName || "there"},</p>

      <p>You're almost a week into your Patient's Compass journey! Now it's time to unlock the power of our AI Assistant—your personal health coach available anytime, anywhere.</p>

      <div class="section">
        <h2>🤖 What Your AI Assistant Can Do</h2>

        <div class="feature-box">
          <h3>💬 Ask Health Questions</h3>
          <p>Get evidence-based answers to any health question. From "What does high cortisol mean?" to "How do I improve my sleep quality?"</p>
        </div>

        <div class="feature-box">
          <h3>📈 Analyze Your Lab Results</h3>
          <p>Upload a PDF or image of your lab work. Our AI will interpret your results and explain what they mean for your specific health situation.</p>
        </div>

        <div class="feature-box">
          <h3>🎯 Get Personalized Recommendations</h3>
          <p>Based on your biomarkers and health goals, receive tailored suggestions for diet, supplements, lifestyle changes, and when to see a doctor.</p>
        </div>

        <div class="feature-box">
          <h3>📚 Learn from Our Knowledge Base</h3>
          <p>Access 20+ years of clinical laboratory science expertise. Ask about optimal ranges, functional medicine, or specific health conditions.</p>
        </div>
      </div>

      <div class="section">
        <h2>🚀 Try It Now</h2>
        <p>Start a conversation with your AI Assistant:</p>
        <p><a href="https://thepatientscompass.com/ai-assistant" class="cta-button">Open AI Assistant</a></p>
        <p>Or try asking one of these questions:</p>
        <ul>
          <li>"What should my optimal glucose levels be?"</li>
          <li>"How do I interpret my lipid panel?"</li>
          <li>"What are the best foods for liver health?"</li>
          <li>"How often should I get my labs checked?"</li>
        </ul>
      </div>

      <div class="section">
        <h2>📊 Next Steps</h2>
        <ol>
          <li>Chat with our AI Assistant about your health goals</li>
          <li>Upload your lab results for personalized analysis</li>
          <li>Create a wellness plan based on your biomarkers</li>
          <li>Track your progress with our health dashboard</li>
        </ol>
      </div>

      <div class="section">
        <h2>🎁 Exclusive for New Members</h2>
        <p>Get your first 10 lab analyses free! After that, enjoy unlimited access with our premium membership.</p>
        <p><a href="https://thepatientscompass.com/pricing" class="cta-button">View Pricing</a></p>
      </div>

      <div class="section">
        <p><strong>Questions?</strong> Reply to this email or use the chat widget on our website. We're here to help!</p>
      </div>
    </div>

    <div class="footer">
      <p>The Patient's Compass — Built by a Clinical Laboratory Scientist with 20+ Years of Experience</p>
      <p><a href="https://thepatientscompass.com/privacy">Privacy Policy</a> | <a href="https://thepatientscompass.com/terms">Terms of Service</a> | <a href="${getUnsubscribeLink(context.userId, userEmail)}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: userEmail,
    subject: "Your AI Health Assistant is Ready 🤖",
    html,
  });
}
