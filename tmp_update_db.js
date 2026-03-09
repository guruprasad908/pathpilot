const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const res = await pool.query(`
      UPDATE roadmaps 
      SET tutorial_video_url = 'https://www.youtube.com/watch?v=JOCGfH0vK0Y', 
          tutorial_video_title = 'The Evolution of Communication' 
      WHERE title LIKE '%Communication%' 
      RETURNING id, title
    `);
    console.log('Success! Updated roadmaps:');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error running update:', err);
  } finally {
    await pool.end();
  }
}

run();
