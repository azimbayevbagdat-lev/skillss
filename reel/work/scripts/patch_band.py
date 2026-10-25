p='/home/user/skillss/reel/work/rem/src/Overlays.tsx'; s=open(p).read()
rep = [
("""// Overlay band: between the chin (~830px) and the captions (~1290px).
// Horizontal safe area 80..960 (120px right margin for Instagram buttons).
const BAND_TOP = 850;
const BAND_H = 420;""","""// Overlay band: top of frame, above the head (face spans ~500..1250px).
// Safe area: top 220px, right 120px (Instagram UI).
const BAND_TOP = 228;
const BAND_H = 250;"""),
("""const Band: React.FC<{ children: React.ReactNode; dur: number; style?: React.CSSProperties }> = ({ children, dur, style }) => {""",
 """const Band: React.FC<{ children: React.ReactNode; dur: number; fit?: number; style?: React.CSSProperties }> = ({ children, dur, fit = 1, style }) => {"""),
("""        transform: `scale(${scale})`,
        opacity,
        ...style,""","""        transform: `scale(${scale * fit})`,
        opacity,
        ...style,"""),
("""          padding: "34px 44px 34px 44px",""","""          padding: "22px 36px 22px 230px","""),
("""          width: 820,
        }}
      >
        <div style={{ fontSize: 64, lineHeight: 1 }}>1 АПТАДА</div>
        <div style={{ fontSize: 132, lineHeight: 1.05, letterSpacing: -2 }}>300 000</div>
        <div style={{ fontSize: 64, lineHeight: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 18 }}>
          ЖҮКТЕУ <Emoji code="1f695" size={80} />
        </div>""","""          width: 860,
        }}
      >
        <div style={{ fontSize: 50, lineHeight: 1 }}>1 АПТАДА</div>
        <div style={{ fontSize: 118, lineHeight: 1.02, letterSpacing: -2 }}>300 000</div>
        <div style={{ fontSize: 50, lineHeight: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 14 }}>
          ЖҮКТЕУ <Emoji code="1f695" size={64} />
        </div>"""),
("""              left: -40,
              top: -70,""","""              left: 34,
              top: 22,"""),
("""  const cropTop = 110;
  const cropH = 350;""","""  const cropTop = 150;
  const cropH = 200;"""),
("""  const cropTop = 150;
  const cropH = 440;""","""  const cropTop = 395;
  const cropH = 200;"""),
("""        <svg width={120} height={200} viewBox="0 0 120 200">""","""        <svg width={100} height={170} viewBox="0 0 120 200">"""),
("""          <Emoji code="1f914" size={130} style={{ position: "absolute", right: -40, top: -80,""","""          <Emoji code="1f914" size={120} style={{ position: "absolute", right: -50, top: -30,"""),
]
for a,b in rep:
    assert a in s, a[:60]
    s=s.replace(a,b)
fits={'Bonus':.62,'Dumping':.7,'Kz':.85,'Chat':.92,'Check':.78,'Hand':.85,'Money':.66,'AppCard':.92,'Idea':.6,'Prompt':.88,'Terminal':.95}
for name,fv in fits.items():
    i=s.index(f"const {name}: React.FC")
    j=s.index("<Band dur={dur}>", i)
    s=s[:j]+f"<Band dur={{dur}} fit={{{fv}}}>"+s[j+len("<Band dur={dur}>"):]
open(p,'w').write(s)
