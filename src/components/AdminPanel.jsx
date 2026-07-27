import React, { useState, useEffect, useCallback } from 'react';
import { 
  fetchAdminData, 
  DEFAULT_ADMIN_PIN, 
  clearLocalSubmissions
} from '../services/storage';
import { 
  Lock, 
  Unlock, 
  X, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  FileSpreadsheet, 
  FileCode, 
  Share2,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

export default function AdminPanel({ isOpen, onClose }) {
  const [pinInput, setPinInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('qualified'); // 'qualified', 'all', 'users'

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await fetchAdminData(pinInput.trim() || DEFAULT_ADMIN_PIN);
    if (res.success) {
      setAdminData(res);
    }
    setLoading(false);
  }, [pinInput]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    const res = await fetchAdminData(pinInput.trim());
    if (res.success) {
      setIsAuthenticated(true);
      setAdminData(res);
    } else {
      setErrorMsg(res.error || 'PIN incorrecto');
    }
    setLoading(false);
  };

  const handleExportCSV = () => {
    if (!adminData || !adminData.data) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Categoría,Nominaciones,Elegible (2+),Nominado Por,Notas/Descripción\n';

    adminData.data.forEach(item => {
      const title = `"${item.title.replace(/"/g, '""')}"`;
      const count = item.nominatorCount;
      const qualified = item.isQualified ? 'SI' : 'NO';
      const nominators = `"${item.nominators.join(', ').replace(/"/g, '""')}"`;
      const descriptions = `"${item.descriptions.join(' | ').replace(/"/g, '""')}"`;

      csvContent += `${title},${count},${qualified},${nominators},${descriptions}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Premios_Losver_Gacorta_2026_Nominaciones_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (!adminData) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(adminData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `losver_nominaciones_fase1_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopySummary = () => {
    if (!adminData || !adminData.data) return;
    const qualified = adminData.data.filter(c => c.isQualified);
    
    let text = `🏆 *PREMIOS LOSVER GACORTA 2026 - CATEGORÍAS SELECCIONADAS (FASE 1)* 🏆\n\n`;
    text += `¡Ya tenemos las categorías elegidas por al menos 2 personas para la gala!\n\n`;
    
    qualified.forEach((c, idx) => {
      text += `${idx + 1}. *${c.title}* (${c.nominatorCount} personas)\n`;
    });

    text += `\nTotal categorías para votación: ${qualified.length}\n¡Pronto la Fase 2 de Votaciones! 🔥`;

    navigator.clipboard.writeText(text);
    alert('¡Resumen para WhatsApp copiado al portapapeles!');
  };

  const handleClearData = () => {
    if (window.confirm('⚠️ ¿Estás seguro de que quieres borrar los datos de la memoria local? (No afectará a Supabase si lo tienes activo)')) {
      clearLocalSubmissions();
      loadData();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay">
      <div className="admin-card">
        {/* Header */}
        <div className="admin-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--gold-primary)' }}>
              {isAuthenticated ? <Unlock size={22} /> : <Lock size={22} />}
            </span>
            <h3 style={{ fontSize: '1.2rem' }}>Panel de Organización Secreto</h3>
          </div>
          <button className="btn-remove" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Login Form if not logged in */}
        {!isAuthenticated ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '12px 0' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Ingresa el PIN de administrador para consultar y exportar las nominaciones recibidas.
            </p>

            <input 
              type="password"
              className="input-field"
              placeholder="Introduce tu PIN secret..."
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              autoFocus
            />

            {errorMsg && (
              <div style={{ color: '#F87171', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={16} /> {errorMsg}
              </div>
            )}

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Verificando...' : 'Acceder al Panel'}
            </button>
          </form>
        ) : (
          /* Logged In Admin Dashboard */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Stats Overview Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--gold-primary)' }}>
                  {adminData?.totalSubmissions || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Amigos participantes</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {adminData?.data?.length || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Categorías únicas</div>
              </div>

              <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#4ADE80' }}>
                  {adminData?.qualifiedCount || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#4ADE80' }}>Pasan a votación (2+)</div>
              </div>
            </div>

            {/* Actions Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button 
                onClick={handleExportCSV}
                className="pill-btn"
                style={{ background: 'rgba(255,193,7,0.15)', borderColor: 'var(--border-gold)', color: 'var(--gold-primary)' }}
              >
                <FileSpreadsheet size={15} /> Exportar CSV
              </button>

              <button 
                onClick={handleExportJSON}
                className="pill-btn"
              >
                <FileCode size={15} /> Exportar JSON (Fase 2)
              </button>

              <button 
                onClick={handleCopySummary}
                className="pill-btn"
              >
                <Share2 size={15} /> Copiar para WhatsApp
              </button>

              <button 
                onClick={loadData}
                className="pill-btn"
                title="Actualizar datos"
              >
                <RefreshCw size={15} /> Actualizar
              </button>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
              <button 
                className={`pill-btn ${activeTab === 'qualified' ? 'active' : ''}`}
                onClick={() => setActiveTab('qualified')}
                style={activeTab === 'qualified' ? { background: 'var(--gold-primary)', color: '#000', fontWeight: '700' } : {}}
              >
                🟢 Para Votación ({adminData?.qualifiedCount || 0})
              </button>

              <button 
                className={`pill-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
                style={activeTab === 'all' ? { background: 'var(--gold-primary)', color: '#000', fontWeight: '700' } : {}}
              >
                Todas ({adminData?.data?.length || 0})
              </button>

              <button 
                className={`pill-btn ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
                style={activeTab === 'users' ? { background: 'var(--gold-primary)', color: '#000', fontWeight: '700' } : {}}
              >
                Por Usuario
              </button>
            </div>

            {/* Data Tables */}
            {activeTab !== 'users' ? (
              <div style={{ overflowX: 'auto', maxHeight: '350px' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Categoría</th>
                      <th>Nominaciones</th>
                      <th>Estado</th>
                      <th>Nominado por</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(adminData?.data || [])
                      .filter(item => activeTab === 'all' || item.isQualified)
                      .map((cat, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                            {cat.title}
                            {cat.descriptions.length > 0 && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic', marginTop: '2px' }}>
                                "{cat.descriptions[0]}"
                              </div>
                            )}
                          </td>
                          <td style={{ fontWeight: '800', textAlign: 'center' }}>
                            {cat.nominatorCount}
                          </td>
                          <td>
                            {cat.isQualified ? (
                              <span className="badge-qualified">
                                <CheckCircle2 size={13} /> Pasa a Votación
                              </span>
                            ) : (
                              <span className="badge-pending">
                                <Clock size={13} /> 1 persona
                              </span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {cat.nominators.join(', ')}
                          </td>
                        </tr>
                    ))}
                    {adminData?.data?.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>
                          Aún no se han recibido nominaciones.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Submissions by User View */
              <div style={{ overflowY: 'auto', maxHeight: '350px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(adminData?.rawSubmissions || []).map((sub, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                    <div style={{ fontWeight: '800', color: 'var(--gold-light)', fontSize: '0.95rem', marginBottom: '6px' }}>
                      👤 {sub.userName} ({sub.categories.length} categorías)
                    </div>
                    <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {sub.categories.map((c, j) => (
                        <li key={j}>
                          <strong style={{ color: 'var(--text-main)' }}>{c.title}</strong>
                          {c.description && ` — "${c.description}"`}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                onClick={handleClearData}
                style={{ background: 'none', border: 'none', color: '#F87171', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Trash2 size={13} /> Limpiar memoria local
              </button>
              
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                PIN activo: <code>{DEFAULT_ADMIN_PIN}</code>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
