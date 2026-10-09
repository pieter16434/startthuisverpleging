'use client'
import { useState, useEffect, useRef } from 'react'
import { COPY } from '@/lib/wrapped/copy'
import { SUPERKRACHTEN, AFDELINGEN, HOGESCHOLEN, MIN_COMPLETIONS_VOOR_TELLER } from '@/lib/wrapped/config'
import type { SuperkrachtSlug } from '@/lib/wrapped/config'
import Slides from './Slides'
import type { Antwoorden } from '@/lib/wrapped/calculations'
import { trackMeta, trackMetaCustom, trackTikTok } from '@/lib/wrapped/track'
import { captureAndStoreUtms } from '@/lib/wrapped/utm'

// ─── Types ────────────────────────────────────────────────────────────────────

type Rol = 'ziekenhuis' | 'student'
type Step =
  | 'start' | 'rol' | 'dienst' | 'tewerkstelling'
  | 'nachtdiensten' | 'weekends' | 'stage_uren' | 'stageplaatsen'
  | 'patienten' | 'afdeling' | 'hogeschool' | 'provincie'
  | 'stappen' | 'superkracht' | 'naam' | 'laden' | 'slides'

type Antw = {
  rol: Rol | null
  dienst: string | null
  tewerkstelling: string | null
  nachtdiensten: number
  weekends: number
  stageUren: number
  stageplaatsen: number | null
  patientenKeuze: string | null
  afdeling: string | null
  hogeschool: string | null
  provincie: string | null
  stappen: number | null
  superkracht: SuperkrachtSlug | null
  naam: string
}

const LEEG: Antw = {
  rol: null, dienst: null, tewerkstelling: null,
  nachtdiensten: 0, weekends: 0, stageUren: 0, stageplaatsen: null,
  patientenKeuze: null, afdeling: null, hogeschool: null, provincie: null,
  stappen: null, superkracht: null, naam: '',
}

// ─── Navigatielogica ──────────────────────────────────────────────────────────

const FLOW_ZH: Step[]  = ['rol','dienst','tewerkstelling','nachtdiensten','weekends','patienten','afdeling','provincie','stappen','superkracht','naam','laden']
const FLOW_ST: Step[]  = ['rol','stage_uren','stageplaatsen','nachtdiensten','afdeling','hogeschool','provincie','stappen','superkracht','naam','laden']

function flow(rol: Rol | null) { return rol === 'student' ? FLOW_ST : FLOW_ZH }

function volgende(step: Step, ant: Antw): Step {
  if (step === 'start') return 'rol'
  const f = flow(ant.rol)
  const i = f.indexOf(step)
  return i >= 0 && i < f.length - 1 ? f[i + 1] : 'laden'
}

function vorige(step: Step, ant: Antw): Step {
  if (step === 'rol') return 'start'
  const f = flow(ant.rol)
  const i = f.indexOf(step)
  return i > 0 ? f[i - 1] : 'start'
}

function balk(step: Step, rol: Rol | null): number {
  if (rol === 'student') {
    const m: Partial<Record<Step,number>> = { rol:1,stage_uren:2,stageplaatsen:3,nachtdiensten:4,afdeling:5,hogeschool:6,provincie:7,stappen:8,superkracht:9,naam:9 }
    return m[step] ?? 0
  }
  const m: Partial<Record<Step,number>> = { rol:1,dienst:2,tewerkstelling:2,nachtdiensten:3,weekends:4,patienten:5,afdeling:6,provincie:7,stappen:8,superkracht:9,naam:9 }
  return m[step] ?? 0
}

// ─── Kleuren ──────────────────────────────────────────────────────────────────

const BG      = '#1C2A20'
const SURF    = '#2A3D2E'
const CLAY    = '#B65436'
const BUTTER  = '#E8D08A'
const CREAM   = 'rgba(247,243,234,0.9)'
const MUTED   = 'rgba(247,243,234,0.45)'
const DIM     = 'rgba(247,243,234,0.25)'
const BORDER  = 'rgba(232,208,138,0.2)'
const F       = '"Bricolage Grotesque",-apple-system,sans-serif'
const SERIF   = '"Fraunces",Georgia,serif'

const PROVINCIES = ['Antwerpen','Limburg','Oost-Vlaanderen','Vlaams-Brabant','West-Vlaanderen']

// ─── Hulpcomponenten ──────────────────────────────────────────────────────────

function Vraag({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ margin:'0 0 28px', fontSize:'clamp(22px,6vw,30px)', fontFamily:SERIF, color:BUTTER, lineHeight:1.2, fontWeight:800, textWrap:'balance' } as React.CSSProperties}>
      {children}
    </h2>
  )
}

function Knop({ selected, onClick, label, sub }: { selected:boolean; onClick:()=>void; label:string; sub?:string }) {
  return (
    <button onClick={onClick} style={{ display:'block',width:'100%',padding:'14px 18px', background:selected?BUTTER:SURF, color:selected?'#1A1A17':CREAM, border:`2px solid ${selected?BUTTER:BORDER}`, borderRadius:12, fontFamily:F, cursor:'pointer', textAlign:'left', minHeight:sub?64:52 }}>
      <span style={{ display:'block', fontWeight:700, fontSize:17, lineHeight:1.2 }}>{label}</span>
      {sub && <span style={{ display:'block', fontSize:13, opacity:0.7, marginTop:3 }}>{sub}</span>}
    </button>
  )
}

function VolgendeKnop({ onClick, label='Volgende →' }: { onClick:()=>void; label?:string }) {
  return (
    <button onClick={onClick} style={{ display:'block',width:'100%',padding:'16px 24px',background:CLAY,color:'#FBF8F2',border:'none',borderRadius:12,fontSize:17,fontWeight:700,fontFamily:F,cursor:'pointer',marginTop:16,minHeight:52 }}>
      {label}
    </button>
  )
}

function Schuifbalk({ waarde, min, max, stap=1, label, onChange, onVolgende }: {
  waarde:number; min:number; max:number; stap?:number
  label:(n:number)=>string; onChange:(n:number)=>void; onVolgende:()=>void
}) {
  return (
    <>
      <div style={{ textAlign:'center', marginBottom:8 }}>
        <span style={{ fontSize:'clamp(48px,14vw,80px)', fontFamily:SERIF, color:BUTTER, fontWeight:800, lineHeight:1 }}>{waarde}</span>
        <p style={{ margin:'6px 0 0', fontSize:16, color:CREAM }}>{label(waarde)}</p>
      </div>
      <input type="range" min={min} max={max} step={stap} value={waarde}
        onChange={e=>onChange(Number(e.target.value))}
        style={{ width:'100%', accentColor:BUTTER, margin:'16px 0 4px', cursor:'pointer' }} />
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:DIM }}>
        <span>{min}</span><span>{max}</span>
      </div>
      <VolgendeKnop onClick={onVolgende} />
    </>
  )
}

function StappenVeld({ waarde, onChange, onVolgende, onOverslaan }: {
  waarde:number|null; onChange:(n:number|null)=>void; onVolgende:()=>void; onOverslaan:()=>void
}) {
  const [rauwe, setRauwe] = useState(waarde!=null?String(waarde):'')
  const [warn,  setWarn]  = useState('')

  function verwerk(v:string) {
    setRauwe(v)
    const n = parseInt(v,10)
    if (!v||isNaN(n)) { onChange(null); setWarn(''); return }
    if (n>40000) { setWarn('Klopt dat? Dat is een marathon per dienst.'); onChange(null); return }
    setWarn(''); onChange(n)
  }

  return (
    <>
      <input type="number" min={0} max={40000} placeholder="Bijv. 8000" value={rauwe}
        onChange={e=>verwerk(e.target.value)} autoFocus
        style={{ display:'block',width:'100%',padding:'14px 16px',background:SURF,color:CREAM,border:`2px solid ${BORDER}`,borderRadius:12,fontSize:20,fontFamily:F,outline:'none',boxSizing:'border-box' }} />
      {warn && <p style={{ margin:'8px 0 0',fontSize:13,color:'#E8A07A' }}>{warn}</p>}
      {waarde!=null && !warn && <VolgendeKnop onClick={onVolgende} />}
      <button onClick={onOverslaan} style={{ display:'block',width:'100%',padding:'12px 24px',background:'transparent',color:MUTED,border:`1px solid ${BORDER}`,borderRadius:12,fontSize:15,fontFamily:F,cursor:'pointer',marginTop:10,minHeight:48 }}>
        Weet ik niet, sla over →
      </button>
    </>
  )
}

// ─── Hoofdcomponent ───────────────────────────────────────────────────────────

type PluimBanner = { van: string; naam: string; icoon: string }

export default function WrappedPage() {
  const [step,      setStep]      = useState<Step>('start')
  const [ant,       setAnt]       = useState<Antw>(LEEG)
  const [reactie,   setReactie]   = useState<string|null>(null)
  const [teller,    setTeller]    = useState<number|null>(null)
  const [perProv,   setPerProv]   = useState<Record<string,number>>({})
  const [perSchool, setPerSchool] = useState<Record<string,number>>({})
  const [laad,      setLaad]      = useState(0)
  const [pluim,     setPluim]     = useState<PluimBanner|null>(null)
  const completeFired = useRef(false)

  // Sessie herstellen + pluim URL params lezen
  useEffect(() => {
    try {
      const s = sessionStorage.getItem('zw_state')
      if (s) {
        const p = JSON.parse(s)
        if (p.ant)  setAnt(p.ant)
        if (p.step && p.step !== 'laden') setStep(p.step)
      }
    } catch {}
    fetch('/api/wrapped/stats').then(r=>r.json()).then(d=>{
      setTeller(d.total??null)
      setPerProv(d.per_provincie??{})
      setPerSchool(d.per_school??{})
    }).catch(()=>{})
    // UTM-params bewaren voor lead-API
    captureAndStoreUtms()
    // Pixel: ViewContent bij eerste bezoek
    trackMeta('ViewContent', { content_name: 'ZorgWrapped2026', content_category: 'wrapped' })
    trackTikTok('ViewContent', { content_name: 'ZorgWrapped2026' })
    // Pluim-link: ?van=Naam&sk=rots
    try {
      const params = new URLSearchParams(window.location.search)
      const van = params.get('van')
      const sk  = params.get('sk')
      if (van && sk) {
        const gevonden = SUPERKRACHTEN.find(s => s.slug === sk)
        if (gevonden) setPluim({ van: decodeURIComponent(van), naam: gevonden.naam, icoon: gevonden.icoon })
      }
    } catch {}
  }, [])

  // Sessie opslaan
  useEffect(() => {
    try { sessionStorage.setItem('zw_state', JSON.stringify({ step, ant })) } catch {}
  }, [step, ant])

  // Laadscherm animatie + complete API call
  useEffect(() => {
    if (step !== 'laden') { setLaad(0); return }
    // Fire complete once per session
    if (!completeFired.current) {
      completeFired.current = true
      fetch('/api/wrapped/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ant) }).catch(() => {})
      // Pixel: flow voltooid
      trackMetaCustom('WrappedCompleted', { rol: ant.rol ?? undefined })
      trackTikTok('CompleteRegistration', { content_name: 'ZorgWrapped2026' })
    }
    let i = 0
    const t = setInterval(() => {
      i++; setLaad(i)
      if (i >= COPY.laadRegels.length) {
        clearInterval(t)
        setTimeout(() => setStep('slides'), 700)
      }
    }, 1300)
    return () => clearInterval(t)
  }, [step, ant])

  function kies(patch: Partial<Antw>, r: string) {
    const nieuw = { ...ant, ...patch }
    setAnt(nieuw)
    setReactie(r)
    setTimeout(() => { setReactie(null); setStep(prev => volgende(prev, nieuw)) }, 800)
  }

  function gaVoort() { setStep(prev => volgende(prev, ant)) }
  function gaTerug() { setStep(prev => prev === 'laden' ? prev : vorige(prev, ant)) }

  // ─── Reactie-overlay ───────────────────────────────────────────────────────
  if (reactie) {
    return (
      <main style={{ minHeight:'100dvh',background:BG,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',fontFamily:F }}>
        <p style={{ textAlign:'center',fontSize:'clamp(26px,8vw,42px)',fontFamily:SERIF,color:BUTTER,fontWeight:800,maxWidth:360,lineHeight:1.2,margin:0 }}>
          {reactie}
        </p>
      </main>
    )
  }

  // ─── Startscherm ──────────────────────────────────────────────────────────
  if (step === 'start') {
    const toonT = teller!=null && teller>=MIN_COMPLETIONS_VOOR_TELLER
    return (
      <main style={{ minHeight:'100dvh',background:BG,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px',fontFamily:F }}>
        <div style={{ maxWidth:400,width:'100%' }}>
          {/* Pluim-banner */}
          {pluim && (
            <div style={{ marginBottom:28, padding:'16px', background:'rgba(232,208,138,0.1)', border:'1px solid rgba(232,208,138,0.3)', borderRadius:12 }}>
              <p style={{ margin:'0 0 6px', fontSize:24, lineHeight:1 }}>{pluim.icoon}</p>
              <p style={{ margin:'0 0 4px', fontSize:15, fontWeight:700, color:BUTTER, fontFamily:SERIF }}>
                {pluim.van} gaf je de superkracht &ldquo;{pluim.naam}&rdquo;
              </p>
              <p style={{ margin:0, fontSize:13, color:MUTED, fontFamily:F }}>
                Maak nu jouw eigen Zorg Wrapped. 💙
              </p>
            </div>
          )}
          <p style={{ margin:'0 0 20px',fontSize:12,color:'rgba(232,208,138,0.65)',textTransform:'uppercase',letterSpacing:'0.14em',fontWeight:600 }}>Zorg Wrapped 2026</p>
          <h1 style={{ margin:'0 0 16px',fontSize:'clamp(28px,7vw,40px)',fontFamily:SERIF,color:BUTTER,lineHeight:1.15,fontWeight:800,textWrap:'balance' } as React.CSSProperties}>
            {COPY.startTitel}
          </h1>
          <p style={{ margin:'0 0 36px',fontSize:17,color:CREAM,lineHeight:1.6 }}>{COPY.startSubtekst}</p>
          <button onClick={()=>setStep('rol')} style={{ display:'block',width:'100%',padding:'18px 24px',background:CLAY,color:'#FBF8F2',border:'none',borderRadius:12,fontSize:18,fontWeight:700,fontFamily:F,cursor:'pointer',minHeight:56 }}>
            {COPY.startKnop}
          </button>
          {toonT && <p style={{ textAlign:'center',fontSize:13,color:MUTED,marginTop:14 }}>{teller?.toLocaleString('nl-BE')} {COPY.startTellerSuffix}</p>}
          <p style={{ textAlign:'center',fontSize:12,color:DIM,marginTop:48,lineHeight:1.5 }}>{COPY.footerTekst}</p>
        </div>
      </main>
    )
  }

  // ─── Laadscherm ───────────────────────────────────────────────────────────
  if (step === 'laden') {
    return (
      <main style={{ minHeight:'100dvh',background:BG,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px',fontFamily:F }}>
        <div style={{ textAlign:'center',maxWidth:360 }}>
          {COPY.laadRegels.map((r,i) => (
            <p key={i} style={{ fontSize:'clamp(18px,5vw,26px)',fontFamily:SERIF,fontWeight:700,color:i<laad?BUTTER:'rgba(232,208,138,0.2)',margin:'0 0 20px',transition:'color 0.5s',lineHeight:1.3 }}>{r}</p>
          ))}
        </div>
      </main>
    )
  }

  // ─── Slides (Fase 4) ──────────────────────────────────────────────────────
  if (step === 'slides') {
    return (
      <Slides
        ant={ant as Antwoorden}
        perProv={perProv}
        perSchool={perSchool}
        onOpnieuw={() => {
          setStep('start')
          setAnt(LEEG)
          completeFired.current = false
          try { sessionStorage.removeItem('zw_state') } catch {}
        }}
      />
    )
  }

  // ─── Vragenflow ───────────────────────────────────────────────────────────
  const pos = balk(step, ant.rol)

  return (
    <main style={{ minHeight:'100dvh',background:BG,display:'flex',flexDirection:'column',padding:'20px 20px 48px',fontFamily:F }}>
      <div style={{ maxWidth:440,width:'100%',margin:'0 auto' }}>

        {/* Terugknop */}
        <button onClick={gaTerug} aria-label="Terug" style={{ background:'none',border:'none',color:MUTED,fontSize:15,cursor:'pointer',padding:'0 0 14px',fontFamily:F }}>
          ← Terug
        </button>

        {/* Voortgangsbalk */}
        {pos>0 && (
          <div style={{ display:'flex',gap:4,marginBottom:28 }}>
            {Array.from({length:9},(_,i)=>(
              <div key={i} style={{ flex:1,height:3,borderRadius:2,background:i<pos?BUTTER:BORDER,transition:'background 0.3s' }} />
            ))}
          </div>
        )}

        {/* 1 — ROL */}
        {step==='rol' && <>
          <Vraag>Wie ben jij?</Vraag>
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            <Knop selected={ant.rol==='ziekenhuis'} onClick={()=>kies({rol:'ziekenhuis'},'Mooi, verpleegkundige! 💙')} label="Ziekenhuisverpleegkundige" sub="Ik werk in een ziekenhuis" />
            <Knop selected={ant.rol==='student'}    onClick={()=>kies({rol:'student'},'Welkom, student! 🎓')}       label="Laatste­jaar­student verpleegkunde" sub="Ik loop stage" />
          </div>
        </>}

        {/* 2 (ziekenhuis) — DIENST */}
        {step==='dienst' && <>
          <Vraag>Op welke dienst voel jij je het best?</Vraag>
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            {[{v:'vroege',e:'🌅',l:'Vroege dienst',s:'Vroeg op, vroeg klaar'},{v:'late',e:'🌇',l:'Late dienst',s:'De rustige ochtend is voor anderen'},{v:'nacht',e:'🌙',l:'Nachtdienst',s:"Om 3 uur 's nachts op je scherpst"}].map(o=>(
              <Knop key={o.v} selected={ant.dienst===o.v} onClick={()=>kies({dienst:o.v},o.v==='nacht'?'De Nachtuil strikes again. 🦉':'Goed gekozen!')} label={`${o.e} ${o.l}`} sub={o.s} />
            ))}
          </div>
        </>}

        {/* 2b (ziekenhuis) — TEWERKSTELLING */}
        {step==='tewerkstelling' && <>
          <Vraag>Hoeveel werk je?</Vraag>
          <p style={{ margin:'-16px 0 24px',fontSize:14,color:MUTED }}>Je tewerkstellingspercentage</p>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
            {['50%','75%','80%','100%'].map(o=>(
              <button key={o} onClick={()=>kies({tewerkstelling:o},o==='100%'?'Voltijds! 💪':'Goed te weten!')}
                style={{ padding:'18px 8px',background:ant.tewerkstelling===o?BUTTER:SURF,color:ant.tewerkstelling===o?'#1A1A17':CREAM,border:`2px solid ${ant.tewerkstelling===o?BUTTER:BORDER}`,borderRadius:12,fontSize:22,fontWeight:700,fontFamily:F,cursor:'pointer',minHeight:64,textAlign:'center' }}>
                {o}
              </button>
            ))}
          </div>
        </>}

        {/* 3/4 — NACHTDIENSTEN */}
        {step==='nachtdiensten' && <>
          <Vraag>{ant.rol==='student'?'Hoeveel nachtdiensten deed je tijdens je stage?':'Hoeveel nachtdiensten draaide je dit jaar?'}</Vraag>
          <Schuifbalk waarde={ant.nachtdiensten} min={0} max={ant.rol==='student'?60:150}
            label={n=>`${n} nachtdienst${n!==1?'en':''}`}
            onChange={n=>setAnt(a=>({...a,nachtdiensten:n}))}
            onVolgende={()=>kies({},ant.nachtdiensten>40?COPY.miniReacties.nachtenVeel:ant.nachtdiensten===0?COPY.miniReacties.nachtenNul:`${ant.nachtdiensten} nachten! 🌙`)}
          />
        </>}

        {/* 4 (ziekenhuis) — WEEKENDS */}
        {step==='weekends' && <>
          <Vraag>Hoeveel weekends werkte je?</Vraag>
          <Schuifbalk waarde={ant.weekends} min={0} max={52}
            label={n=>`${n} weekend${n!==1?'s':''}`}
            onChange={n=>setAnt(a=>({...a,weekends:n}))}
            onVolgende={()=>kies({},ant.weekends>20?COPY.miniReacties.weekendsVeel:'Zo gaan we!')}
          />
        </>}

        {/* 2 (student) — STAGE-UREN */}
        {step==='stage_uren' && <>
          <Vraag>Hoeveel uur liep je stage dit jaar?</Vraag>
          <Schuifbalk waarde={ant.stageUren} min={0} max={1200} stap={10}
            label={n=>`${n} uur`}
            onChange={n=>setAnt(a=>({...a,stageUren:n}))}
            onVolgende={()=>kies({},`${ant.stageUren} uur! Dat zijn ${Math.round(ant.stageUren/8)} werkdagen 💪`)}
          />
        </>}

        {/* 3 (student) — STAGEPLAATSEN */}
        {step==='stageplaatsen' && <>
          <Vraag>Op hoeveel stageplaatsen stond je al?</Vraag>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8 }}>
            {[1,2,3,4,5].map(n=>(
              <button key={n} onClick={()=>kies({stageplaatsen:n},n>=4?'Veel ervaring!':'Elke plek leert je iets!')}
                style={{ padding:'16px 4px',background:ant.stageplaatsen===n?BUTTER:SURF,color:ant.stageplaatsen===n?'#1A1A17':CREAM,border:`2px solid ${ant.stageplaatsen===n?BUTTER:BORDER}`,borderRadius:12,fontSize:22,fontWeight:700,fontFamily:F,cursor:'pointer',minHeight:60,textAlign:'center' }}>
                {n===5?'5+':n}
              </button>
            ))}
          </div>
        </>}

        {/* 5 (ziekenhuis) — PATIËNTEN */}
        {step==='patienten' && <>
          <Vraag>Voor hoeveel patiënten zorg je op een gemiddelde dienst?</Vraag>
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            {[{v:'<8',l:'Minder dan 8 patiënten'},{v:'8-12',l:'8 tot 12 patiënten'},{v:'12-16',l:'12 tot 16 patiënten'},{v:'16+',l:'Meer dan 16 patiënten'}].map(o=>(
              <Knop key={o.v} selected={ant.patientenKeuze===o.v} onClick={()=>kies({patientenKeuze:o.v},o.v==='16+'?COPY.miniReacties.patientenVeel:'Genoteerd!')} label={o.l} />
            ))}
          </div>
        </>}

        {/* 6/5 — AFDELING */}
        {step==='afdeling' && <>
          <Vraag>{ant.rol==='student'?'Wat was je favoriete afdeling?':'Op welke afdeling werk je?'}</Vraag>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
            {AFDELINGEN.map(a=>(
              <button key={a} onClick={()=>kies({afdeling:a},'Goede keuze!')}
                style={{ padding:'14px 10px',background:ant.afdeling===a?BUTTER:SURF,color:ant.afdeling===a?'#1A1A17':CREAM,border:`2px solid ${ant.afdeling===a?BUTTER:BORDER}`,borderRadius:12,fontSize:15,fontWeight:ant.afdeling===a?700:400,fontFamily:F,cursor:'pointer',minHeight:52,textAlign:'center' }}>
                {a}
              </button>
            ))}
          </div>
        </>}

        {/* 6 (student) — HOGESCHOOL */}
        {step==='hogeschool' && <>
          <Vraag>Aan welke hogeschool studeer je?</Vraag>
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            {HOGESCHOLEN.map(h=>(
              <button key={h.slug} onClick={()=>kies({hogeschool:h.slug},'Mooie hogeschool!')}
                style={{ padding:'13px 16px',background:ant.hogeschool===h.slug?BUTTER:SURF,color:ant.hogeschool===h.slug?'#1A1A17':CREAM,border:`2px solid ${ant.hogeschool===h.slug?BUTTER:BORDER}`,borderRadius:12,fontSize:15,fontWeight:ant.hogeschool===h.slug?700:400,fontFamily:F,cursor:'pointer',minHeight:50,textAlign:'left' }}>
                {h.naam}
              </button>
            ))}
          </div>
        </>}

        {/* 7 — PROVINCIE */}
        {step==='provincie' && <>
          <Vraag>{ant.rol==='student'?'In welke provincie woon je?':'In welke provincie werk je?'}</Vraag>
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
            {PROVINCIES.map(p=>(
              <Knop key={p} selected={ant.provincie===p.toLowerCase()} onClick={()=>kies({provincie:p.toLowerCase()},'Mooie provincie!')} label={p} />
            ))}
          </div>
        </>}

        {/* 8 — STAPPEN */}
        {step==='stappen' && <>
          <Vraag>Kijk eens op je smartwatch of gsm: hoeveel stappen zet je op een dienst?</Vraag>
          <p style={{ margin:'-16px 0 20px',fontSize:14,color:MUTED }}>Optioneel — je kan ook overslaan.</p>
          <StappenVeld
            waarde={ant.stappen}
            onChange={n=>setAnt(a=>({...a,stappen:n}))}
            onVolgende={()=>kies({},COPY.miniReacties.stappenIngevuld)}
            onOverslaan={()=>kies({stappen:null},COPY.miniReacties.stappenOvergeslagen)}
          />
        </>}

        {/* 9 — SUPERKRACHT */}
        {step==='superkracht' && <>
          <Vraag>{COPY.superkrachtVraag}</Vraag>
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
            {SUPERKRACHTEN.map(sk=>(
              <button key={sk.slug} onClick={()=>kies({superkracht:sk.slug as SuperkrachtSlug},COPY.miniReacties.superkrachtGekozen)}
                style={{ padding:'14px 16px',background:ant.superkracht===sk.slug?BUTTER:SURF,color:ant.superkracht===sk.slug?'#1A1A17':CREAM,border:`2px solid ${ant.superkracht===sk.slug?BUTTER:BORDER}`,borderRadius:14,fontFamily:F,cursor:'pointer',minHeight:72,textAlign:'left' }}>
                <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                  <span style={{ fontSize:26,lineHeight:1,flexShrink:0 }}>{sk.icoon}</span>
                  <div>
                    <div style={{ fontSize:16,fontWeight:700,lineHeight:1.2 }}>{sk.naam}</div>
                    <div style={{ fontSize:13,opacity:0.75,marginTop:4,lineHeight:1.4 }}>{sk.uitleg}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>}

        {/* NAAM */}
        {step==='naam' && <>
          <Vraag>Hoe heet je? (komt op je kaart)</Vraag>
          <p style={{ margin:'-16px 0 20px',fontSize:14,color:MUTED }}>Optioneel — je kan ook doorgaan zonder naam.</p>
          <input type="text" maxLength={20} placeholder="Jouw voornaam" value={ant.naam}
            onChange={e=>setAnt(a=>({...a,naam:e.target.value}))}
            onKeyDown={e=>{if(e.key==='Enter')gaVoort()}}
            autoFocus
            style={{ display:'block',width:'100%',padding:'14px 16px',background:SURF,color:CREAM,border:`2px solid ${BORDER}`,borderRadius:12,fontSize:20,fontFamily:F,outline:'none',boxSizing:'border-box' }} />
          <VolgendeKnop onClick={gaVoort} label={ant.naam.trim()?'Dit is mijn kaart →':'Doorgaan zonder naam →'} />
        </>}

        <p style={{ marginTop:48,fontSize:12,color:DIM,textAlign:'center',lineHeight:1.5 }}>{COPY.footerTekst}</p>
      </div>
    </main>
  )
}
