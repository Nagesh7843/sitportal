package com.sit.portal.controller;

import com.sit.portal.entity.Question;
import com.sit.portal.entity.QuestionAnswer;
import com.sit.portal.entity.User;
import com.sit.portal.repository.QuestionAnswerRepository;
import com.sit.portal.repository.QuestionRepository;
import com.sit.portal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/questions")
public class QuestionController {

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private QuestionAnswerRepository questionAnswerRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<Question> getAllQuestions(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search
    ) {
        List<Question> questions;
        if (category != null && !category.isEmpty() && !"All".equalsIgnoreCase(category)) {
            questions = questionRepository.findByCategoryOrderByCreatedAtDesc(category);
        } else if (status != null && !status.isEmpty() && !"All".equalsIgnoreCase(status)) {
            questions = questionRepository.findByStatusOrderByCreatedAtDesc(status.toUpperCase());
        } else {
            questions = questionRepository.findAllByOrderByCreatedAtDesc();
        }

        if (search != null && !search.trim().isEmpty()) {
            String query = search.trim().toLowerCase();
            return questions.stream()
                    .filter(q -> (q.getTitle() != null && q.getTitle().toLowerCase().contains(query)) ||
                            (q.getContent() != null && q.getContent().toLowerCase().contains(query)) ||
                            (q.getAuthorName() != null && q.getAuthorName().toLowerCase().contains(query)) ||
                            (q.getCategory() != null && q.getCategory().toLowerCase().contains(query)))
                    .toList();
        }

        return questions;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getQuestionById(@PathVariable Long id) {
        return questionRepository.findById(id).map(q -> {
            q.setViewsCount(q.getViewsCount() + 1);
            questionRepository.save(q);
            return ResponseEntity.ok(q);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createQuestion(@RequestBody Question question, Authentication authentication) {
        if (question.getTitle() == null || question.getTitle().trim().isEmpty() ||
                question.getContent() == null || question.getContent().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Title and content are required."));
        }

        if (authentication != null && authentication.getName() != null) {
            String email = authentication.getName().trim().toLowerCase();
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                question.setAuthorId(user.getId());
                if (question.getAuthorName() == null || question.getAuthorName().isEmpty()) {
                    question.setAuthorName(user.getName());
                }
                if (question.getAuthorRole() == null || question.getAuthorRole().isEmpty()) {
                    question.setAuthorRole(user.getRole());
                }
                question.setAuthorEmail(user.getEmail());
            }
        }

        if (question.getCategory() == null || question.getCategory().isEmpty()) {
            question.setCategory("Academics");
        }
        if (question.getStatus() == null) {
            question.setStatus("OPEN");
        }

        Question saved = questionRepository.save(question);
        return ResponseEntity.status(201).body(saved);
    }

    @PostMapping("/{id}/answers")
    public ResponseEntity<?> addAnswer(
            @PathVariable Long id,
            @RequestBody QuestionAnswer answer,
            Authentication authentication
    ) {
        Optional<Question> questionOpt = questionRepository.findById(id);
        if (questionOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Question question = questionOpt.get();

        if (answer.getContent() == null || answer.getContent().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Answer content is required."));
        }

        if (authentication != null && authentication.getName() != null) {
            String email = authentication.getName().trim().toLowerCase();
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                answer.setResponderId(user.getId());
                if (answer.getResponderName() == null || answer.getResponderName().isEmpty()) {
                    answer.setResponderName(user.getName());
                }
                if (answer.getResponderRole() == null || answer.getResponderRole().isEmpty()) {
                    answer.setResponderRole(user.getRole());
                }
                if (answer.getResponderTitle() == null || answer.getResponderTitle().isEmpty()) {
                    answer.setResponderTitle(user.getRoleTitle() != null ? user.getRoleTitle() : "Faculty Member");
                }
            }
        }

        answer.setQuestion(question);
        QuestionAnswer savedAnswer = questionAnswerRepository.save(answer);

        // Update question status to ANSWERED
        question.setStatus("ANSWERED");
        questionRepository.save(question);

        return ResponseEntity.status(201).body(savedAnswer);
    }

    @PostMapping("/{id}/upvote")
    public ResponseEntity<?> upvoteQuestion(@PathVariable Long id) {
        return questionRepository.findById(id).map(q -> {
            q.setUpvotes((q.getUpvotes() != null ? q.getUpvotes() : 0) + 1);
            Question saved = questionRepository.save(q);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
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

        return questionRepository.findById(id).map(q -> {
            q.setStatus(newStatus.toUpperCase());
            return ResponseEntity.ok(questionRepository.save(q));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteQuestion(@PathVariable Long id, Authentication authentication) {
        Optional<Question> questionOpt = questionRepository.findById(id);
        if (questionOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Question question = questionOpt.get();

        if (authentication != null && authentication.getName() != null) {
            String email = authentication.getName().trim().toLowerCase();
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                boolean isAdminOrHod = "admin".equalsIgnoreCase(user.getRole()) || "hod".equalsIgnoreCase(user.getRole());
                boolean isAuthor = (question.getAuthorId() != null && question.getAuthorId().equals(user.getId())) ||
                        (question.getAuthorEmail() != null && question.getAuthorEmail().equalsIgnoreCase(user.getEmail()));

                if (!isAdminOrHod && !isAuthor) {
                    return ResponseEntity.status(403).body(Map.of("message", "Permission denied: Only the question author or an administrator can delete this question."));
                }
            }
        }

        questionRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
