package com.fittrack.backend.controller;

import com.fittrack.backend.model.Food;
import com.fittrack.backend.model.MealPlan;
import com.fittrack.backend.model.MealPlanItem;
import com.fittrack.backend.model.Subscription;
import com.fittrack.backend.model.User;
import com.fittrack.backend.repository.FoodRepository;
import com.fittrack.backend.repository.MealPlanRepository;
import com.fittrack.backend.repository.SubscriptionRepository;
import com.fittrack.backend.repository.UserRepository;
import com.fittrack.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/meal-plans")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class MealPlanController {

    private final MealPlanRepository mealPlanRepository;
    private final FoodRepository foodRepository;
    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final NotificationService notificationService;

    @GetMapping("/foods/search")
    public ResponseEntity<List<Food>> searchFoods(@RequestParam String q) {
        return ResponseEntity.ok(foodRepository.searchByName(q));
    }

    @GetMapping("/foods/categories")
    public ResponseEntity<List<String>> getCategories() {
        return ResponseEntity.ok(foodRepository.findAllCategories());
    }

    @GetMapping("/foods")
    public ResponseEntity<List<Food>> getFoodsByCategory(
            @RequestParam String category) {
        return ResponseEntity.ok(foodRepository.findByCategory(category));
    }

    @PostMapping("/create")
    public ResponseEntity<?> createMealPlan(
            @RequestBody MealPlanRequest request) {

        User trainer = userRepository.findById(request.getTrainerId())
                .orElseThrow(() -> new RuntimeException("Trainer not found"));
        User client = userRepository.findById(request.getClientId())
                .orElseThrow(() -> new RuntimeException("Client not found"));

        List<MealPlan> existingPlans =
                mealPlanRepository.findByClientId(client.getId());
        existingPlans.forEach(plan -> plan.setIsActive(false));
        mealPlanRepository.saveAll(existingPlans);

        MealPlan mealPlan = new MealPlan();
        mealPlan.setTrainer(trainer);
        mealPlan.setClient(client);
        mealPlan.setPlanName(request.getPlanName());
        mealPlan.setTargetCalories(request.getTargetCalories());
        mealPlan.setTargetProtein(request.getTargetProtein() != null
                ? request.getTargetProtein() : 0.0);
        mealPlan.setTargetCarbs(request.getTargetCarbs() != null
                ? request.getTargetCarbs() : 0.0);
        mealPlan.setTargetFats(request.getTargetFats() != null
                ? request.getTargetFats() : 0.0);
        mealPlan.setNotes(request.getNotes());
        mealPlan.setIsActive(true);
        mealPlan.setCreatedAt(LocalDateTime.now());

        if (request.getItems() != null) {
            List<MealPlanItem> items = request.getItems().stream()
                    .map(i -> {
                        MealPlanItem item = new MealPlanItem();
                        item.setMealPlan(mealPlan);
                        item.setDayOfWeek(i.getDayOfWeek());
                        item.setMealTime(i.getMealTime());
                        item.setFoodName(i.getFoodName());
                        item.setCalories(i.getCalories());
                        item.setQuantity(i.getQuantity());
                        item.setUnit(i.getUnit());
                        item.setProtein(i.getProtein() != null
                                ? i.getProtein() : 0.0);
                        item.setCarbs(i.getCarbs() != null
                                ? i.getCarbs() : 0.0);
                        item.setFats(i.getFats() != null
                                ? i.getFats() : 0.0);
                        return item;
                    })
                    .collect(Collectors.toList());
            mealPlan.setItems(items);
        }

        mealPlanRepository.save(mealPlan);

        // ── NOTIFICATION ──
        notificationService.mealAssigned(client, trainer.getName());

        return ResponseEntity.ok(
                Map.of("message", "Meal plan created successfully"));
    }

    @GetMapping("/client/{clientId}/trainer/{trainerId}")
    public ResponseEntity<List<MealPlan>> getPlansForClient(
            @PathVariable Long clientId,
            @PathVariable Long trainerId) {
        return ResponseEntity.ok(
                mealPlanRepository.findByTrainerIdAndClientId(
                        trainerId, clientId));
    }

    @PutMapping("/{planId}/activate")
    public ResponseEntity<?> activatePlan(@PathVariable Long planId) {
        MealPlan plan = mealPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan not found"));
        List<MealPlan> allPlans =
                mealPlanRepository.findByClientId(plan.getClient().getId());
        allPlans.forEach(p -> p.setIsActive(false));
        mealPlanRepository.saveAll(allPlans);
        plan.setIsActive(true);
        mealPlanRepository.save(plan);
        return ResponseEntity.ok(Map.of("message", "Plan activated successfully"));
    }

    @GetMapping("/my-plan/{clientId}")
    public ResponseEntity<?> getActivePlan(@PathVariable Long clientId) {
        Optional<Subscription> activeSub = subscriptionRepository
                .findTopByClientIdAndStatusOrderByIdDesc(clientId, "ACTIVE");
        if (activeSub.isEmpty()) {
            return ResponseEntity.ok(Map.of("message", "No active meal plan"));
        }
        Long currentTrainerId = activeSub.get().getTrainer().getId();
        Optional<MealPlan> plan = mealPlanRepository
                .findTopByClientIdAndTrainerIdAndIsActiveTrueOrderByIdDesc(
                        clientId, currentTrainerId);
        if (plan.isEmpty()) {
            return ResponseEntity.ok(Map.of("message", "No active meal plan"));
        }
        return ResponseEntity.ok(plan.get());
    }

    @lombok.Data
    static class MealPlanRequest {
        private Long trainerId;
        private Long clientId;
        private String planName;
        private Integer targetCalories;
        private Double targetProtein;
        private Double targetCarbs;
        private Double targetFats;
        private String notes;
        private List<MealPlanItem> items;
    }
}