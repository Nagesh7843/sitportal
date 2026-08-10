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

    @GetMapping("/laboratories")
    public ResponseEntity<List<Laboratory>> getAllLaboratories() {
        return ResponseEntity.ok(laboratoryRepository.findAll());
    }

    @PostMapping("/laboratories")
    public ResponseEntity<Laboratory> createLaboratory(@RequestBody Laboratory laboratory) {
        return ResponseEntity.ok(laboratoryRepository.save(laboratory));
    }

    @GetMapping("/research-labs")
    public ResponseEntity<List<ResearchLab>> getAllResearchLabs() {
        return ResponseEntity.ok(researchLabRepository.findAll());
    }

    @PostMapping("/research-labs")
    public ResponseEntity<ResearchLab> createResearchLab(@RequestBody ResearchLab researchLab) {
        return ResponseEntity.ok(researchLabRepository.save(researchLab));
    }
}
