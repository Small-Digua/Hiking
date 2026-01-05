const { supabaseAdmin } = require('../supabaseClient');

// List tags
exports.getTags = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin
      .from('tags')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.ilike('name', `%${search}%`);
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

// Get all tags (for select dropdown)
exports.getAllTags = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('tags')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create tag
exports.createTag = async (req, res) => {
  try {
    const { name } = req.body;

    const { data, error } = await supabaseAdmin
      .from('tags')
      .insert({
        name
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Tag created', tag: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update tag
exports.updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const { data, error } = await supabaseAdmin
      .from('tags')
      .update({
        name,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) throw error;

    res.json({ message: 'Tag updated', tag: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete tag
exports.deleteTag = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 先删除关联的路线标签
    await supabaseAdmin
      .from('route_tags')
      .delete()
      .eq('tag_id', id);
    
    // 再删除标签
    const { error } = await supabaseAdmin
      .from('tags')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Tag deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
