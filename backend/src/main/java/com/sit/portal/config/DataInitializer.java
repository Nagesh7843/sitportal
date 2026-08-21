package com.sit.portal.config;

import com.sit.portal.entity.Course;
import com.sit.portal.entity.Laboratory;
import com.sit.portal.entity.ResearchLab;
import com.sit.portal.entity.User;
import com.sit.portal.repository.CourseRepository;
import com.sit.portal.repository.LaboratoryRepository;
import com.sit.portal.repository.ResearchLabRepository;
import com.sit.portal.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initDatabase(
            UserRepository userRepository,
            CourseRepository courseRepository,
            LaboratoryRepository laboratoryRepository,
            ResearchLabRepository researchLabRepository) {
        return args -> {
            // Seed Super Admin in PostgreSQL sitportaldb if not present
            if (!userRepository.existsByEmail("gnagesh550@gmail.com")) {
                userRepository.save(User.builder()
                        .name("Nagesh")
                        .email("gnagesh550@gmail.com")
                        .password("N@gesh7843")
                        .role("admin")
                        .roleTitle("Super Administrator & Website Controller")
                        .department("Computer Science & Engineering")
                        .build());
            }

            // Seed Laboratories
            if (laboratoryRepository.count() == 0) {
                laboratoryRepository.saveAll(List.of(
                        Laboratory.builder().roomNumber("51").name("Database Lab").computers("25 Dell PCs").processor("Intel Core i5").ram("8 GB").storage("500 GB NVMe").additionalEquipment("Printer").totalCost("₹15,90,239").build(),
                        Laboratory.builder().roomNumber("54").name("Operating System Lab").computers("25 Dell PCs").processor("Intel Core i5").ram("8 GB").storage("500 GB NVMe").additionalEquipment("Printer").totalCost("₹16,01,755").build(),
                        Laboratory.builder().roomNumber("56").name("Computer Network Lab").computers("25 HP PCs").processor("Intel Core i7").ram("16 GB").storage("500 GB NVMe").additionalEquipment("Printer").totalCost("₹14,80,315").build(),
                        Laboratory.builder().roomNumber("58").name("Programming Lab (I)").computers("25 HP PCs").processor("Intel Core i7").ram("16 GB").storage("500 GB NVMe").additionalEquipment("Printer").totalCost("₹20,75,035").build(),
                        Laboratory.builder().roomNumber("59").name("Project Lab (I)").computers("25 HP PCs").processor("Intel Core i7").ram("16 GB").storage("500 GB NVMe").additionalEquipment("Printer").totalCost("₹20,75,035").build(),
                        Laboratory.builder().roomNumber("39 A").name("Programming Lab (II)").computers("30 Dell PCs").processor("Intel Core i5").ram("8 GB").storage("500 GB NVMe").additionalEquipment("Printer").totalCost("₹20,56,511").build(),
                        Laboratory.builder().roomNumber("34A").name("Software Engineering Lab").computers("30 HP PCs").processor("Intel Core i7").ram("16 GB").storage("500 GB NVMe").additionalEquipment("Printer").totalCost("₹22,74,163").build(),
                        Laboratory.builder().roomNumber("68").name("Microprocessor Lab").computers("25 Dell PCs").processor("Intel Core i5").ram("8 GB").storage("500 GB NVMe").additionalEquipment("Printer").totalCost("₹15,15,120").build()
                ));
            }

            // Seed Research Labs
            if (researchLabRepository.count() == 0) {
                researchLabRepository.saveAll(List.of(
                        ResearchLab.builder().externalId("lab-1").name("Edge AI & Autonomous Systems Lab").head("Dr. Aris Thorne").location("Building B, Room 304").activeProjects(6).grantsAmount("$450,000").description("Specializing in ultra-low latency federated inference and distributed robotics mesh networks.").image("https://lh3.googleusercontent.com/aida-public/AB6AXuAa6k32AWWQ1Nc1cCJzyv2Wkrvkf2J8eJ2UTIa36OhVhKvbKcWV4Cf7R3UN6Yde9Ty71lEBzMxNmwXdri0rvFGL16vWHWqTQGWVL5c-bbeGSXQL8Rz2RmFEkf5sc0j6gS7UnZQnybxj8D4V1TlHZwmu_R6jgq41hE1XfZNS72hAatU2FMD9oeVkdguE2zg9RLkrNWLkSvlcuJqEynQSeR8PW6CD9ws8fA8I_tTgdIe0Ya6z1jqX4vj4sw").build(),
                        ResearchLab.builder().externalId("lab-2").name("Quantum Computing & Security Center").head("Dr. Alan Turing").location("Building A, Room 102").activeProjects(4).grantsAmount("$680,000").description("Researching post-quantum cryptography algorithms and quantum circuit simulations.").image("https://lh3.googleusercontent.com/aida-public/AB6AXuA6Ar9p087c67Q4MXyfus4ngIztFKgUFdH4qdSPnYHFB6Hez79HzriqxHw9G69hiOWnSMbnL6trw80ASFYAY10ve4CGmCHR97yAb0JynVyCyjMv7QOEf69VSCTMA7oSVNf6pbUgNUhVlmowA9KB95KZqGOmeyW7ElzY27v_zIEVncve58FK3zwoBdN7YoaGSiJ8hp4gcKJ1T3LWyZubNlL-wOjwMd4KiBo4ehybjN8KxGceei4G_Agtew").build(),
                        ResearchLab.builder().externalId("lab-3").name("High-Performance Robotics & Hardware Lab").head("Dr. Margaret Hamilton").location("Innovation Wing, Room 401").activeProjects(8).grantsAmount("$320,000").description("Embedded system architectures, real-time operating kernels, and micro-circuit validation.").image("https://lh3.googleusercontent.com/aida-public/AB6AXuBPFo20fmr6gmokCNjP-ikyxuCkDpm0SoXrIZuzYv8K5vai9zc_LIIOmDsS7y8k0-w0_mULN3jYYti57UKBTATaz5r_WIz3eOIIO_K2zNGdzgOAeML38zwxgAtUffcPBjsNa_m00OOobJ_KQ8Niim6WwUQNgsDezpWoiJGRPtQvVd-zQg1e96cU5lGQjGOnQRYpc24N75vKJ_ElU9SjutSt0X2nZFjwl9ysW14JLmjYN8l5gyXWFUuekg").build()
                ));
            }
        };
    }
}
