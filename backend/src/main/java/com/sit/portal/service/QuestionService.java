package com.sit.portal.service;

import com.sit.portal.entity.Question;
import com.sit.portal.entity.QuestionAnswer;
import com.sit.portal.entity.User;
import com.sit.portal.repository.QuestionAnswerRepository;
import com.sit.portal.repository.QuestionRepository;
import com.sit.portal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class QuestionService {

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private QuestionAnswerRepository questionAnswerRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Question> getAllQuestions(String category, String status, String search) {
        String cleanCat = (category != null && !"All".equalsIgnoreCase(category)) ? category.trim() : null;
        String cleanStatus = (status != null && !"All".equalsIgnoreCase(status)) ? status.trim() : null;
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        if (cleanCat == null && cleanStatus == null && cleanSearch == null) {
            return questionRepository.findAllByOrderByCreatedAtDesc();
        }
        return questionRepository.searchQuestions(cleanCat, cleanStatus, cleanSearch);
    }

    public Optional<Question> getQuestionById(Long id) {
        return questionRepository.findById(id).map(q -> {
            q.setViewsCount(q.getViewsCount() + 1);
            return questionRepository.save(q);
        });
    }

    public Question createQuestion(Question question, Authentication authentication) {
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

        return questionRepository.save(question);
    }

    public Optional<QuestionAnswer> addAnswer(Long questionId, QuestionAnswer answer, Authentication authentication) {
        Optional<Question> questionOpt = questionRepository.findById(questionId);
        if (questionOpt.isEmpty()) {
            return Optional.empty();
        }

        Question question = questionOpt.get();

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

        question.setStatus("ANSWERED");
        questionRepository.save(question);

        return Optional.of(savedAnswer);
    }

    public Optional<Question> upvoteQuestion(Long id) {
        return toggleUpvoteQuestion(id, "anonymous_user");
    }

    public Optional<Question> toggleUpvoteQuestion(Long id, String userIdentifier) {
        String cleanUser = (userIdentifier != null && !userIdentifier.trim().isEmpty())
                ? userIdentifier.trim().toLowerCase()
                : "anonymous_user";

        return questionRepository.findById(id).map(q -> {
            List<String> upvotedUsers = q.getUpvotedBy() != null ? new ArrayList<>(q.getUpvotedBy()) : new ArrayList<>();
            if (upvotedUsers.contains(cleanUser)) {
                // Already liked -> Toggle off / unlike (enforces 1 like per user max)
                upvotedUsers.remove(cleanUser);
                q.setUpvotedBy(upvotedUsers);
                q.setUpvotes(Math.max(0, (q.getUpvotes() != null ? q.getUpvotes() : 1) - 1));
            } else {
                // Like question
                upvotedUsers.add(cleanUser);
                q.setUpvotedBy(upvotedUsers);
                q.setUpvotes((q.getUpvotes() != null ? q.getUpvotes() : 0) + 1);
            }
            return questionRepository.save(q);
        });
    }

    public Optional<Question> updateQuestionStatus(Long id, String status) {
        return questionRepository.findById(id).map(q -> {
            q.setStatus(status.toUpperCase());
            return questionRepository.save(q);
        });
    }

    public boolean canUserUpdateStatus(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) return true; // dev fallback
        String email = authentication.getName().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) return false;
        User user = userOpt.get();
        return "admin".equalsIgnoreCase(user.getRole()) || "hod".equalsIgnoreCase(user.getRole()) || "faculty".equalsIgnoreCase(user.getRole());
    }

    public boolean canUserDeleteQuestion(Long id, Authentication authentication) {
        Optional<Question> questionOpt = questionRepository.findById(id);
        if (questionOpt.isEmpty()) return false;

        Question question = questionOpt.get();
        if (authentication == null || authentication.getName() == null) return false;

        String email = authentication.getName().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) return false;

        User user = userOpt.get();
        boolean isAdminOrHod = "admin".equalsIgnoreCase(user.getRole()) || "hod".equalsIgnoreCase(user.getRole());
        boolean isAuthor = (question.getAuthorId() != null && question.getAuthorId().equals(user.getId())) ||
                (question.getAuthorEmail() != null && question.getAuthorEmail().equalsIgnoreCase(user.getEmail()));

        return isAdminOrHod || isAuthor;
    }

    public void deleteQuestion(Long id) {
        questionRepository.deleteById(id);
    }
}
