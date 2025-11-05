import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { hashPassword, comparePassword } from "../utils/hashPassword.js";
import { sendResponse } from "../utils/responseHandler.js";
import { sendEmail } from "../utils/sendEmail.js";

// =============================================
// SECURITY SETTINGS
// =============================================
const MAX_FAILED_ATTEMPTS = 3;
const LOCK_DURATION_SECONDS = 30;

// Helper to check strong passwords
const isStrongPassword = (password) => {
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  return re.test(password);
};

// JWT token generator
const generateAccessToken = (user) =>
  jwt.sign({
    id: user.auth_id,
    employee_id: user.employee_id,
    email: user.username,
    is_admin: user.is_admin
  }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });

// =============================================
// REGISTER USER
// =============================================
export const registerUser = async (req, res, next) => {
  let connection;
  try {
    const { first_name, last_name, contact_no, email, password, backup_email, address } = req.body;

    // Validation
    if (!email || !password || !first_name || !last_name || !address)
      return sendResponse(res, 400, false, "All required fields must be provided.");

    if (!isStrongPassword(password))
      return sendResponse(
        res,
        400,
        false,
        "Password must include uppercase, lowercase, number, and special character."
      );

    // Get connection from pool
    connection = await pool.getConnection();

    // Prevent duplicate email registration
    const [existingEmployee] = await connection.query("SELECT employee_id FROM employees WHERE email = ?", [email]);
    if (existingEmployee.length) return sendResponse(res, 409, false, "Employee with this email already exists.");

    const [existingAuth] = await connection.query("SELECT auth_id FROM account_auth WHERE username = ?", [email]);
    if (existingAuth.length) return sendResponse(res, 409, false, "User already exists.");

    // Start transaction
    await connection.beginTransaction();

    // Generate South African ID (13 digits)
    const saId = Math.random().toString().substring(2, 15).padEnd(13, '0');

    // Step 1: Insert new employee record
    const [employeeResult] = await connection.query(
      `INSERT INTO employees (first_name, last_name, contact_no, email, address, id, date_hired, supervisor_name, leave_balance, classification_id) 
       VALUES (?, ?, ?, ?, ?, ?, CURDATE(), 'System Administrator', 0.00, 2)`,
      [first_name, last_name, contact_no || null, email, address, saId]
    );

    // Step 2: Create auth record linked to employee
    const hashed = await hashPassword(password);

    await connection.query(
      `INSERT INTO account_auth (employee_id, username, password, backup_email, created_at, lock_until, reset_token_hash, reset_expires, failed_login_attempts) 
       VALUES (?, ?, ?, ?, NOW(), NULL, NULL, NULL, 0)`,
      // [employeeResult.insertId, email, hashed, backup_email || null]
      [employeeResult.insertId, email, hashed, backup_email?.trim() || ""]

    );

    // Commit transaction
    await connection.commit();

    return sendResponse(res, 201, true, "User registered successfully.");
  } catch (err) {
    // Rollback transaction in case of error
    if (connection) await connection.rollback();
    console.error("Signup Error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

// =============================================
// LOGIN USER
// =============================================
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return sendResponse(res, 400, false, "Email and password are required.");

    const [rows] = await pool.query(
      `SELECT aa.*, e.first_name, e.last_name, e.is_admin, e.employee_id
       FROM account_auth aa 
       JOIN employees e ON aa.employee_id = e.employee_id 
       WHERE aa.username = ?`,
      [email]
    );

    if (!rows.length) return sendResponse(res, 401, false, "Invalid credentials.");

    const user = rows[0];

    // Check if account is locked
    if (user.lock_until && new Date(user.lock_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.lock_until) - new Date()) / (1000 * 60));
      return sendResponse(res, 423, false, `Account locked. Try again in ${minutesLeft} minutes.`);
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      let lockUntil = null;

      // Lock the account after reaching max attempts
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        lockUntil = new Date(Date.now() + LOCK_DURATION_SECONDS * 1000); // Changed to seconds
      }

      await pool.query(
        "UPDATE account_auth SET failed_login_attempts = ?, lock_until = ? WHERE auth_id = ?",
        [attempts, lockUntil, user.auth_id]
      );

      const attemptsLeft = MAX_FAILED_ATTEMPTS - attempts;
      return sendResponse(
        res,
        401,
        false,
        attempts >= MAX_FAILED_ATTEMPTS
          ? `Account locked for ${LOCK_DURATION_SECONDS} seconds after ${MAX_FAILED_ATTEMPTS} failed attempts.` // Updated message
          : `Invalid email or password. ${attemptsLeft} attempts remaining.`
      );
    }

    // Reset failed attempts upon success - set lock_until to NULL
    await pool.query(
      "UPDATE account_auth SET failed_login_attempts = 0, lock_until = NULL WHERE auth_id = ?",
      [user.auth_id]
    );

    const token = generateAccessToken(user);

    // Return user info along with token
    const userInfo = {
      auth_id: user.auth_id,
      employee_id: user.employee_id,
      email: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      is_admin: user.is_admin
    };

    return sendResponse(res, 200, true, "Login successful.", { token, user: userInfo });
  } catch (err) {
    console.error("Login Error:", err);
    next(err);
  }
};

// =============================================
// FORGOT PASSWORD (Enhanced)
// =============================================
export const forgotPassword = async (req, res, next) => {
  try {
    const { email, useBackup } = req.body;
    if (!email) return sendResponse(res, 400, false, "Email is required.");

    const [rows] = await pool.query(
      `SELECT aa.*, e.email as employee_email 
       FROM account_auth aa 
       JOIN employees e ON aa.employee_id = e.employee_id 
       WHERE aa.username = ? OR e.email = ?`,
      [email, email]
    );

    // Prevent info leakage
    if (!rows.length) {
      return sendResponse(res, 200, true, "If that email exists, a reset link was sent.");
    }

    const user = rows[0];

    // Generate secure reset token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest();
    const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

    console.log('🔐 RESET TOKEN FOR TESTING:', token);
    console.log('📧 For email:', email);
    console.log('⏰ Expires:', expiry.toLocaleString());

    await pool.query(
      "UPDATE account_auth SET reset_token_hash = ?, reset_expires = ? WHERE auth_id = ?",
      [tokenHash, expiry, user.auth_id]
    );

    // Frontend link
    const resetUrl = `${process.env.FRONTEND_ORIGIN}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    // Determine where to send
    const targetEmail = useBackup && user.backup_email ? user.backup_email : user.username;

    // ======================================================
    // Build HTML Email Template with same-tab redirect logic
    // ======================================================
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #222;">
        <h2 style="color:#2C3E50;">🔐 Password Reset Request</h2>
        <p>Hi ${user.first_name || ""},</p>
        <p>We received a request to reset your password for your <b>Clock It</b> account.</p>
        
        <p>Click below to reset your password (expires in 30 minutes):</p>
        
        <a href="${resetUrl}"
           style="display:inline-block;background:#007bff;color:#fff;text-decoration:none;
                  padding:10px 18px;border-radius:6px;margin:16px 0;">
          Reset My Password
        </a>

        <p>If the button doesn’t work, copy and paste this link in your browser:</p>
        <p style="word-break:break-all;">${resetUrl}</p>

        <hr style="margin:24px 0;border:none;border-top:1px solid #ccc;" />

        <script>
          try {
            const bc = new BroadcastChannel("reset-password");
            bc.postMessage("reset-requested");
            bc.close();
            window.location.href = "${resetUrl}";
          } catch (err) {
            window.location.href = "${resetUrl}";
          }
        </script>
      </div>
    `;

    // Send as HTML (with plain text fallback)
    await sendEmail(
      targetEmail,
      "Clock It - Password Reset",
      htmlContent,
      `Reset your password here: ${resetUrl}`
    );

    return sendResponse(res, 200, true, `Password reset link sent to ${targetEmail}.`);
  } catch (err) {
    console.error("Forgot Password Error:", err);
    next(err);
  }
};


// =============================================
// RESET PASSWORD
// =============================================
export const resetPassword = async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword)
      return sendResponse(res, 400, false, "Email, token, and new password are required.");

    if (!isStrongPassword(newPassword))
      return sendResponse(res, 400, false, "Password must meet strength requirements.");

    const [rows] = await pool.query(
      `SELECT aa.* 
       FROM account_auth aa 
       JOIN employees e ON aa.employee_id = e.employee_id 
       WHERE aa.username = ? OR e.email = ?`,
      [email, email]
    );

    if (!rows.length) return sendResponse(res, 400, false, "Invalid or expired reset link.");

    const user = rows[0];
    const tokenHash = crypto.createHash("sha256").update(token).digest();

    // Verify token and expiry
    if (
      !user.reset_token_hash ||
      !user.reset_token_hash.equals(tokenHash) ||
      new Date(user.reset_expires) < new Date()
    ) {
      return sendResponse(res, 400, false, "Invalid or expired reset token.");
    }

    const hashedPassword = await hashPassword(newPassword);

    await pool.query(
      "UPDATE account_auth SET password = ?, reset_token_hash = NULL, reset_expires = NULL WHERE auth_id = ?",
      [hashedPassword, user.auth_id]
    );

    return sendResponse(res, 200, true, "Password reset successful.");
  } catch (err) {
    console.error("Reset Password Error:", err);
    next(err);
  }
};

// =============================================
// UNLOCK ACCOUNT (manual override)
// =============================================
export const unlockAccount = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return sendResponse(res, 400, false, "Email is required.");

    await pool.query(
      `UPDATE account_auth 
       SET failed_login_attempts = 0, lock_until = NULL 
       WHERE username = ?`,
      [email]
    );

    return sendResponse(res, 200, true, "Account unlocked successfully.");
  } catch (err) {
    console.error("Unlock Account Error:", err);
    next(err);
  }
};

// =============================================
// GET USER PROFILE
// =============================================
export const getUserProfile = async (req, res, next) => {
  try {
    const authId = req.user.id;

    const [rows] = await pool.query(
      `SELECT 
        e.employee_id, e.first_name, e.last_name, e.contact_no, e.email, 
        e.date_hired, e.supervisor_name, e.leave_balance, e.address, 
        e.is_admin, e.id as employee_code, e.classification_id,
        ec.department, ec.position, ec.role, ec.employment_type, ec.employee_level,
        aa.username, aa.backup_email, aa.created_at, aa.lock_until, aa.failed_login_attempts
       FROM account_auth aa
       JOIN employees e ON aa.employee_id = e.employee_id
       LEFT JOIN emp_classification ec ON e.classification_id = ec.classification_id
       WHERE aa.auth_id = ?`,
      [authId]
    );

    if (!rows.length) return sendResponse(res, 404, false, "Profile not found.");

    const userData = rows[0];

    // Check if account is currently locked
    const isLocked = userData.lock_until && new Date(userData.lock_until) > new Date();

    // Generate initials for frontend
    const initials = userData.first_name && userData.last_name
      ? `${userData.first_name.charAt(0)}${userData.last_name.charAt(0)}`.toUpperCase()
      : userData.email.charAt(0).toUpperCase();

    // Return user data with additional info
    const profileData = {
      ...userData,
      is_locked: isLocked,
      initials: initials
    };

    return sendResponse(res, 200, true, "Profile fetched successfully.", profileData);
  } catch (err) {
    console.error("Profile Fetch Error:", err);
    next(err);
  }
};