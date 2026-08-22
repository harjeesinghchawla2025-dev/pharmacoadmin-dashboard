/**
 * Admin user-management routes (Phase 2).
 *
 * This backend lives outside this frontend repo (your Express server on
 * http://localhost:5000). Copy this router into your backend as
 * `server/routes/admin-users.js` and mount it inside your existing
 * `server/routes/admin.js`:
 *
 *   const adminUsers = require("./admin-users");
 *   router.use("/", adminUsers(pool));   // pool = existing mysql2/promise pool
 *
 * Nothing here touches the dashboard/analytics endpoints. It only uses the
 * existing `users` and `roles` tables, uses parameterized SQL everywhere and
 * never selects or returns `password_hash`.
 */

const express = require("express");
const bcrypt = require("bcryptjs");

const ACCOUNT_STATUSES = ["Active", "Inactive", "Pending"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const USER_SELECT = `
  SELECT u.user_id        AS id,
         u.student_id     AS studentId,
         u.email          AS email,
         r.role_name      AS role,
         u.role_id        AS roleId,
         u.account_status AS status,
         u.created_at     AS createdAt,
         u.updated_at     AS updatedAt
  FROM users u
  LEFT JOIN roles r ON r.role_id = u.role_id
`;

module.exports = function adminUsersRoutes(pool) {
  const router = express.Router();

  const fail = (res, status, message) => res.status(status).json({ error: message });

  async function findUser(id) {
    const [rows] = await pool.query(`${USER_SELECT} WHERE u.user_id = ?`, [id]);
    return rows[0] ?? null;
  }

  async function validate(body, { requirePassword }) {
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const studentId =
      body.studentId === undefined || body.studentId === null || String(body.studentId).trim() === ""
        ? null
        : String(body.studentId).trim();
    const password = typeof body.password === "string" ? body.password : "";
    const roleId = Number(body.roleId);
    const accountStatus = body.accountStatus ?? "Active";

    if (!email || !EMAIL_RE.test(email) || email.length > 255) {
      return { error: "A valid email address is required." };
    }
    if (studentId && studentId.length > 50) {
      return { error: "Student ID must be 50 characters or fewer." };
    }
    if (requirePassword && password.length < 8) {
      return { error: "Password is required and must be at least 8 characters." };
    }
    if (!requirePassword && password && password.length < 8) {
      return { error: "New password must be at least 8 characters." };
    }
    if (!Number.isInteger(roleId)) return { error: "A valid role is required." };
    if (!ACCOUNT_STATUSES.includes(accountStatus)) {
      return { error: `Account status must be one of: ${ACCOUNT_STATUSES.join(", ")}.` };
    }

    const [roleRows] = await pool.query("SELECT role_id FROM roles WHERE role_id = ?", [roleId]);
    if (roleRows.length === 0) return { error: "Selected role does not exist." };

    return { value: { email, studentId, password, roleId, accountStatus } };
  }

  async function assertUnique({ email, studentId }, excludeId = null) {
    const [emailRows] = await pool.query(
      "SELECT user_id FROM users WHERE email = ? AND (? IS NULL OR user_id <> ?)",
      [email, excludeId, excludeId],
    );
    if (emailRows.length > 0) return "That email address is already registered.";

    if (studentId) {
      const [sidRows] = await pool.query(
        "SELECT user_id FROM users WHERE student_id = ? AND (? IS NULL OR user_id <> ?)",
        [studentId, excludeId, excludeId],
      );
      if (sidRows.length > 0) return "That student ID is already registered.";
    }
    return null;
  }

  // GET /admin/users
  router.get("/users", async (_req, res) => {
    try {
      const [rows] = await pool.query(`${USER_SELECT} ORDER BY u.user_id ASC`);
      res.json(rows);
    } catch (err) {
      console.error("[admin/users] list failed", err);
      fail(res, 500, "Failed to load users.");
    }
  });

  // GET /admin/roles (used to populate the role dropdown)
  router.get("/roles", async (_req, res) => {
    try {
      const [rows] = await pool.query(
        "SELECT role_id AS roleId, role_name AS roleName, description FROM roles ORDER BY role_id",
      );
      res.json(rows);
    } catch (err) {
      console.error("[admin/roles] list failed", err);
      fail(res, 500, "Failed to load roles.");
    }
  });

  // GET /admin/users/:id
  router.get("/users/:id", async (req, res) => {
    try {
      const user = await findUser(req.params.id);
      if (!user) return fail(res, 404, "User not found.");
      res.json(user);
    } catch (err) {
      console.error("[admin/users] get failed", err);
      fail(res, 500, "Failed to load user.");
    }
  });

  // POST /admin/users
  router.post("/users", async (req, res) => {
    try {
      const { error, value } = await validate(req.body ?? {}, { requirePassword: true });
      if (error) return fail(res, 400, error);

      const conflict = await assertUnique(value);
      if (conflict) return fail(res, 409, conflict);

      const passwordHash = await bcrypt.hash(value.password, 10);
      const [result] = await pool.query(
        `INSERT INTO users (student_id, email, password_hash, role_id, account_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [value.studentId, value.email, passwordHash, value.roleId, value.accountStatus],
      );

      res.status(201).json(await findUser(result.insertId));
    } catch (err) {
      console.error("[admin/users] create failed", err);
      if (err && err.code === "ER_DUP_ENTRY") {
        return fail(res, 409, "Email or student ID is already in use.");
      }
      fail(res, 500, "Failed to create user.");
    }
  });

  // PUT /admin/users/:id
  router.put("/users/:id", async (req, res) => {
    try {
      const existing = await findUser(req.params.id);
      if (!existing) return fail(res, 404, "User not found.");

      const { error, value } = await validate(req.body ?? {}, { requirePassword: false });
      if (error) return fail(res, 400, error);

      const conflict = await assertUnique(value, existing.id);
      if (conflict) return fail(res, 409, conflict);

      if (value.password) {
        const passwordHash = await bcrypt.hash(value.password, 10);
        await pool.query(
          `UPDATE users
             SET student_id = ?, email = ?, role_id = ?, account_status = ?, password_hash = ?, updated_at = NOW()
           WHERE user_id = ?`,
          [value.studentId, value.email, value.roleId, value.accountStatus, passwordHash, existing.id],
        );
      } else {
        await pool.query(
          `UPDATE users
             SET student_id = ?, email = ?, role_id = ?, account_status = ?, updated_at = NOW()
           WHERE user_id = ?`,
          [value.studentId, value.email, value.roleId, value.accountStatus, existing.id],
        );
      }

      res.json(await findUser(existing.id));
    } catch (err) {
      console.error("[admin/users] update failed", err);
      if (err && err.code === "ER_DUP_ENTRY") {
        return fail(res, 409, "Email or student ID is already in use.");
      }
      fail(res, 500, "Failed to update user.");
    }
  });

  // PATCH /admin/users/:id/status
  router.patch("/users/:id/status", async (req, res) => {
    try {
      const status = (req.body ?? {}).accountStatus;
      if (!ACCOUNT_STATUSES.includes(status)) {
        return fail(res, 400, `Account status must be one of: ${ACCOUNT_STATUSES.join(", ")}.`);
      }
      const existing = await findUser(req.params.id);
      if (!existing) return fail(res, 404, "User not found.");

      await pool.query(
        "UPDATE users SET account_status = ?, updated_at = NOW() WHERE user_id = ?",
        [status, existing.id],
      );
      res.json(await findUser(existing.id));
    } catch (err) {
      console.error("[admin/users] status update failed", err);
      fail(res, 500, "Failed to update account status.");
    }
  });

  // DELETE /admin/users/:id
  router.delete("/users/:id", async (req, res) => {
    try {
      const existing = await findUser(req.params.id);
      if (!existing) return fail(res, 404, "User not found.");

      await pool.query("DELETE FROM users WHERE user_id = ?", [existing.id]);
      res.json({ deleted: true, id: existing.id });
    } catch (err) {
      if (err && (err.code === "ER_ROW_IS_REFERENCED_2" || err.code === "ER_ROW_IS_REFERENCED")) {
        return fail(
          res,
          409,
          "This user cannot be deleted because related records (patient, doctor or prescription data) reference it. Set the account to Inactive instead.",
        );
      }
      console.error("[admin/users] delete failed", err);
      fail(res, 500, "Failed to delete user.");
    }
  });

  return router;
};
