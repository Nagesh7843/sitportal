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

    @GetMapping("/{id}")
    public ResponseEntity<Document> getDocumentById(@PathVariable Long id) {
        return documentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Document> uploadDocument(@RequestBody Document document) {
        Document savedDoc = documentRepository.save(document);
        return ResponseEntity.status(201).body(savedDoc);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Document> updateDocument(@PathVariable Long id, @RequestBody Document document) {
        return documentRepository.findById(id).map(existing -> {
            if (document.getTitle() != null) existing.setTitle(document.getTitle());
            if (document.getCategory() != null) existing.setCategory(document.getCategory());
            if (document.getFileSize() != null) existing.setFileSize(document.getFileSize());
            if (document.getFileType() != null) existing.setFileType(document.getFileType());
            if (document.getUploadedBy() != null) existing.setUploadedBy(document.getUploadedBy());
            if (document.getDownloadUrl() != null) existing.setDownloadUrl(document.getDownloadUrl());
            return ResponseEntity.ok(documentRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        if (!documentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        documentRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
