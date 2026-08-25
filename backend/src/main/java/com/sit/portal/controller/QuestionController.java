package com.sit.portal.controller;

import com.sit.portal.entity.Question;
import com.sit.portal.entity.QuestionAnswer;
import com.sit.portal.service.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/questions")
public class QuestionController {

    @Autowired
    private QuestionService questionService;

    @GetMapping
    public List<Question> getAllQuestions(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search
    ) {
        return questionService.getAllQuestions(category, status, search);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getQuestionById(@PathVariable Long id) {
        return questionService.getQuestionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createQuestion(@RequestBody Question question, Authentication authentication) {
        if (question.getTitle() == null || question.getTitle().trim().isEmpty() ||
                question.getContent() == null || question.getContent().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Title and content are required."));
        }
        Question saved = questionService.createQuestion(question, authentication);
        return ResponseEntity.status(201).body(saved);
    }

    @PostMapping("/{id}/answers")
    public ResponseEntity<?> addAnswer(
            @PathVariable Long id,
            @RequestBody QuestionAnswer answer,
            Authentication authentication
    ) {
        if (answer.getContent() == null || answer.getContent().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Answer content is required."));
        }
        return questionService.addAnswer(id, answer, authentication)
                .map(a -> ResponseEntity.status(201).body(a))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/upvote")
    public ResponseEntity<?> upvoteQuestion(@PathVariable Long id) {
        return questionService.upvoteQuestion(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateQuestionStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> statusUpdate
    ) {
        String newStatus = statusUpdate.get("status");
        if (newStatus == null || newStatus.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Status is required."));
        }
        return questionService.updateQuestionStatus(id, newStatus)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteQuestion(@PathVariable Long id, Authentication authentication) {
        if (!questionService.canUserDeleteQuestion(id, authentication)) {
            return ResponseEntity.status(403).body(Map.of("message", "Permission denied: Only the question author or an administrator can delete this question."));
        }
        questionService.deleteQuestion(id);
        return ResponseEntity.noContent().build();
    }
}
