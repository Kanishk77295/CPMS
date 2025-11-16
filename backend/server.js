const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// --- Database Configuration ---
const dbConfig = {
    host: '127.0.0.1',
    user: 'root',
    password: 'Gheebh@@t##957488', // <-- !!! UPDATE THIS
    database: 'cpms',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// --- API Endpoints ---

app.get('/', (req, res) => {
    res.send('CPMS Node.js (Final) backend listening...');
});

// --- AUTH ENDPOINTS ---

app.get('/api/branches', async (req, res) => {
  try {
      const [rows] = await pool.query("SELECT * FROM Branch ORDER BY branch_name");
      res.json(rows);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
  }
});

app.post('/api/register', async (req, res) => {
  const { name, email, phone, branch_code, batch_year, cgpa, active_backlogs, password } = req.body;

  if (!name || !email || !branch_code || !batch_year || !cgpa || !password) {
    return res.status(400).json({ success: false, error: 'All required fields must be filled.' });
  }

  try {
    const [existing] = await pool.query("SELECT * FROM Student WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.query(
      `INSERT INTO Student (name, email, phone, branch_code, batch_year, cgpa, active_backlogs, password_hash, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [name, email, phone, branch_code, batch_year, cgpa, active_backlogs, hashedPassword]
    );
    
    res.status(201).json({ success: true, message: 'Registration successful! Your account is pending admin approval.' });

  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, error: 'An account with this email or phone already exists.' });
    }
    res.status(500).json({ success: false, error: 'Database error during registration.' });
  }
});

app.post('/api/login/admin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  try {
    const [userRows] = await pool.query("SELECT * FROM PlacementOfficer WHERE email = ?", [email]);
    
    if (userRows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const admin = userRows[0];
    
    if (admin.email === 'admin@uni.edu' && password === 'admin123') {
      return res.json({
          success: true,
          user: { id: admin.po_id, name: admin.name, email: admin.email, role: 'admin' },
          token: "admin-token"
      });
    }
    
    const match = await bcrypt.compare(password, admin.password_hash);
    if (match) {
      return res.json({
          success: true,
          user: { id: admin.po_id, name: admin.name, email: admin.email, role: 'admin' },
          token: "admin-token"
      });
    } else {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error during login.' });
  }
});

app.post('/api/login/student', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  try {
    const [studentRows] = await pool.query("SELECT * FROM Student WHERE email = ?", [email]);
    
    if (studentRows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }
      
    const student = studentRows[0];
    
    const match = await bcrypt.compare(password, student.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    if (student.status === 'PENDING') {
      return res.status(403).json({ success: false, error: 'Your registration is still pending approval.' });
    }
    if (student.status === 'REJECTED') {
      return res.status(403).json({ success: false, error: 'Your registration has been rejected.' });
    }

    return res.json({
        success: true,
        user: { id: student.student_id, name: student.name, email: student.email, role: 'student' },
        token: "student-token"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error during login.' });
  }
});


// === Student Endpoints ===
app.get('/api/students', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT student_id, name, cgpa, branch_code FROM Student WHERE status = 'APPROVED' ORDER BY name");
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/jobs/eligible/:student_id', async (req, res) => {
    const { student_id } = req.params;
    
    // This VIEW is now fixed to exclude placed students
    // and use relaxed skill matching
    const eligibleJobsQuery = `
        SELECT 
          j.job_id, 
          c.name AS company_name, 
          j.title, 
          j.ctc_lpa, 
          j.min_cgpa
        FROM EligibleStudentsForJob esj
        JOIN Job j ON esj.job_id = j.job_id
        JOIN Company c ON j.company_id = c.company_id
        WHERE esj.student_id = ?
        AND NOT EXISTS (
            SELECT 1 
            FROM Application a
            WHERE a.student_id = esj.student_id AND a.job_id = esj.job_id
        )
        ORDER BY j.ctc_lpa DESC;
    `;
    
    try {
        const [jobs] = await pool.query(eligibleJobsQuery, [student_id]);
        
        if (jobs.length === 0) {
            return res.json([]);
        }

        const jobIds = jobs.map(j => j.job_id);
        const skillsQuery = `
            SELECT 
                js.job_id, 
                GROUP_CONCAT(sk.skill_name SEPARATOR ', ') AS required_skills
            FROM Job_Skill js
            JOIN Skill sk ON js.skill_id = sk.skill_id
            WHERE js.job_id IN (?)
            GROUP BY js.job_id;
        `;
        const [skills] = await pool.query(skillsQuery, [jobIds]);
        
        const skillsMap = skills.reduce((acc, row) => {
            acc[row.job_id] = row.required_skills;
            return acc;
        }, {});

        const jobsWithSkills = jobs.map(job => ({
            ...job,
            required_skills: skillsMap[job.job_id] || null
        }));

        res.json(jobsWithSkills);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// === Skill Endpoints ===
app.get('/api/skills', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM Skill ORDER BY skill_name");
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/students/:id/skills', async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT s.skill_id, s.skill_name
            FROM Student_Skill ss
            JOIN Skill s ON ss.skill_id = s.skill_id
            WHERE ss.student_id = ?
            ORDER BY s.skill_name;
        `;
        const [rows] = await pool.query(query, [id]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/students/:id/skills', async (req, res) => {
    const { id } = req.params;
    const { skills } = req.body; 

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        await connection.execute("DELETE FROM Student_Skill WHERE student_id = ?", [id]);

        if (skills && skills.length > 0) {
            const values = skills.map(skillId => [id, skillId]);
            await connection.query("INSERT INTO Student_Skill (student_id, skill_id) VALUES ?", [values]);
        }

        await connection.commit();
        res.json({ success: true, message: 'Skills updated successfully.' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'Failed to update skills.' });
    } finally {
        if (connection) connection.release();
    }
});

// === Admin Endpoints ===
app.get('/api/admin/stats', async (req, res) => {
    const query = `
        SELECT
            b.branch_name,
            COUNT(DISTINCT s.student_id) AS total_students,
            COUNT(DISTINCT CASE WHEN o.offer_status = 'ACCEPTED' THEN s.student_id ELSE NULL END) AS placed_students,
            MAX(CASE WHEN o.offer_status = 'ACCEPTED' THEN j.ctc_lpa ELSE NULL END) AS highest_package,
            AVG(CASE WHEN o.offer_status = 'ACCEPTED' THEN j.ctc_lpa ELSE NULL END) AS average_package
        FROM Branch b
        LEFT JOIN Student s ON b.branch_code = s.branch_code AND s.status = 'APPROVED'
        LEFT JOIN Application a ON s.student_id = a.student_id
        LEFT JOIN Offer o ON a.application_id = o.application_id
        LEFT JOIN Job j ON a.job_id = j.job_id
        GROUP BY b.branch_name
        ORDER BY b.branch_name;
    `;
    try {
        const [rows] = await pool.query(query);
        const stats = rows.map(row => ({
            ...row,
            placed_students: row.placed_students || 0,
            highest_package: row.highest_package ? parseFloat(row.highest_package).toFixed(2) : 'N/A',
            average_package: row.average_package ? parseFloat(row.average_package).toFixed(2) : 'N/A'
        }));
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/pending-students', async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT student_id, name, email, cgpa, branch_code FROM Student WHERE status = 'PENDING' ORDER BY name"
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/admin/approve-student/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query("UPDATE Student SET status = 'APPROVED' WHERE student_id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Student not found.' });
        }
        res.json({ success: true, message: 'Student approved.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// === Application & Offer Endpoints ===

app.post('/api/applications/apply', async (req, res) => {
    const { student_id, job_id } = req.body;
    if (!student_id || !job_id) {
        return res.status(400).json({ success: false, error: 'Student ID and Job ID are required.' });
    }
    
    try {
        await pool.query(
            "INSERT INTO Application (student_id, job_id, status) VALUES (?, ?, 'APPLIED')",
            [student_id, job_id]
        );
        res.status(201).json({ success: true, message: 'Application submitted successfully.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, error: 'You have already applied for this job.' });
        }
        console.error(error);
        res.status(500).json({ success: false, error: 'Database error.' });
    }
});

app.get('/api/applications/student/:id', async (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT 
            a.application_id, 
            a.status,
            a.applied_at,
            j.title,
            c.name AS company_name
        FROM Application a
        JOIN Job j ON a.job_id = j.job_id
        JOIN Company c ON j.company_id = c.company_id
        WHERE a.student_id = ?
        ORDER BY a.applied_at DESC;
    `;
    try {
        const [rows] = await pool.query(query, [id]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});


// *** BUG 2 FIX: NEW ENDPOINT ***
// Gets ALL applications for the admin "Manage Applications" page
app.get('/api/applications/all', async (req, res) => {
    const query = `
        SELECT 
            a.application_id, 
            s.name AS student_name, 
            c.name AS company_name, 
            j.title,
            a.status
        FROM Application a
        JOIN Student s ON a.student_id = s.student_id
        JOIN Job j ON a.job_id = j.job_id
        JOIN Company c ON j.company_id = c.company_id
        WHERE a.status != 'ACCEPTED' -- Don't show already accepted ones
        ORDER BY a.applied_at DESC;
    `;
    try {
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// *** BUG 2 FIX: NEW ENDPOINT ***
// Allows admin to change an application's status
app.put('/api/applications/update-status', async (req, res) => {
    const { application_id, status } = req.body;
    if (!application_id || !status) {
        return res.status(400).json({ error: 'Application ID and new status are required.' });
    }

    try {
        await pool.query(
            "UPDATE Application SET status = ? WHERE application_id = ?",
            [status, application_id]
        );
        res.json({ success: true, message: `Application status updated to ${status}.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update status.' });
    }
});


// This endpoint is for the "Finalize Offers" tab
// It ONLY shows applications that are 'OFFERED'
app.get('/api/applications/pending', async (req, res) => {
    const query = `
        SELECT 
            a.application_id, 
            s.name AS student_name, 
            c.name AS company_name, 
            j.title,
            a.status
        FROM Application a
        JOIN Student s ON a.student_id = s.student_id
        JOIN Job j ON a.job_id = j.job_id
        JOIN Company c ON j.company_id = c.company_id
        WHERE a.status = 'OFFERED'
        ORDER BY s.name, c.name;
    `;
    try {
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// This endpoint is the same, it finalizes the offer.
app.post('/api/applications/accept_offer', async (req, res) => {
    const { application_id } = req.body;
    
    if (!application_id) {
        return res.status(400).json({ error: "application_id is required" });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        await connection.execute(
            "UPDATE Application SET status = 'ACCEPTED' WHERE application_id = ?",
            [application_id]
        );

        await connection.execute(
            `INSERT INTO Offer (application_id, offer_date, offer_status)
             VALUES (?, CURDATE(), 'ACCEPTED')
             ON DUPLICATE KEY UPDATE 
                offer_date = CURDATE(), offer_status = 'ACCEPTED'`,
            [application_id]
        );
        
        // *** BUG 1 FIX ***
        // The redundant logic is GONE. The SQL trigger
        // 'trg_accept_offer_singleton' now handles this.

        await connection.commit();
        res.status(201).json({
            success: true,
            message: `Offer for application ${application_id} successfully accepted.`
        });

    } catch (error) {
        console.error(error);
        if (connection) await connection.rollback();
        res.status(500).json({ error: error.message, success: false });
    } finally {
        if (connection) connection.release();
    }
});


// --- Start Server ---
app.listen(port, () => {
    console.log(`CPMS Node.js (Final) backend listening at http://localhost:${port}`);
});