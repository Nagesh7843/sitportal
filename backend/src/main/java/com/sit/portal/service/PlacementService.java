package com.sit.portal.service;

import com.sit.portal.entity.*;
import com.sit.portal.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class PlacementService {

    @Autowired
    private PlacementStatRepository statRepository;

    @Autowired
    private PlacementRecruiterRepository recruiterRepository;

    @Autowired
    private PlacementDriveRepository driveRepository;

    @Autowired
    private PlacedStudentAchievementRepository achieverRepository;

    @Autowired
    private PushNotificationService pushNotificationService;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    public Map<String, Object> getPlacementSummary() {
        Map<String, Object> response = new HashMap<>();
        List<PlacementStat> statsList = statRepository.findAll();
        PlacementStat stats = statsList.isEmpty() ? null : statsList.get(0);

        List<PlacementRecruiter> recruiters = recruiterRepository.findAllByOrderByIdAsc();
        List<PlacementDrive> drives = driveRepository.findAllByOrderByIdDesc();
        List<PlacedStudentAchievement> achievers = achieverRepository.findAllByOrderByIdDesc();

        response.put("stats", stats);
        response.put("recruiters", recruiters);
        response.put("drives", drives);
        response.put("achievers", achievers);
        return response;
    }

    public PlacementStat updateStats(PlacementStat stat) {
        List<PlacementStat> statsList = statRepository.findAll();
        PlacementStat target;
        if (statsList.isEmpty()) {
            target = stat;
        } else {
            target = statsList.get(0);
            if (stat.getHighestPackage() != null) target.setHighestPackage(stat.getHighestPackage());
            if (stat.getAveragePackage() != null) target.setAveragePackage(stat.getAveragePackage());
            if (stat.getPlacementRatio() != null) target.setPlacementRatio(stat.getPlacementRatio());
            if (stat.getTotalOffers() != null) target.setTotalOffers(stat.getTotalOffers());
            if (stat.getBatchYear() != null) target.setBatchYear(stat.getBatchYear());
            if (stat.getBannerImageUrl() != null) target.setBannerImageUrl(stat.getBannerImageUrl());
            if (stat.getDescription() != null) target.setDescription(stat.getDescription());
        }
        target.setUpdatedAt(LocalDateTime.now());
        PlacementStat saved = statRepository.save(target);

        activityLogRepository.save(ActivityLog.builder()
                .title("Placement Statistics Updated")
                .subtitle("Batch " + (saved.getBatchYear() != null ? saved.getBatchYear() : "Latest") + " metrics & overview updated")
                .icon("insights")
                .colorBg("bg-blue-100")
                .colorIcon("text-blue-700")
                .type("PLACEMENT")
                .createdAt(LocalDateTime.now())
                .build());

        return saved;
    }

    public PlacementRecruiter addRecruiter(PlacementRecruiter recruiter) {
        PlacementRecruiter saved = recruiterRepository.save(recruiter);
        activityLogRepository.save(ActivityLog.builder()
                .title("New Recruiting Partner Added")
                .subtitle(saved.getName() + " added to placement partners")
                .icon("domain")
                .colorBg("bg-indigo-100")
                .colorIcon("text-indigo-700")
                .type("PLACEMENT")
                .createdAt(LocalDateTime.now())
                .build());
        return saved;
    }

    public Optional<PlacementRecruiter> updateRecruiter(Long id, PlacementRecruiter updated) {
        return recruiterRepository.findById(id).map(existing -> {
            if (updated.getName() != null) existing.setName(updated.getName());
            if (updated.getPackageBand() != null) existing.setPackageBand(updated.getPackageBand());
            if (updated.getRoleTag() != null) existing.setRoleTag(updated.getRoleTag());
            if (updated.getLogoUrl() != null) existing.setLogoUrl(updated.getLogoUrl());
            if (updated.getWebsiteUrl() != null) existing.setWebsiteUrl(updated.getWebsiteUrl());
            if (updated.getDescription() != null) existing.setDescription(updated.getDescription());
            return recruiterRepository.save(existing);
        });
    }

    public void deleteRecruiter(Long id) {
        recruiterRepository.deleteById(id);
    }

    public PlacementDrive addDrive(PlacementDrive drive) {
        if (drive.getStatus() == null || drive.getStatus().isEmpty()) {
            drive.setStatus("UPCOMING");
        }
        PlacementDrive savedDrive = driveRepository.save(drive);

        String title = "New Placement Drive: " + savedDrive.getCompanyName();
        String message = "Placement drive for " + savedDrive.getRole() + (savedDrive.getPackageLpa() != null ? " (" + savedDrive.getPackageLpa() + ")" : "")
                + " scheduled for " + (savedDrive.getDriveDate() != null ? savedDrive.getDriveDate() : "upcoming dates") + ".";
        pushNotificationService.sendPushNotificationToAll(title, message);

        activityLogRepository.save(ActivityLog.builder()
                .title("New Placement Drive Scheduled")
                .subtitle(savedDrive.getCompanyName() + " • " + savedDrive.getRole())
                .icon("event_available")
                .colorBg("bg-emerald-100")
                .colorIcon("text-emerald-700")
                .type("PLACEMENT")
                .createdAt(LocalDateTime.now())
                .build());

        return savedDrive;
    }

    public Optional<PlacementDrive> updateDrive(Long id, PlacementDrive updated) {
        return driveRepository.findById(id).map(existing -> {
            if (updated.getCompanyName() != null) existing.setCompanyName(updated.getCompanyName());
            if (updated.getRole() != null) existing.setRole(updated.getRole());
            if (updated.getPackageLpa() != null) existing.setPackageLpa(updated.getPackageLpa());
            if (updated.getDriveDate() != null) existing.setDriveDate(updated.getDriveDate());
            if (updated.getEligibility() != null) existing.setEligibility(updated.getEligibility());
            if (updated.getLocation() != null) existing.setLocation(updated.getLocation());
            if (updated.getApplyDeadline() != null) existing.setApplyDeadline(updated.getApplyDeadline());
            if (updated.getStatus() != null) existing.setStatus(updated.getStatus());
            if (updated.getLogoUrl() != null) existing.setLogoUrl(updated.getLogoUrl());
            if (updated.getBannerImageUrl() != null) existing.setBannerImageUrl(updated.getBannerImageUrl());
            if (updated.getDescription() != null) existing.setDescription(updated.getDescription());
            return driveRepository.save(existing);
        });
    }

    public void deleteDrive(Long id) {
        driveRepository.deleteById(id);
    }

    public List<PlacedStudentAchievement> getPlacedAchievers() {
        return achieverRepository.findAllByOrderByIdDesc();
    }

    public PlacedStudentAchievement addPlacedAchiever(PlacedStudentAchievement achiever) {
        PlacedStudentAchievement saved = achieverRepository.save(achiever);
        activityLogRepository.save(ActivityLog.builder()
                .title("Placed Student Added")
                .subtitle(saved.getStudentName() + " placed at " + saved.getCompanyName() + (saved.getPackageLpa() != null ? " (" + saved.getPackageLpa() + ")" : ""))
                .icon("school")
                .colorBg("bg-amber-100")
                .colorIcon("text-amber-700")
                .type("PLACEMENT")
                .createdAt(LocalDateTime.now())
                .build());
        return saved;
    }

    public Optional<PlacedStudentAchievement> updatePlacedAchiever(Long id, PlacedStudentAchievement updated) {
        return achieverRepository.findById(id).map(existing -> {
            if (updated.getStudentName() != null) existing.setStudentName(updated.getStudentName());
            if (updated.getPrn() != null) existing.setPrn(updated.getPrn());
            if (updated.getDivision() != null) existing.setDivision(updated.getDivision());
            if (updated.getPhotoUrl() != null) existing.setPhotoUrl(updated.getPhotoUrl());
            if (updated.getCompanyName() != null) existing.setCompanyName(updated.getCompanyName());
            if (updated.getCompanyLogoUrl() != null) existing.setCompanyLogoUrl(updated.getCompanyLogoUrl());
            if (updated.getRole() != null) existing.setRole(updated.getRole());
            if (updated.getPackageLpa() != null) existing.setPackageLpa(updated.getPackageLpa());
            if (updated.getBatchYear() != null) existing.setBatchYear(updated.getBatchYear());
            if (updated.getPlacedDate() != null) existing.setPlacedDate(updated.getPlacedDate());
            if (updated.getBannerImageUrl() != null) existing.setBannerImageUrl(updated.getBannerImageUrl());
            return achieverRepository.save(existing);
        });
    }

    public void deletePlacedAchiever(Long id) {
        achieverRepository.deleteById(id);
    }

    public Map<String, Object> generatePlacementNotice(Map<String, Object> req) {
        String companyName = (String) req.getOrDefault("companyName", "Top Recruiter");
        String role = (String) req.getOrDefault("role", "Software Engineer");
        String packageLpa = (String) req.getOrDefault("packageLpa", "");
        String bannerImageUrl = (String) req.getOrDefault("bannerImageUrl", "");
        String batchYear = (String) req.getOrDefault("batchYear", "2025-2026");
        String companyLogoUrl = (String) req.getOrDefault("companyLogoUrl", "");

        List<Map<String, String>> students = (List<Map<String, String>>) req.getOrDefault("placedStudents", List.of());
        int count = students != null ? students.size() : 0;
        List<PlacedStudentAchievement> savedAchievers = new ArrayList<>();

        if (students != null && !students.isEmpty()) {
            for (Map<String, String> s : students) {
                String name = s.getOrDefault("name", "").trim();
                if (name.isEmpty()) continue;

                String prn = s.getOrDefault("prn", s.getOrDefault("rollNo", ""));
                String div = s.getOrDefault("division", "");
                String pkg = s.getOrDefault("packageLpa", packageLpa);
                String photo = s.getOrDefault("photoUrl", "");

                PlacedStudentAchievement ach = PlacedStudentAchievement.builder()
                        .studentName(name)
                        .prn(prn)
                        .division(div)
                        .photoUrl(photo)
                        .companyName(companyName)
                        .companyLogoUrl(companyLogoUrl)
                        .role(role)
                        .packageLpa(pkg != null && !pkg.isBlank() ? pkg : packageLpa)
                        .batchYear(batchYear)
                        .placedDate(LocalDate.now().toString())
                        .bannerImageUrl(bannerImageUrl)
                        .build();

                savedAchievers.add(achieverRepository.save(ach));
            }
        }

        String pushTitle = "🎉 Placement Notice: " + companyName;
        String pushMsg = (count > 0 ? count + " students placed at " : "Recruitment results announced for ") + companyName
                + (packageLpa != null && !packageLpa.isBlank() ? " (" + packageLpa + ")" : "");
        pushNotificationService.sendPushNotificationToAll(pushTitle, pushMsg);

        activityLogRepository.save(ActivityLog.builder()
                .title("Placement Notice Broadcasted")
                .subtitle(companyName + " • " + (count > 0 ? count + " Students Placed" : "Results Announced"))
                .icon("campaign")
                .colorBg("bg-amber-100")
                .colorIcon("text-amber-700")
                .type("PLACEMENT")
                .createdAt(LocalDateTime.now())
                .build());

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Official placement notice broadcasted successfully to all users and achievers recorded!");
        response.put("companyName", companyName);
        response.put("role", role);
        response.put("packageLpa", packageLpa);
        response.put("achieversCount", savedAchievers.size());
        response.put("achievers", savedAchievers);
        return response;
    }

    public void resetPlacementData() {
        statRepository.deleteAll();
        recruiterRepository.deleteAll();
        driveRepository.deleteAll();
        achieverRepository.deleteAll();
    }
}
