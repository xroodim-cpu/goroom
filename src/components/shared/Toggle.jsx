export default function Toggle({on, toggle}) {
  return <button className={`gr-tsw ${on ? 'on' : 'off'}`} onClick={e => { e.stopPropagation(); toggle(); }} />;
}
