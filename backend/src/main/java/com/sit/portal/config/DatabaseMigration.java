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
        try {
            jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN avatar TYPE TEXT;");
            System.out.println("MIGRATION: Successfully altered users.avatar to TEXT");
        } catch (Exception e) {
            System.out.println("MIGRATION: " + e.getMessage());
        }
    }
}
