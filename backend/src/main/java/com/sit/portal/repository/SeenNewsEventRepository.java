package com.sit.portal.repository;

import com.sit.portal.entity.SeenNewsEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SeenNewsEventRepository extends JpaRepository<SeenNewsEvent, Long> {
    boolean existsByEventKey(String eventKey);
    Optional<SeenNewsEvent> findByEventKey(String eventKey);
}
