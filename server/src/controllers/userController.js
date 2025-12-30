const { supabaseAdmin } = require('../supabaseClient');

// List users with pagination and filtering
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, role } = req.query;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' })
      .range(from, to);

    if (search) {
      query = query.ilike('username', `%${search}%`);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (role) {
      query = query.eq('role', role);
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

// Create a new user (Auth + Profile)
exports.createUser = async (req, res) => {
  try {
    const { email, password, username, role, phone } = req.body;

    // 1. Create in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username }
    });

    if (authError) throw authError;

    // 2. Update Profile (Trigger might have created it, but we need to set role/phone)
    // Wait for trigger or just update it. Trigger runs AFTER insert on auth.users.
    // We can assume profile exists or upsert it.
    
    // Give it a moment or just use upsert
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        username,
        role: role || 'user',
        status: 'active',
        phone
      });

    if (profileError) throw profileError;

    res.status(201).json({ message: 'User created successfully', user: authData.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, role, status, phone, password } = req.body;

    // Update Profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ username, role, status, phone })
      .eq('id', id);

    if (profileError) throw profileError;

    // Update Auth (Password) if provided
    if (password) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        password
      });
      if (authError) throw authError;
    }
    
    // Handle Ban if status is disabled
    if (status === 'disabled') {
       await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: '876000h' }); // 100 years
    } else if (status === 'active') {
       await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: '0' }); // Unban
    }

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (error) throw error;

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
