package com.sit.portal.controller;

import com.sit.portal.entity.Laboratory;
import com.sit.portal.repository.LaboratoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/laboratories")
@RequiredArgsConstructor
public class LaboratoryController {

    private final LaboratoryRepository laboratoryRepository;

    @GetMapping
    public ResponseEntity<List<Laboratory>> getAllLaboratories() {
        return ResponseEntity.ok(laboratoryRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Laboratory> getLaboratoryById(@PathVariable Long id) {
        return laboratoryRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Laboratory> createLaboratory(@RequestBody Laboratory laboratory) {
        Laboratory saved = laboratoryRepository.save(laboratory);
        return ResponseEntity.status(201).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Laboratory> updateLaboratory(@PathVariable Long id, @RequestBody Laboratory lab) {
        return laboratoryRepository.findById(id).map(existing -> {
            if (lab.getRoomNumber() != null) existing.setRoomNumber(lab.getRoomNumber());
            if (lab.getName() != null) existing.setName(lab.getName());
            if (lab.getComputers() != null) existing.setComputers(lab.getComputers());
            if (lab.getProcessor() != null) existing.setProcessor(lab.getProcessor());
            if (lab.getRam() != null) existing.setRam(lab.getRam());
            if (lab.getStorage() != null) existing.setStorage(lab.getStorage());
            if (lab.getAdditionalEquipment() != null) existing.setAdditionalEquipment(lab.getAdditionalEquipment());
            if (lab.getTotalCost() != null) existing.setTotalCost(lab.getTotalCost());
            return ResponseEntity.ok(laboratoryRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLaboratory(@PathVariable Long id) {
        if (!laboratoryRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        laboratoryRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
