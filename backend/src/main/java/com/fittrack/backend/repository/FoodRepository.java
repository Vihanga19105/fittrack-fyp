package com.fittrack.backend.repository;

import com.fittrack.backend.model.Food;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FoodRepository extends JpaRepository<Food, Long> {

    // Search foods by name - used in trainer's search box
    @Query("SELECT f FROM Food f WHERE LOWER(f.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Food> searchByName(@Param("keyword") String keyword);

    // Get all foods by category
    List<Food> findByCategory(String category);

    // Get all categories (for dropdown filter)
    @Query("SELECT DISTINCT f.category FROM Food f ORDER BY f.category")
    List<String> findAllCategories();
}