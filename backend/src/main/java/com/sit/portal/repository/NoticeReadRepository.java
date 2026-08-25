package com.sit.portal.repository;

import com.sit.portal.entity.NoticeRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoticeReadRepository extends JpaRepository<NoticeRead, Long> {
    List<NoticeRead> findByNoticeId(Long noticeId);
    boolean existsByNoticeIdAndUserIdentifier(Long noticeId, String userIdentifier);
    List<NoticeRead> findByUserIdentifier(String userIdentifier);
    void deleteByNoticeId(Long noticeId);
}
