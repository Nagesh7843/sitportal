package com.sit.portal.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DataSourceConfig {

    @Value("${spring.datasource.url:${DATABASE_URL:jdbc:postgresql://localhost:5432/sitportaldb}}")
    private String rawUrl;

    @Value("${spring.datasource.username:${SPRING_DATASOURCE_USERNAME:postgres}}")
    private String defaultUsername;

    @Value("${spring.datasource.password:${SPRING_DATASOURCE_PASSWORD:N@gesh7843}}")
    private String defaultPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        
        String url = rawUrl != null ? rawUrl.trim() : "";
        String username = defaultUsername;
        String password = defaultPassword;

        // Check if environment has DATABASE_URL (common in NeonDB, Render, Heroku)
        String envDbUrl = System.getenv("DATABASE_URL");
        if (envDbUrl != null && !envDbUrl.isBlank()) {
            url = envDbUrl.trim();
        }

        // Parse NeonDB / Render standard postgres:// or postgresql:// format
        if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
            try {
                URI uri = new URI(url.replace("postgres://", "http://").replace("postgresql://", "http://"));
                String host = uri.getHost();
                int port = uri.getPort() == -1 ? 5432 : uri.getPort();
                String path = uri.getPath();
                String query = uri.getQuery();
                
                String userInfo = uri.getUserInfo();
                if (userInfo != null && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":", 2);
                    username = parts[0];
                    password = parts[1];
                }

                StringBuilder jdbcBuilder = new StringBuilder("jdbc:postgresql://")
                        .append(host)
                        .append(":")
                        .append(port)
                        .append(path);

                if (query != null && !query.isBlank()) {
                    jdbcBuilder.append("?").append(query);
                    if (!query.contains("sslmode")) {
                        jdbcBuilder.append("&sslmode=require");
                    }
                } else {
                    jdbcBuilder.append("?sslmode=require");
                }

                url = jdbcBuilder.toString();
                System.out.println("CONFIG: Automatically converted NeonDB URI to JDBC format: " + host + path);
            } catch (Exception e) {
                System.err.println("CONFIG: Error parsing postgresql URI, falling back to prefixing jdbc: " + e.getMessage());
                if (!url.startsWith("jdbc:")) {
                    url = "jdbc:" + url;
                }
            }
        }

        // Set parameters
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName("org.postgresql.Driver");

        // NeonDB Serverless Connection Pool Optimizations
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setIdleTimeout(60000); // 1 min
        config.setMaxLifetime(180000); // 3 min (safely below Neon 5 min idle freeze)
        config.setConnectionTimeout(30000); // 30 sec
        config.setKeepaliveTime(30000); // Keep alive every 30s
        config.setConnectionTestQuery("SELECT 1");
        config.setPoolName("SitPortalHikariPool");

        return new HikariDataSource(config);
    }
}
