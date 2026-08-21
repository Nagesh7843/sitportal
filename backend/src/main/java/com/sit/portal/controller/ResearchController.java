package com.sit.portal.controller;

import com.sit.portal.entity.Laboratory;
import com.sit.portal.entity.ResearchLab;
import com.sit.portal.repository.LaboratoryRepository;
import com.sit.portal.repository.ResearchLabRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/research-labs")
@RequiredArgsConstructor
public class ResearchController {

    private final LaboratoryRepository laboratoryRepository;
    private final ResearchLabRepository researchLabRepository;

    // Direct endpoints for /api/v1/research-labs
    @GetMapping
    public ResponseEntity<List<ResearchLab>> getAllResearchLabs() {
        return ResponseEntity.ok(researchLabRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResearchLab> getResearchLabById(@PathVariable Long id) {
        return researchLabRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ResearchLab> createResearchLab(@RequestBody ResearchLab researchLab) {
        ResearchLab saved = researchLabRepository.save(researchLab);
        return ResponseEntity.status(201).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResearchLab> updateResearchLab(@PathVariable Long id, @RequestBody ResearchLab researchLab) {
        return researchLabRepository.findById(id).map(existing -> {
            if (researchLab.getExternalId() != null) existing.setExternalId(researchLab.getExternalId());
            if (researchLab.getName() != null) existing.setName(researchLab.getName());
            if (researchLab.getHead() != null) existing.setHead(researchLab.getHead());
            if (researchLab.getLocation() != null) existing.setLocation(researchLab.getLocation());
            if (researchLab.getActiveProjects() != null) existing.setActiveProjects(researchLab.getActiveProjects());
            if (researchLab.getGrantsAmount() != null) existing.setGrantsAmount(researchLab.getGrantsAmount());
            if (researchLab.getDescription() != null) existing.setDescription(researchLab.getDescription());
            if (researchLab.getImage() != null) existing.setImage(researchLab.getImage());
            return ResponseEntity.ok(researchLabRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResearchLab(@PathVariable Long id) {
        if (!researchLabRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        researchLabRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // Backward compatibility aliases
    @GetMapping("/laboratories")
    public ResponseEntity<List<Laboratory>> getLaboratoriesAlias() {
        return ResponseEntity.ok(laboratoryRepository.findAll());
    }

    @PostMapping("/laboratories")
    public ResponseEntity<Laboratory> createLaboratoryAlias(@RequestBody Laboratory laboratory) {
        return ResponseEntity.status(201).body(laboratoryRepository.save(laboratory));
    }

    @GetMapping("/research-labs")
    public ResponseEntity<List<ResearchLab>> getResearchLabsAlias() {
        return ResponseEntity.ok(researchLabRepository.findAll());
    }

    @PostMapping("/research-labs")
    public ResponseEntity<ResearchLab> createResearchLabAlias(@RequestBody ResearchLab researchLab) {
        return ResponseEntity.status(201).body(researchLabRepository.save(researchLab));
    }
}
