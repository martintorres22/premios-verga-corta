import React from 'react';
import { Trash2, Trophy, Sparkles } from 'lucide-react';

export default function CategoryCard({ 
  index, 
  category, 
  onUpdateTitle, 
  onUpdateDescription, 
  onRemove, 
  canRemove 
}) {
  return (
    <div className="category-card">
      <div className="card-header">
        <div className="category-number">
          Categoría #{index + 1}
        </div>
        {canRemove && (
          <button 
            type="button"
            className="btn-remove" 
            onClick={() => onRemove(category.id)}
            title="Eliminar esta categoría"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Main Title Input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label className="label-title" style={{ fontSize: '0.85rem' }}>
          <Trophy size={14} style={{ color: 'var(--gold-primary)' }} /> Nombre de la categoría
        </label>
        <input 
          type="text"
          className="input-field"
          placeholder="Ej: El más borracho, Momento más épico, etc."
          value={category.title}
          onChange={(e) => onUpdateTitle(category.id, e.target.value)}
          required
        />
      </div>

      {/* Optional Description / Context Input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={12} style={{ color: 'var(--gold-light)' }} /> Nota o contexto divertido (opcional)
        </label>
        <input 
          type="text"
          className="input-field"
          style={{ fontSize: '0.88rem', padding: '10px 14px' }}
          placeholder="Ej: Para premiar a quien más se cayó este año..."
          value={category.description}
          onChange={(e) => onUpdateDescription(category.id, e.target.value)}
        />
      </div>
    </div>
  );
}
