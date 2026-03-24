interface AuthScreenProps {
  status: "idle" | "polling";
  onSignIn: () => void;
  onCancel: () => void;
}

export function AuthScreen({ status, onSignIn, onCancel }: AuthScreenProps) {
  return (
    <div className="auth-screen">
      <div className="auth-screen-body">
        <h2 className="auth-screen-title">Element Armory</h2>
        <p className="auth-screen-subtitle">Sign in to access your captured components.</p>

        {status === "idle" && (
          <button className="auth-btn-primary" onClick={onSignIn}>
            Sign In
          </button>
        )}

        {status === "polling" && (
          <>
            <div className="auth-polling">
              <span className="auth-spinner" aria-hidden="true" />
              <span>Waiting for sign-in in browser…</span>
            </div>
            <button className="auth-btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
