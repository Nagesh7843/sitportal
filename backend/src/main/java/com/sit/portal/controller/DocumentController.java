package com.sit.portal.controller;

import com.sit.portal.entity.Document;
import com.sit.portal.repository.DocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/documents")
public class DocumentController {

    @Autowired
    private DocumentRepository documentRepository;

    @GetMapping
    public ResponseEntity<List<Document>> getAllDocuments() {
        return ResponseEntity.ok(documentRepository.findByOrderByUploadedAtDesc());
    }

    @PostMapping
    public ResponseEntity<Document> uploadDocument(@RequestBody Document document) {
        Document savedDoc = documentRepository.save(document);
        return ResponseEntity.ok(savedDoc);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        documentRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
