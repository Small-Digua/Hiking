const { supabaseAdmin } = require('../supabaseClient');

// List cities
exports.getCities = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, district } = req.query;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin
      .from('cities')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    if (district) {
      query = query.ilike('district', `%${district}%`);
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

// Create city
exports.createCity = async (req, res) => {
  try {
    const { name, district, description, image_url } = req.body;

    const { data, error } = await supabaseAdmin
      .from('cities')
      .insert({
        name,
        district,
        description,
        image_url
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'City created', city: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update city
exports.updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabaseAdmin
      .from('cities')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;

    res.json({ message: 'City updated', city: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete city
exports.deleteCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('cities')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'City deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
