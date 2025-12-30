const { supabaseAdmin } = require('../supabaseClient');

// List routes
exports.getRoutes = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, difficulty, city_id } = req.query;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin
      .from('routes')
      .select('*, cities(name)', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }
    if (city_id) {
      query = query.eq('city_id', city_id);
    }

    const { data, count, error } = await query;

    if (error) throw error;

    res.json({
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create route
exports.createRoute = async (req, res) => {
  try {
    const { 
      name, city_id, difficulty, duration_hours, distance_km, 
      description, start_point, end_point, waypoints, tags, status,
      cover_image_url, images
    } = req.body;

    const { data, error } = await supabaseAdmin
      .from('routes')
      .insert({
        name, city_id, difficulty, duration_hours, distance_km,
        description, start_point, end_point, waypoints, tags, status,
        cover_image_url, images
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Route created', route: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update route
exports.updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabaseAdmin
      .from('routes')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;

    res.json({ message: 'Route updated', route: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete route
exports.deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('routes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Route deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
