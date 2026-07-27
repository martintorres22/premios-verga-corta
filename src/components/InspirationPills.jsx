import React from 'react';
import { Lightbulb } from 'lucide-react';

const PRESET_IDEAS = [
  "🍺 El más borracho del año",
  "🔥 Momento más épico",
  "💔 El rompecorazones / Más ligón",
  "🤡 Rey de las excusas",
  "📱 Más adicto al móvil",
  "🏎️ El más tardón",
  "💸 El más tacaño / rata",
  "🏆 MVP del grupo 2026",
  "🎭 El más dramático",
  "😴 El primero en dormirse en la fiesta",
  "🚑 El más propenso a accidentes",
  "🎙️ Mejor frase del año"
];

export default function InspirationPills({ onSelectIdea }) {
  return (
    <div className="suggestions-section" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
      <div className="suggestions-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gold-light)' }}>
        <Lightbulb size={14} /> Ideas rápidas para inspirarte (haz clic para añadir):
      </div>
      <div className="pills-wrapper">
        {PRESET_IDEAS.map((idea, i) => (
          <button 
            key={i} 
            type="button"
            className="pill-btn"
            onClick={() => onSelectIdea(idea)}
          >
            {idea}
          </button>
        ))}
      </div>
    </div>
  );
}
