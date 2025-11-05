import pool from "../config/db.js";
import { hashPassword, comparePassword } from "../utils/hashPassword.js";
import { sendResponse } from "../utils/responseHandler.js";

// ============================================================
// Fetch logged-in user's profile
// ============================================================
export const getProfile = async (req, res) => {
  try {
    const authId = req.user.id;

    const [rows] = await pool.query(
      `SELECT 
        e.employee_id, e.first_name, e.last_name, e.contact_no, e.email, 
        e.date_hired, e.supervisor_name, e.leave_balance, e.address, 
        e.is_admin, e.id as employee_code, e.classification_id,
        ec.department, ec.position, ec.role, ec.employment_type, ec.employee_level,
        aa.username, aa.backup_email, aa.created_at
       FROM account_auth aa
       JOIN employees e ON aa.employee_id = e.employee_id
       LEFT JOIN emp_classification ec ON e.classification_id = ec.classification_id
       WHERE aa.auth_id = ?`,
      [authId]
    );

    if (rows.length === 0)
      return sendResponse(res, 404, false, "User not found.");

    const user = rows[0];

    // Generate initials for frontend display
    const initials = user.first_name && user.last_name 
      ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
      : user.email.charAt(0).toUpperCase();

    // Send structured response
    return sendResponse(res, 200, true, "Profile fetched successfully.", {
      auth_id: req.user.id,
      employee_id: user.employee_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      contact_no: user.contact_no,
      address: user.address,
      employee_code: user.employee_code,
      is_admin: user.is_admin,
      department: user.department,
      position: user.position,
      role: user.role,
      employment_type: user.employment_type,
      employee_level: user.employee_level,
      leave_balance: user.leave_balance,
      supervisor_name: user.supervisor_name,
      date_hired: user.date_hired,
      initials,
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    return sendResponse(res, 500, false, "Failed to fetch profile.");
  }
};

// ============================================================
// Change password (only for logged-in users)
// ============================================================
export const changePassword = async (req, res) => {
  try {
    const authId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword)
      return sendResponse(res, 400, false, "Both current and new passwords are required.");

    // Check password strength
    const isStrong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(newPassword);
    if (!isStrong)
      return sendResponse(res, 400, false, "Password must include uppercase, lowercase, number, and special character.");

    // Fetch current password hash
    const [rows] = await pool.query(
      "SELECT password FROM account_auth WHERE auth_id = ?",
      [authId]
    );
    
    if (rows.length === 0)
      return sendResponse(res, 404, false, "User not found.");

    const user = rows[0];

    // Compare passwords
    const match = await comparePassword(currentPassword, user.password);
    if (!match)
      return sendResponse(res, 401, false, "Current password is incorrect.");

    // Hash and update new password
    const hashed = await hashPassword(newPassword);
    await pool.query(
      "UPDATE account_auth SET password = ? WHERE auth_id = ?",
      [hashed, authId]
    );

    return sendResponse(res, 200, true, "Password updated successfully.");
  } catch (err) {
    console.error("Change password error:", err);
    return sendResponse(res, 500, false, "Failed to update password.");
  }
};