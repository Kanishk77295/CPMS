# CPMS
College placement management system
The Following is the workbench sql code:
DROP DATABASE IF EXISTS cpms;
CREATE DATABASE cpms CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE cpms;

SET sql_mode = 'STRICT_ALL_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- LOOKUPS
CREATE TABLE Branch (
  branch_code VARCHAR(10) PRIMARY KEY,
  branch_name VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- STUDENT
CREATE TABLE Student (
  student_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  phone VARCHAR(20) UNIQUE,
  branch_code VARCHAR(10) NOT NULL,
  batch_year INT NOT NULL,
  cgpa DECIMAL(3,2) NOT NULL,
  active_backlogs INT NOT NULL DEFAULT 0,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  
  CONSTRAINT fk_student_branch FOREIGN KEY (branch_code)
    REFERENCES Branch(branch_code)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT ck_batch_year CHECK (batch_year BETWEEN 2000 AND 2100),
  CONSTRAINT ck_cgpa CHECK (cgpa BETWEEN 0 AND 10),
  CONSTRAINT ck_backlogs CHECK (active_backlogs >= 0)
) ENGINE=InnoDB;

-- PLACEMENT OFFICER (Admin)
CREATE TABLE PlacementOfficer (
  po_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

-- COMPANY
CREATE TABLE Company (
  company_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  sector VARCHAR(60)
) ENGINE=InnoDB;

-- JOB
CREATE TABLE Job (
  job_id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  title VARCHAR(120) NOT NULL,
  job_type ENUM('Full-time','Intern','PPO') NOT NULL,
  ctc_lpa DECIMAL(5,2) DEFAULT NULL,
  min_cgpa DECIMAL(3,2) NOT NULL,
  CONSTRAINT fk_job_company FOREIGN KEY (company_id)
    REFERENCES Company(company_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT ck_ctc_nonneg CHECK (ctc_lpa IS NULL OR ctc_lpa >= 0),
  CONSTRAINT ck_min_cgpa CHECK (min_cgpa BETWEEN 0 AND 10)
) ENGINE=InnoDB;

CREATE TABLE JobBranch (
  job_id INT NOT NULL,
  branch_code VARCHAR(10) NOT NULL,
  PRIMARY KEY (job_id, branch_code),
  CONSTRAINT fk_jobbranch_job FOREIGN KEY (job_id)
    REFERENCES Job(job_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_jobbranch_branch FOREIGN KEY (branch_code)
    REFERENCES Branch(branch_code)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- DRIVE
CREATE TABLE Drive (
  drive_id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  drive_date DATE NOT NULL,
  mode ENUM('Onsite','Online','Hybrid') NOT NULL,
  venue VARCHAR(120),
  CONSTRAINT fk_drive_job FOREIGN KEY (job_id)
    REFERENCES Job(job_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- APPLICATION
CREATE TABLE Application (
  application_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  job_id INT NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('APPLIED','SHORTLISTED','INTERVIEWED','OFFERED','ACCEPTED','REJECTED') NOT NULL DEFAULT 'APPLIED',
  UNIQUE KEY uq_student_job (student_id, job_id),
  CONSTRAINT fk_app_student FOREIGN KEY (student_id)
    REFERENCES Student(student_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_app_job FOREIGN KEY (job_id)
    REFERENCES Job(job_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- INTERVIEW ROUND
CREATE TABLE InterviewRound (
  round_id INT AUTO_INCREMENT PRIMARY KEY,
  drive_id INT NOT NULL,
  round_no INT NOT NULL,
  round_type ENUM('Aptitude','Technical','HR','GD') NOT NULL,
  UNIQUE KEY uq_drive_round (drive_id, round_no),
  CONSTRAINT fk_round_drive FOREIGN KEY (drive_id)
    REFERENCES Drive(drive_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT ck_round_no CHECK (round_no > 0)
) ENGINE=InnoDB;

-- INTERVIEW RESULT
CREATE TABLE InterviewResult (
  result_id INT AUTO_INCREMENT PRIMARY KEY,
  round_id INT NOT NULL,
  student_id INT NOT NULL,
  outcome ENUM('PASS','FAIL') NOT NULL,
  UNIQUE KEY uq_round_student (round_id, student_id),
  CONSTRAINT fk_ir_round FOREIGN KEY (round_id)
    REFERENCES InterviewRound(round_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_ir_student FOREIGN KEY (student_id)
    REFERENCES Student(student_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- OFFER
CREATE TABLE Offer (
  offer_id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL UNIQUE,
  offer_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  offer_status ENUM('OFFERED','ACCEPTED','DECLINED') NOT NULL,
  CONSTRAINT fk_offer_app FOREIGN KEY (application_id)
    REFERENCES Application(application_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- SKILL (Lookup Table)
CREATE TABLE Skill (
  skill_id INT AUTO_INCREMENT PRIMARY KEY,
  skill_name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Student_Skill (Junction Table for N:M)
CREATE TABLE Student_Skill (
  student_id INT NOT NULL,
  skill_id INT NOT NULL,
  PRIMARY KEY (student_id, skill_id),
  CONSTRAINT fk_ss_student FOREIGN KEY (student_id)
    REFERENCES Student(student_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_ss_skill FOREIGN KEY (skill_id)
    REFERENCES Skill(skill_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- Job_Skill (Junction Table for N:M)
CREATE TABLE Job_Skill (
  job_id INT NOT NULL,
  skill_id INT NOT NULL,
  PRIMARY KEY (job_id, skill_id),
  CONSTRAINT fk_js_job FOREIGN KEY (job_id)
    REFERENCES Job(job_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_js_skill FOREIGN KEY (skill_id)
    REFERENCES Skill(skill_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;


-- ------------------------------
-- PRE-FED DATA (SYSTEM DATA ONLY)
-- ------------------------------

-- Admin User
INSERT INTO PlacementOfficer (name, email, password_hash)
VALUES ('Admin', 'admin@uni.edu', '$2b$10$THIS_IS_A_FAKE_HASH_FOR_DEMO');

-- Branches
INSERT INTO Branch (branch_code, branch_name) VALUES
 ('CSE','Computer Science & Engineering'),
 ('ECE','Electronics & Communication'),
 ('ME','Mechanical Engineering'),
 ('EEE','Electrical & Electronics'),
 ('CE','Civil Engineering');

-- Skills
INSERT INTO Skill (skill_name) VALUES
('Python'),('Java'),('C++'),('JavaScript'),('React'),('Node.js'),('Express.js'),
('SQL'),('MySQL'),('MongoDB'),('Git'),('Docker'),('AWS'),('Azure'),('Machine Learning'),
('Data Analysis'),('Project Management'),('Agile'),('Scrum'),('UI/UX Design'),
('Figma'),('AutoCAD'),('VLSI'),('Embedded Systems'),('Power Electronics');

-- Companies
INSERT INTO Company (name,sector) VALUES
 ('TechOrbit','Software'),
 ('ElectraWorks','Electronics'),
 ('MechaCore','Manufacturing'),
 ('DataAnalyticsInc','Data Science'),
 ('FinSecure','FinTech'),
 ('InfraBuild','Core Engineering'),
 ('QuantumLeap AI','Artificial Intelligence'),
 ('CloudWave','Cloud Computing'),
 ('BioGenetics','Biotech'),
 ('EcoPower','Renewable Energy'),
 ('Velocity Robotics','Robotics'),
 ('CyberSafe','Security'),
 ('HealthPlus','Healthcare Tech'),
 ('AdVision','Marketing Tech'),
 ('SpaceQuest','Aerospace'),
 ('ConnectNet','Telecommunications');
 
-- Jobs
INSERT INTO Job (company_id,title,job_type,ctc_lpa,min_cgpa) VALUES
 (1,'SDE I','Full-time',18.0,8.0),
 (1,'Summer Intern','Intern',1.2,7.0),
 (2,'Design Engineer','Full-time',10.5,7.5),
 (3,'Graduate Engineer Trainee','Full-time',6.0,7.0),
 (4,'Data Analyst','Full-time',12.0,8.0),
 (5,'Blockchain Developer','Full-time',20.0,8.5),
 (6,'Site Engineer','Full-time',8.0,7.5),
 (1,'QA Engineer','Full-time',10.0,7.0),
 (8,'Cloud Engineer','Full-time',14.0,7.5),
 (11,'Robotics Engineer','Full-time',15.0,8.0),
 (12,'Security Analyst','Full-time',11.0,7.5),
 (13,'Healthcare Data Modeler','Full-time',9.0,8.0),
 (2,'Embedded Systems Dev','Full-time',9.5,7.5),
 (10,'Solar Grid Designer','Full-time',8.5,7.5),
 (15,'Satellite Systems Engg','Full-time',13.0,8.0),
 (16,'5G Network Specialist','Full-time',12.5,7.5),
 (1,'Product Manager','Full-time',22.0,8.0),
 (7,'Data Scientist','Full-time',19.0,8.5);

-- Job Branches
INSERT INTO JobBranch (job_id, branch_code) VALUES
 (1,'CSE'),(1,'ECE'),(2,'CSE'),(3,'ECE'),(4,'ME'),
 (5,'CSE'),(5,'ECE'),(6,'CSE'),(7,'CE'),(7,'ME'),(8,'CSE'),(8,'ECE'),
 (9,'CSE'),(9,'ECE'),(9,'EEE'),
 (10,'CSE'),(10,'ME'),(10,'EEE'),
 (11,'CSE'),(11,'ECE'),
 (12,'CSE'),(12,'ECE'),(12,'EEE'),
 (13,'ECE'),(13,'EEE'),
 (14,'EEE'),
 (15,'CSE'),(15,'ECE'),(15,'ME'),
 (16,'ECE'),(16,'EEE'),
 (17,'CSE'),(17,'ECE'),(17,'ME'),
 (18,'CSE'),(18,'ECE');
 
-- Job Skills
INSERT INTO Job_Skill (job_id, skill_id) VALUES
 (1,1),(1,2),(1,4),(1,8),
 (2,4),(2,5),
 (3,22),(3,23),(3,24),
 (4,22),
 (5,16),(5,1),
 (6,1),(6,2),(6,4),(6,5),(6,6),(6,7),(6,8),(6,9),(6,10),
 (7,17),
 (8,12),(8,13),(8,14),
 (9,12),(9,13),(9,14),
 (10,1),(10,22),
 (11,11),
 (12,16),(12,11),
 (13,15),(13,16),
 (14,24),(14,25),
 (15,1),(15,22),
 (16,24),
 (17,17),(17,18),(17,19),
 (18,1),(18,15),(18,16);

-- Drives
INSERT INTO Drive (job_id,drive_date,mode,venue) VALUES
 (1,'2025-01-20','Online',NULL),
 (2,'2025-02-10','Online',NULL),
 (3,'2025-01-25','Onsite','Auditorium'),
 (4,'2025-02-05','Onsite','Seminar Hall'),
 (5,'2025-02-15','Online',NULL),
 (6,'2025-02-18','Hybrid','Room 301'),
 (7,'2025-02-20','Onsite','Civil Dept'),
 (8,'2025-02-22','Online',NULL),
 (9,'2025-03-01','Online',NULL),
 (10,'2025-03-05','Onsite','Robotics Lab'),
 (11,'2025-03-02','Online',NULL),
 (12,'2025-03-03','Onsite','Conf Room 3'),
 (13,'2025-03-10','Hybrid','New Campus'),
 (14,'2025-03-11','Onsite','EEE Dept'),
 (15,'2025-03-12','Onsite','Main Hall'),
 (16,'2025-03-15','Online',NULL),
 (17,'2025-03-18','Online',NULL),
 (18,'2025-03-20','Hybrid','AI Lab');

-- Interview Rounds
INSERT INTO InterviewRound (drive_id,round_no,round_type) VALUES
 (1,1,'Aptitude'),(1,2,'Technical'),(1,3,'HR'),
 (3,1,'Technical'),(3,2,'HR'),
 (5,1,'Aptitude'),(5,2,'Technical'),
 (6,1,'Technical'),(6,2,'HR'),
 (9,1,'Aptitude'),(9,2,'Technical'),(9,3,'HR'),
 (11,1,'Aptitude'),(11,2,'Technical'),
 (18,1,'Aptitude'),(18,2,'Technical'),(18,3,'HR');

-- ------------------------------
-- VIEWS (Unit 2)
-- ------------------------------

-- *** BUG 1 FIX IS HERE ***
CREATE OR REPLACE VIEW EligibleStudentsForJob AS
SELECT 
  j.job_id, 
  s.student_id, 
  s.name,
  (COUNT(js.skill_id) = 0) AS no_skills_required,
  COUNT(ss.skill_id) AS matching_skills,
  COUNT(js.skill_id) AS total_skills_required
FROM Job j
JOIN JobBranch jb ON j.job_id = jb.job_id
JOIN Student s ON s.cgpa >= j.min_cgpa 
              AND s.active_backlogs = 0 
              AND jb.branch_code = s.branch_code
              AND s.status = 'APPROVED'
              -- This new condition fixes Bug 1:
              -- Hides jobs if the student already has an 'ACCEPTED' offer
              AND NOT EXISTS (
                  SELECT 1
                  FROM Application a2
                  WHERE a2.student_id = s.student_id AND a2.status = 'ACCEPTED'
              )
LEFT JOIN Job_Skill js ON j.job_id = js.job_id
LEFT JOIN Student_Skill ss ON s.student_id = ss.student_id AND js.skill_id = ss.skill_id
GROUP BY j.job_id, s.student_id, s.name
-- Relaxed match logic: show if no skills required OR at least one match
HAVING no_skills_required = 1 OR matching_skills > 0;


CREATE OR REPLACE VIEW PlacedStudents AS
SELECT s.student_id, s.name, c.name AS company, j.title, o.offer_status, a.application_id
FROM Offer o
JOIN Application a ON a.application_id = o.application_id
JOIN Student s ON s.student_id = a.student_id
JOIN Job j ON j.job_id = a.job_id
JOIN Company c ON c.company_id = j.company_id
WHERE o.offer_status IN ('ACCEPTED','OFFERED');

-- ------------------------------
-- TRIGGERS (Unit 2)
-- ------------------------------

-- *** BUG 1 FIX IS HERE ***
-- This trigger enforces the "One Offer" rule at the database level.
DELIMITER $$
CREATE TRIGGER trg_accept_offer_singleton
AFTER INSERT ON Offer
FOR EACH ROW
BEGIN
  DECLARE v_student_id INT;
  
  -- Find the student_id this offer belongs to
  SELECT student_id INTO v_student_id
  FROM Application
  WHERE application_id = NEW.application_id;

  -- If the new offer's status is 'ACCEPTED'
  IF NEW.offer_status = 'ACCEPTED' THEN
    -- Reject all OTHER active applications for this student
    UPDATE Application
    SET status = 'REJECTED'
    WHERE student_id = v_student_id
      AND application_id != NEW.application_id
      AND status IN ('APPLIED', 'SHORTLISTED', 'INTERVIEWED', 'OFFERED');
  END IF;
END$$
DELIMITER ;
