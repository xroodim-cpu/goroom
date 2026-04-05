import I from './Icon';
import Toggle from './Toggle';

export default function ToggleSection({icon,iconColor,label,on,toggle,children}){
  return <div>
    <div className="gr-toggle-row" onClick={toggle}><span style={{display:'flex',alignItems:'center',gap:8}}><I n={icon} size={16} color={iconColor}/> {label}</span><Toggle on={on} toggle={toggle}/></div>
    {on && <div className="gr-toggle-body">{children}</div>}
  </div>;
}
