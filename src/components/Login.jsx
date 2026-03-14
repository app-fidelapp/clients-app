import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error(err);
      setError("Identifiants invalides.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 420, margin: "80px auto" }}>
        <h1 style={{ marginBottom: 6 }}>Divina-Pro</h1>
        <div className="sub" style={{ marginBottom: 16 }}>
          Connexion requise
        </div>

        <form onSubmit={onSubmit} className="form">
          <div className="row">
            <div className="field" style={{ minWidth: "100%" }}>
              <label>Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="row">
            <div className="field" style={{ minWidth: "100%" }}>
              <label>Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <p className="hint" style={{ color: "#b00020" }}>
              {error}
            </p>
          )}

          <div className="actions">
            <button type="submit" disabled={loading || !email || !password}>
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}