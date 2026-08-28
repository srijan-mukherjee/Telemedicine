import { useState } from "react";

import { changePasswordRequest } from "../services/authService.js";

export default function ChangePasswordPanel() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await changePasswordRequest(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password changed successfully.");
    } catch (err) {
      setError(err.message || "Could not change password.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <section className="account-panel">
        <button className="secondary-action" type="button" onClick={() => setOpen(true)}>
          Change password
        </button>
      </section>
    );
  }

  return (
    <section className="account-panel">
      <form className="account-form" onSubmit={handleSubmit}>
        <h2>Change password</h2>

        <label htmlFor="current_password">Current password</label>
        <input
          id="current_password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        <label htmlFor="new_password">New password</label>
        <input
          id="new_password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
        />

        <label htmlFor="confirm_password">Confirm new password</label>
        <input
          id="confirm_password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
        />

        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}

        <div className="form-actions">
          <button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save password"}
          </button>
          <button className="secondary-action" type="button" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
