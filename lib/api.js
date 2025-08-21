export const getPreferences = async (userId) => {
  try {
    const res = await fetch(`http://192.168.0.173:5000/api/preferences/${userId}`);
    const data = await res.json();

    if (data.success) {
      console.log('Loaded preferences:', data.preferences);
      return data.preferences;
    } else {
      console.log('No preferences found.');
      return null;
    }
  } catch (err) {
    console.error('Error fetching preferences:', err);
  }
};
