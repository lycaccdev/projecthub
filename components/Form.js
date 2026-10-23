"use client";

import { useActionState, useEffect, useRef } from "react";

// Wraps a server action so it can return { error } and show it inline.
// `secondary` renders next to the submit button (e.g. a Cancel link).
export default function Form({ action, children, submitLabel, resetOnSuccess = false, secondary }) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const ref = useRef(null);

  useEffect(() => {
    if (resetOnSuccess && state?.ok) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form action={formAction} ref={ref} className="form">
      {children}
      {state?.error && <p className="error">{state.error}</p>}
      <div className="row">
        <button className="btn" disabled={pending}>{pending ? "Please wait…" : submitLabel}</button>
        {secondary}
      </div>
    </form>
  );
}
