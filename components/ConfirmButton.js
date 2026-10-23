"use client";

// A submit button that asks for confirmation before submitting its form.
export default function ConfirmButton({ message, className, children }) {
  return (
    <button
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
