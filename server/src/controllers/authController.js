const { supabaseAdmin } = require('../supabaseClient');

exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Call the RPC function we just created
    // Note: We use the admin client which has service_role key
    const { data, error } = await supabaseAdmin.rpc('check_user_exists_by_email', {
      email_input: email
    });

    if (error) {
      console.error('RPC Error:', error);
      throw error;
    }

    res.json({ exists: data });
  } catch (err) {
    console.error('Check email error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
