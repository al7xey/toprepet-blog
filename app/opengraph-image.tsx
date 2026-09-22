import { ImageResponse } from 'next/og'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ width: '100%', height: '100%', background: '#faf3e9', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 90, color: '#182331' }}><div style={{ display: 'flex', alignItems: 'center', gap: 28 }}><div style={{ width: 112, height: 112, borderRadius: 28, background: '#f46b32', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 95, fontWeight: 800 }}>t</div><div style={{ fontSize: 88, fontWeight: 800, letterSpacing: -4 }}>TopRepet</div></div><div style={{ marginTop: 48, fontSize: 49, fontWeight: 700 }}>Знания для вашей цели</div><div style={{ marginTop: 22, fontSize: 28, color: '#65707b' }}>Школа · ОГЭ · ЕГЭ · полезные разборы</div><div style={{ position: 'absolute', right: -90, bottom: -150, width: 380, height: 380, borderRadius: 190, background: '#ffd9bb' }}/></div>, size)
}
