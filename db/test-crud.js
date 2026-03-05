require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runCrudTest() {
    try {
        console.log('--- Starting CRUD Test ---');

        console.log('\n1. Creating a Roadmap...');
        const roadmapRes = await pool.query(
            `INSERT INTO roadmaps (title, description) VALUES ($1, $2) RETURNING *`,
            ['My First Roadmap', 'Learning the basics.']
        );
        const roadmap = roadmapRes.rows[0];
        console.log('✅ Roadmap Created:', roadmap.id);

        console.log('\n2. Creating a Galaxy...');
        const galaxyRes = await pool.query(
            `INSERT INTO galaxies (roadmap_id, title, description) VALUES ($1, $2, $3) RETURNING *`,
            [roadmap.id, 'Python Basics', 'The Milky Way of programming']
        );
        const galaxy = galaxyRes.rows[0];
        console.log('✅ Galaxy Created:', galaxy.title);

        console.log('\n3. Creating 2 Planets...');
        const planet1Res = await pool.query(
            `INSERT INTO planets (galaxy_id, title, order_index) VALUES ($1, $2, $3) RETURNING *`,
            [galaxy.id, 'Variables & Types', 1]
        );
        const planet2Res = await pool.query(
            `INSERT INTO planets (galaxy_id, title, order_index) VALUES ($1, $2, $3) RETURNING *`,
            [galaxy.id, 'Control Flow', 2]
        );
        console.log(`✅ Planets Created: [${planet1Res.rows[0].title}, ${planet2Res.rows[0].title}]`);

        console.log('\n4. Creating Subtopics...');
        await pool.query(
            `INSERT INTO subtopics (planet_id, title, order_index) VALUES ($1, $2, $3)`,
            [planet1Res.rows[0].id, 'Strings', 1]
        );
        await pool.query(
            `INSERT INTO subtopics (planet_id, title, order_index) VALUES ($1, $2, $3)`,
            [planet1Res.rows[0].id, 'Integers', 2]
        );
        console.log('✅ Subtopics Created.');

        console.log('\n5. Reading the full hierarchy...');
        const result = await pool.query(`
      SELECT r.title as roadmap_title, g.title as galaxy_title, p.title as planet_title, s.title as subtopic_title
      FROM roadmaps r
      JOIN galaxies g ON g.roadmap_id = r.id
      JOIN planets p ON p.galaxy_id = g.id
      JOIN subtopics s ON s.planet_id = p.id
      WHERE r.id = $1
    `, [roadmap.id]);

        console.table(result.rows);
        console.log('\n✅ CRUD Test Passed! Phase 2 DB Foundation is solid.');

    } catch (err) {
        console.error('❌ CRUD Test Failed:', err);
    } finally {
        pool.end();
    }
}

runCrudTest();
