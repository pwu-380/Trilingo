import { useState } from "react";
import { loginWithToken } from "../../api/client";
import "./LoginPage.css";

interface Props {
  onSuccess: () => void;
}

export default function LoginPage({ onSuccess }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!value.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    const ok = await loginWithToken(value);
    if (ok) {
      onSuccess();
    } else {
      setError("Incorrect passphrase");
      setValue("");
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Replace spaces with dashes; collapse double-dashes from space-after-dash
    const raw = e.target.value.replace(/ /g, "-").replace(/--+/g, "-");
    setValue(raw);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Trilingo</h1>
        <input
          className="login-input"
          type="text"
          placeholder="Enter passphrase"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={submitting}
          autoFocus
        />
        {error && <p className="login-error">{error}</p>}
        <button
          className="login-btn"
          onClick={handleSubmit}
          disabled={submitting || !value.trim()}
        >
          Login
        </button>
      </div>
    </div>
  );
}
