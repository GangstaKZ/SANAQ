export default function SanaqLogo({ light = false }) {
  return (
    <div className={`brand ${light ? "brand-light" : ""}`}>
      <span className="logo-mark">
        <img src="/logo.png" alt="" />
      </span>
      <div>
        <strong>
          SANAQ<span>.</span>
        </strong>
        <small>барлық тауар бақылауда</small>
      </div>
    </div>
  );
}
