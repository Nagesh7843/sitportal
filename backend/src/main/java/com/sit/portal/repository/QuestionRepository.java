package com.sit.portal.repository;

import com.sit.portal.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findAllByOrderByCreatedAtDesc();
    List<Question> findByCategoryOrderByCreatedAtDesc(String category);
    List<Question> findByStatusOrderByCreatedAtDesc(String status);
}
