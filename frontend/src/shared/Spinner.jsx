function Spinner({ size = 16, label }) {
  return (
    <span
      className="spinner"
      style={{ width: size, height: size, borderWidth: Math.max(2, Math.round(size / 8)) }}
      role={label ? 'status' : undefined}
      aria-label={label}
    />
  );
}

export default Spinner;
