import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Variables de entorno no configuradas.' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    if (req.method === 'POST') {
      const { items, name, address, payment, total } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'El pedido no contiene productos.' });
      }
      if (!name || !address || !payment || !total) {
        return res.status(400).json({ error: 'Datos de pedido incompletos.' });
      }

      // --- Actualizar stock de cada producto ---
      for (const item of items) {
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.id)
          .single();

        if (fetchError) throw fetchError;
        if (!product) {
          return res.status(400).json({ error: `Producto con ID ${item.id} no encontrado.` });
        }
        if (product.stock < item.qty) {
          return res.status(400).json({ error: `No hay stock suficiente para ${item.name}.` });
        }

        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: product.stock - item.qty })
          .eq('id', item.id);

        if (updateError) throw updateError;
      }

      // --- Crear pedido ---
      const orderData = {
        customer_name: name,
        customer_address: address,
        payment_method: payment,
        total_amount: total,
        order_items: items,
        order_status: 'Pendiente',
        payment_status: 'Pendiente'
      };

      const { data, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select();

      if (orderError) throw orderError;

      return res.status(200).json({
        success: true,
        message: 'Pedido registrado con éxito.',
        order: data[0]
      });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    console.error('Error en /api/orders:', err.message);
    return res.status(500).json({ error: 'Error interno del servidor', details: err.message });
  }
}
