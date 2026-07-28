import { createClient } from '@supabase/supabase-js';

// Supabase client initialization
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://iksrqugjdvqiofetbvnr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlrc3JxdWdqZHZxaW9mZXRidm5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyNTM5ODEsImV4cCI6MjEwMDgyOTk4MX0.uL678iIdp0eipvUy1u7iObJ28M_aIMhaGBeXApjQuX0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LOCAL_STORAGE_KEY = 'losver_gacorta_nominations_2026_v1';
export const DEFAULT_ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || 'VERGA2026';

/**
 * Save user category nominations privately.
 * Data submitted by a user is NOT readable by normal users in the UI.
 * 
 * @param {string} userName - Name or nickname of the user
 * @param {Array<{id: string, title: string, description: string}>} categories - List of nominated categories
 */
export async function submitNominations(userName, categories) {
  const cleanCategories = categories
    .map(c => ({
      title: c.title.trim(),
      description: (c.description || '').trim()
    }))
    .filter(c => c.title.length > 0);

  if (!userName || cleanCategories.length === 0) {
    throw new Error('Debes ingresar tu nombre y al menos una categoría válida.');
  }

  const payload = {
    id: `nom_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    userName: userName.trim(),
    categories: cleanCategories,
    timestamp: new Date().toISOString()
  };

  let savedInCloud = false;

  // 1. Try saving to Supabase if configured
  if (supabase) {
    try {
      // Insert into 'nominations' table
      const { error } = await supabase.from('nominations').insert(
        cleanCategories.map(cat => ({
          user_name: userName.trim(),
          category_title: cat.title,
          category_description: cat.description,
          submitted_at: payload.timestamp
        }))
      );

      if (!error) {
        savedInCloud = true;
      } else {
        console.warn('Error guardando en Supabase, usando respaldo local:', error);
      }
    } catch (err) {
      console.warn('Excepción de Supabase:', err);
    }
  }

  // 2. Always maintain local persistent backup
  const existing = getLocalSubmissions();
  existing.push(payload);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));

  return { success: true, savedInCloud, count: cleanCategories.length };
}

/**
 * Helper to fetch raw local submissions
 */
export function getLocalSubmissions() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error leyendo localStorage:', e);
    return [];
  }
}

/**
 * Fetch and aggregate all nominations for the Admin view.
 * Requires valid Admin PIN authorization.
 * 
 * @param {string} pin 
 * @returns {Promise<{success: boolean, data?: Array, rawSubmissions?: Array, error?: string}>}
 */
export async function fetchAdminData(pin) {
  if (pin !== DEFAULT_ADMIN_PIN) {
    return { success: false, error: 'PIN de administración incorrecto' };
  }

  let allSubmissions = [];

  // If Supabase is available, try fetching from cloud
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('nominations')
        .select('*');

      if (!error && data && data.length > 0) {
        // Group by user
        const groupedByUser = {};
        data.forEach(item => {
          const user = item.user_name || 'Anónimo';
          if (!groupedByUser[user]) {
            groupedByUser[user] = [];
          }
          groupedByUser[user].push({
            title: item.category_title,
            description: item.category_description
          });
        });

        allSubmissions = Object.keys(groupedByUser).map(user => ({
          userName: user,
          categories: groupedByUser[user]
        }));
      }
    } catch (err) {
      console.warn('No se pudo obtener de Supabase, recurriendo a datos locales:', err);
    }
  }

  // Also combine local submissions if any exist
  const localSubmissions = getLocalSubmissions();
  localSubmissions.forEach(localSub => {
    const existing = allSubmissions.find(s => s.userName.toLowerCase() === (localSub.userName || '').toLowerCase());
    if (!existing) {
      allSubmissions.push(localSub);
    }
  });

  // Aggregate by Category Title
  const categoryMap = new Map();

  allSubmissions.forEach(sub => {
    const user = sub.userName || 'Anónimo';
    sub.categories.forEach(cat => {
      if (!cat.title) return;
      const normalizedKey = cat.title.toLowerCase().trim();

      if (!categoryMap.has(normalizedKey)) {
        categoryMap.set(normalizedKey, {
          displayTitle: cat.title.trim(),
          descriptions: [],
          nominators: new Set(),
          count: 0
        });
      }

      const item = categoryMap.get(normalizedKey);
      item.count += 1;
      item.nominators.add(user);
      if (cat.description && !item.descriptions.includes(cat.description)) {
        item.descriptions.push(cat.description);
      }
    });
  });

  const aggregatedList = Array.from(categoryMap.values()).map(cat => ({
    title: cat.displayTitle,
    descriptions: cat.descriptions,
    nominators: Array.from(cat.nominators),
    nominatorCount: cat.nominators.size,
    totalMentions: cat.count,
    isQualified: cat.nominators.size >= 2 // Meets rule threshold!
  }));

  // Sort: Qualified first, then by count descending
  aggregatedList.sort((a, b) => {
    if (a.isQualified !== b.isQualified) {
      return a.isQualified ? -1 : 1;
    }
    return b.nominatorCount - a.nominatorCount;
  });

  return {
    success: true,
    data: aggregatedList,
    rawSubmissions: allSubmissions,
    totalSubmissions: allSubmissions.length,
    qualifiedCount: aggregatedList.filter(c => c.isQualified).length
  };
}

/**
 * Clear all local data (Admin option)
 */
export function clearLocalSubmissions() {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}

/**
 * Import external JSON backup into local storage (Admin option)
 */
export function importSubmissions(jsonData) {
  try {
    const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    if (Array.isArray(parsed)) {
      const existing = getLocalSubmissions();
      const combined = [...existing, ...parsed];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(combined));
      return true;
    }
  } catch (e) {
    console.error('Failed to import data:', e);
  }
  return false;
}
