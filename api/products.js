import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      // Normalizar campo "image"
      const products = data.map(p => ({
        ...p,
        image: Array.isArray(p.image) ? p.image : (p.image ? [p.image] : [])
      }));

      return res.status(200).json(products);
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    console.error('Error en GET /api/products:', err.message);
    return res.status(500).json({ error: 'Error cargando productos', details: err.message });
  }
}
