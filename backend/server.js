import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();
const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "*" }));
app.use(express.json());

// ======================== ROUTES ========================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// ======================== HOME PAGE ========================
app.get("/", (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ClockIt Attendance Tracker API</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: 'Inter', sans-serif;
      }

      :root {
        --primary: #06C3A7;
        --primary-dark: #05a892;
        --secondary: #0EA5E9;
        --accent: #8B5CF6;
        --dark: #1F2937;
        --light: #FAFAF0;
        --gray: #6B7280;
        --white: #FFFFFF;
        --success: #10B981;
        --warning: #F59E0B;
        --error: #EF4444;
      }

      body {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: var(--dark);
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px 20px;
        animation: fadeIn 0.8s ease-in-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .container {
        width: 100%;
        max-width: 1200px;
      }

      header {
        text-align: center;
        margin-bottom: 50px;
        animation: slideDown 1s ease-in-out;
      }

      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-30px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .logo {
        font-size: 3.5rem;
        font-weight: 700;
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 15px;
      }

      h1 {
        font-size: 3rem;
        color: var(--white);
        margin-bottom: 10px;
        font-weight: 600;
      }

      .subtitle {
        font-size: 1.2rem;
        color: rgba(255, 255, 255, 0.9);
        margin-bottom: 25px;
        font-weight: 300;
      }

      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(16, 185, 129, 0.2);
        color: var(--success);
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 0.9rem;
        font-weight: 500;
        border: 1px solid rgba(16, 185, 129, 0.3);
      }

      .status-dot {
        width: 8px;
        height: 8px;
        background: var(--success);
        border-radius: 50%;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        margin-bottom: 40px;
      }

      @media (max-width: 768px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }

      .card {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        padding: 35px;
        transition: all 0.3s ease;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .card:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
      }

      .card h2 {
        color: var(--primary);
        margin-bottom: 20px;
        font-size: 1.5rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th {
        text-align: left;
        padding: 15px 10px;
        color: var(--primary);
        border-bottom: 2px solid rgba(6, 195, 167, 0.2);
        font-weight: 600;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      td {
        padding: 15px 10px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        transition: background-color 0.2s ease;
      }

      tr:hover td {
        background-color: rgba(6, 195, 167, 0.05);
      }

      .endpoint {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.9rem;
        color: var(--dark);
        font-weight: 500;
      }

      .method {
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.8rem;
        padding: 4px 8px;
        border-radius: 6px;
        color: white;
      }

      .get { background: var(--success); }
      .post { background: var(--secondary); }
      .put { background: var(--warning); }
      .delete { background: var(--error); }

      .description {
        color: var(--gray);
        font-size: 0.9rem;
        line-height: 1.4;
      }

      /* Quick Start Section */
      .quick-start {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        padding: 35px;
        margin-bottom: 40px;
      }

      .quick-start h2 {
        color: var(--primary);
        margin-bottom: 25px;
        font-size: 1.8rem;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .steps {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 25px;
      }

      .step {
        background: var(--white);
        padding: 25px;
        border-radius: 15px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        border-left: 4px solid var(--primary);
        transition: transform 0.2s ease;
      }

      .step:hover {
        transform: translateX(5px);
      }

      .step-number {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        background: var(--primary);
        color: white;
        border-radius: 50%;
        font-weight: 600;
        margin-bottom: 15px;
      }

      .step h3 {
        color: var(--dark);
        margin-bottom: 10px;
        font-size: 1.1rem;
      }

      .step p {
        color: var(--gray);
        font-size: 0.9rem;
        line-height: 1.5;
        margin-bottom: 15px;
      }

      .code-block {
        background: rgba(6, 195, 167, 0.08);
        padding: 15px;
        border-radius: 10px;
        border: 1px solid rgba(6, 195, 167, 0.2);
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.85rem;
        color: var(--dark);
        overflow-x: auto;
        margin-top: 10px;
      }

      /* Footer */
      footer {
        text-align: center;
        margin-top: 50px;
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.9rem;
      }

      .footer-links {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin-top: 15px;
      }

      .footer-links a {
        color: rgba(255, 255, 255, 0.8);
        text-decoration: none;
        transition: color 0.2s ease;
      }

      .footer-links a:hover {
        color: white;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .logo {
          font-size: 2.5rem;
        }
        
        h1 {
          font-size: 2rem;
        }
        
        .card, .quick-start {
          padding: 25px;
        }
        
        th, td {
          padding: 12px 8px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <header>
        <div class="logo">ClockIt</div>
        <h1>Attendance Tracker API</h1>
        <p class="subtitle">Node.js + Express + MySQL | Secure Authentication System</p>
        <div class="status-badge">
          <div class="status-dot"></div>
          Server Running on Port ${process.env.PORT || 4001}
        </div>
      </header>

      <div class="grid">
        <div class="card">
          <h2>Authentication Endpoints</h2>
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Endpoint</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="method post">POST</span></td>
                <td class="endpoint">/api/auth/signup</td>
                <td class="description">Register new user (Employees + Auth)</td>
              </tr>
              <tr>
                <td><span class="method post">POST</span></td>
                <td class="endpoint">/api/auth/login</td>
                <td class="description">Login with JWT + account lockout</td>
              </tr>
              <tr>
                <td><span class="method post">POST</span></td>
                <td class="endpoint">/api/auth/forgot-password</td>
                <td class="description">Request reset link (primary or backup email)</td>
              </tr>
              <tr>
                <td><span class="method post">POST</span></td>
                <td class="endpoint">/api/auth/reset-password</td>
                <td class="description">Reset password via secure token</td>
              </tr>
              <tr>
                <td><span class="method post">POST</span></td>
                <td class="endpoint">/api/auth/unlock-account</td>
                <td class="description">Manually unlock locked account</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="card">
          <h2>User Endpoints</h2>
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Endpoint</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="method get">GET</span></td>
                <td class="endpoint">/api/users/profile</td>
                <td class="description">Get user profile (JWT token required)</td>
              </tr>
              <tr>
                <td><span class="method put">PUT</span></td>
                <td class="endpoint">/api/users/change-password</td>
                <td class="description">Change user password (Experimental testing only, not going to be used in production)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="quick-start">
        <h2>Quick Start Guide</h2>
        <div class="steps">
          <div class="step">
            <div class="step-number">1</div>
            <h3>Register a User</h3>
            <p>Create a new employee account with authentication</p>
            <div class="code-block">
POST /api/auth/signup
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "address": "123 Main St, Cape Town",
  "contact_no": "0821234567",
  "backup_email": "john@example2.com"
}
            </div>
          </div>
          
          <div class="step">
            <div class="step-number">2</div>
            <h3>Login & Get Token</h3>
            <p>Authenticate and receive JWT token for protected routes</p>
            <div class="code-block">
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
            </div>
          </div>
          
          <div class="step">
            <div class="step-number">3</div>
            <h3>Forgot Password</h3>
            <p>Request password reset link via email</p>
            <div class="code-block">
POST /api/auth/forgot-password
{
  "email": "john@example.com",
  "useBackup": false
}
            </div>
          </div>

          <div class="step">
            <div class="step-number">4</div>
            <h3>Reset Password</h3>
            <p>Use the token from email to reset password</p>
            <div class="code-block">
POST /api/auth/reset-password
{
  "email": "john@example.com",
  "token": "token_from_email",
  "newPassword": "NewSecurePass123!"
}
            </div>
          </div>

          <div class="step">
            <div class="step-number">5</div>
            <h3>Access Protected Routes</h3>
            <p>Use the JWT token to access user profile and other protected endpoints</p>
            <div class="code-block">
GET /api/users/profile
Authorization: Bearer your_jwt_token
            </div>
          </div>

          
        </div>
      </div>

      <div class="quick-start">
        <h2>Account Security Features</h2>
        <div class="steps">
          <div class="step">
            <div class="step-number">A</div>
            <h3>Account Lockout</h3>
            <p>After 3 failed login attempts, account is automatically locked for 30 seconds</p>
            <div class="code-block">
Response when locked:
{
  "success": false,
  "message": "Account locked for 30 seconds after 3 failed attempts."
}
            </div>
          </div>
          
          <div class="step">
            <div class="step-number">B</div>
            <h3>Manual Unlock</h3>
            <p>Admins can manually unlock accounts using the unlock endpoint</p>
            <div class="code-block">
POST /api/auth/unlock-account
{
  "email": "locked_user@example.com"
}
            </div>
          </div>
          
          <div class="step">
            <div class="step-number">C</div>
            <h3>Password Requirements</h3>
            <p>Strong password policy enforced for security</p>
            <div class="code-block">
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
            </div>
          </div>
        </div>
      </div>

      <footer>
        <p>© ${new Date().getFullYear()} ClockIt Attendance Tracker | Built with Node.js, Express & MySQL</p>
      </footer>
    </div>

    <script>
      // Add smooth scrolling for anchor links
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
          e.preventDefault();
          document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
          });
        });
      });

      // Add hover effects to cards
      document.querySelectorAll('.card, .step').forEach(element => {
        element.addEventListener('mouseenter', function() {
          this.style.transform = 'translateY(-5px)';
        });
        
        element.addEventListener('mouseleave', function() {
          this.style.transform = 'translateY(0)';
        });
      });
    </script>
  </body>
  </html>`;
  res.status(200).send(html);
});

// ======================== ERROR HANDLER ========================
app.use(errorHandler);

// ======================== 404 HANDLER ========================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found. Please check the API documentation at the root endpoint."
  });
});

// ======================== SERVER START ========================
const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`ClockIt Auth Server is running on http://localhost:${PORT}`);
  console.log(`Database: ${process.env.DB_NAME}`);
  console.log(`Frontend: ${process.env.FRONTEND_ORIGIN}`);
  console.log(`JWT Secret: ${process.env.JWT_SECRET ? '✔ Set' : '❌ Missing'}`);
  console.log(`Email: ${process.env.EMAIL_USER ? '✔ Configured' : '❌ Not configured'}`);
});