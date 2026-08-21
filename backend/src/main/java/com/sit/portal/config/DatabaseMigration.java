package com.sit.portal.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseMigration {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void migrate() {
        runSafeSql("ALTER TABLE users ALTER COLUMN avatar TYPE TEXT;", "users.avatar -> TEXT");
        runSafeSql("ALTER TABLE faculty ALTER COLUMN rank_title DROP NOT NULL;", "faculty.rank_title -> DROP NOT NULL");
        runSafeSql("ALTER TABLE faculty ALTER COLUMN status DROP NOT NULL;", "faculty.status -> DROP NOT NULL");
        runSafeSql("ALTER TABLE faculty ALTER COLUMN specialization DROP NOT NULL;", "faculty.specialization -> DROP NOT NULL");
        runSafeSql("ALTER TABLE faculty ADD COLUMN IF NOT EXISTS rank VARCHAR(255);", "faculty.rank column");
        runSafeSql("ALTER TABLE faculty ADD COLUMN IF NOT EXISTS designation VARCHAR(255);", "faculty.designation column");
        runSafeSql("ALTER TABLE faculty ADD COLUMN IF NOT EXISTS qualification VARCHAR(255);", "faculty.qualification column");
        runSafeSql("ALTER TABLE faculty ADD COLUMN IF NOT EXISTS teaching_experience VARCHAR(255);", "faculty.teaching_experience column");
        runSafeSql("ALTER TABLE faculty ADD COLUMN IF NOT EXISTS industrial_experience VARCHAR(255);", "faculty.industrial_experience column");
        runSafeSql("ALTER TABLE faculty ADD COLUMN IF NOT EXISTS department VARCHAR(255);", "faculty.department column");
        runSafeSql("ALTER TABLE faculty ADD COLUMN IF NOT EXISTS avatar TEXT;", "faculty.avatar column");
        runSafeSql("ALTER TABLE students ALTER COLUMN cohort_batch DROP NOT NULL;", "students.cohort_batch -> DROP NOT NULL");
        runSafeSql("ALTER TABLE students ALTER COLUMN gpa DROP NOT NULL;", "students.gpa -> DROP NOT NULL");
    }

    private void runSafeSql(String sql, String description) {
        try {
            jdbcTemplate.execute(sql);
            System.out.println("MIGRATION SUCCESS: " + description);
        } catch (Exception e) {
            System.out.println("MIGRATION NOTICE (" + description + "): " + e.getMessage());
        }
    }
}
