import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Plus, 
  Send, 
  UserCheck, 
  Info, 
  Lock, 
  Sparkles, 
  PartyPopper,
  ArrowRight
} from 'lucide-react';
import CategoryCard from './components/CategoryCard';
import InspirationPills from './components/InspirationPills';
import AdminPanel from './components/AdminPanel';
import { submitNominations } from './services/storage';

export default function App() {
  const [userName, setUserName] = useState('');
  const [categories, setCategories] = useState([
    { id: 'cat_1', title: '', description: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);

  // Add new empty category card box
  const handleAddCategory = (initialTitle = '', initialDesc = '') => {
    const newId = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setCategories(prev => [...prev, { id: newId, title: initialTitle, description: initialDesc }]);
  };

  // Remove a category card box
  const handleRemoveCategory = (id) => {
    if (categories.length === 1) return; // Keep at least one
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // Update category title
  const handleUpdateTitle = (id, newTitle) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
  };

  // Update category description
  const handleUpdateDescription = (id, newDesc) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, description: newDesc } : c));
  };

  // Click on inspiration pill
  const handleSelectIdea = (ideaText) => {
    // If first category is empty, set it. Otherwise add a new category card box!
    const firstEmpty = categories.find(c => c.title.trim() === '');
    if (firstEmpty) {
      handleUpdateTitle(firstEmpty.id, ideaText);
    } else {
      handleAddCategory(ideaText, '');
    }
  };

  // Submit nominations
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userName.trim()) {
      alert('⚠️ Por favor, escribe tu nombre o apodo para registrar tus nominaciones.');
      return;
    }

    const validCategories = categories.filter(c => c.title.trim().length > 0);

    if (validCategories.length === 0) {
      alert('⚠️ Por favor, añade al menos una categoría con nombre.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await submitNominations(userName, validCategories);
      
      // Trigger festive celebration confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFC107', '#7C3AED', '#EC4899', '#FFFFFF']
      });

      setSubmittedCount(res.count);
      setIsSuccess(true);
    } catch (err) {
      alert(`❌ Error al guardar nominaciones: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form for another submission if needed
  const handleReset = () => {
    setCategories([{ id: `cat_${Date.now()}`, title: '', description: '' }]);
    setIsSuccess(false);
  };

  return (
    <div className="app-container">
      {/* Header Section */}
      <header className="header-section">
        <div className="badge-year">
          <Trophy size={15} /> Alfombra Roja 2026
        </div>

        <h1 className="main-title">
          Premios Losver Gacorta 2026
          <span className="sub-title-tag text-gold-gradient">
            nominación de categorías
          </span>
        </h1>
      </header>

      {/* Main Content Form */}
      {!isSuccess ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Explanation Banner */}
          <div className="info-card">
            <div className="info-icon">
              <Info size={24} />
            </div>
            <div className="info-text">
              <strong>¿Cómo funciona la nominación?</strong><br />
              Ingresa tu nombre y propone todas las categorías graciosas o míticas que quieras. 
              <br /><br />
              📌 <strong>Regla de Selección</strong>: Para que una categoría sea seleccionada oficialmente para el día de la votación, <strong>debe ser nominada por al menos 2 personas</strong> del grupo. ¡Compártela o coincide con tus amigos!
            </div>
          </div>

          {/* User Registration Name Input */}
          <div className="user-box">
            <label className="label-title">
              <UserCheck size={18} style={{ color: 'var(--gold-primary)' }} />
              Paso 1: Tu Nombre / Apodo para registrarte
            </label>
            <input 
              type="text"
              className="input-field"
              placeholder="Escribe tu nombre o apodo (ej: Juan, El Rata, etc.)"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
          </div>

          {/* Dynamic Categories Container */}
          <div className="categories-container">
            <label className="label-title" style={{ paddingLeft: '4px' }}>
              <Sparkles size={18} style={{ color: 'var(--gold-primary)' }} />
              Paso 2: Escribe tus categorías para los premios
            </label>

            {categories.map((cat, index) => (
              <CategoryCard 
                key={cat.id}
                index={index}
                category={cat}
                onUpdateTitle={handleUpdateTitle}
                onUpdateDescription={handleUpdateDescription}
                onRemove={handleRemoveCategory}
                canRemove={categories.length > 1}
              />
            ))}

            {/* Add Category Button (Underneath category cards) */}
            <button 
              type="button"
              className="btn-add-category"
              onClick={() => handleAddCategory()}
            >
              <Plus size={20} /> Añadir categoría
            </button>
          </div>

          {/* Inspiration Pills */}
          <InspirationPills onSelectIdea={handleSelectIdea} />

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              'Guardando nominaciones...'
            ) : (
              <>
                <Send size={20} /> Enviar mis nominaciones
              </>
            )}
          </button>
        </form>
      ) : (
        /* Success Screen */
        <div className="success-screen">
          <div className="success-icon-wrapper">
            <PartyPopper size={36} />
          </div>

          <h2 style={{ fontSize: '1.6rem', color: 'var(--text-main)' }}>
            ¡Nominaciones Registradas!
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '400px' }}>
            Gracias, <strong style={{ color: 'var(--gold-light)' }}>{userName}</strong>. Has enviado <strong>{submittedCount} categoría(s)</strong> para los Premios Losver Gacorta 2026.
          </p>

          <div style={{ background: 'rgba(255, 193, 7, 0.08)', padding: '14px', borderRadius: '14px', border: '1px solid var(--border-gold)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            🔒 Tus respuestas están guardadas de forma segura. Si otra persona nomina la misma categoría, pasará a la lista final de votaciones.
          </div>

          <button 
            onClick={handleReset}
            className="btn-add-category"
            style={{ borderStyle: 'solid', marginTop: '10px' }}
          >
            Añadir más categorías o corregir <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Secret Admin Footer Trigger */}
      <footer className="footer-admin-trigger">
        <span>Premios Losver Gacorta 2026</span>
        <span>•</span>
        <button 
          type="button"
          className="btn-admin-link"
          onClick={() => setShowAdmin(true)}
        >
          <Lock size={12} /> Zona Organización (Admin)
        </button>
      </footer>

      {/* Admin Secret Panel Modal */}
      <AdminPanel 
        isOpen={showAdmin}
        onClose={() => setShowAdmin(false)}
      />
    </div>
  );
}
