package com.sit.portal.repository;

import com.sit.portal.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findAllByOrderByCreatedAtDesc();
    List<Question> findByCategoryOrderByCreatedAtDesc(String category);
    List<Question> findByStatusOrderByCreatedAtDesc(String status);

    @Query("SELECT q FROM Question q WHERE " +
           "(:category IS NULL OR :category = '' OR LOWER(q.category) = LOWER(:category)) AND " +
           "(:status IS NULL OR :status = '' OR UPPER(q.status) = UPPER(:status)) AND " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(q.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(q.content) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(q.authorName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY q.createdAt DESC")
    List<Question> searchQuestions(
            @Param("category") String category,
            @Param("status") String status,
            @Param("search") String search
    );
}
