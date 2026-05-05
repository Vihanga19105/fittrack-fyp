package com.fittrack.backend.controller;

import com.fittrack.backend.model.ProgressPhoto;
import com.fittrack.backend.model.User;
import com.fittrack.backend.repository.ProgressPhotoRepository;
import com.fittrack.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/progress-photos")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ProgressPhotoController {

    private final ProgressPhotoRepository progressPhotoRepository;
    private final UserRepository userRepository;

    // ── GET ALL MY PHOTOS ──
    @GetMapping
    public ResponseEntity<?> getMyPhotos(Authentication auth) {
        try {
            User me = userRepository.findByEmail(auth.getName())
                    .orElseThrow();
            List<Map<String, Object>> photos =
                    progressPhotoRepository
                            .findByUserOrderByPhotoDateAsc(me)
                            .stream().map(p -> {
                                Map<String, Object> map = new HashMap<>();
                                map.put("id",         p.getId());
                                map.put("photo",      p.getPhoto());
                                map.put("note",       p.getNote());
                                map.put("photoDate",  p.getPhotoDate() != null ? p.getPhotoDate().toString() : null);
                                map.put("uploadedAt", p.getUploadedAt() != null ? p.getUploadedAt().toString() : null);
                                return map;
                            }).collect(Collectors.toList());
            return ResponseEntity.ok(photos);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("Failed to load photos");
        }
    }

    // ── UPLOAD A PHOTO ──
    @PostMapping
    public ResponseEntity<?> uploadPhoto(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        try {
            User me = userRepository.findByEmail(auth.getName())
                    .orElseThrow();

            String photo = body.get("photo");
            if (photo == null || photo.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body("Photo is required");
            }

            String note      = body.get("note");
            String dateStr   = body.get("photoDate");
            LocalDate date   = (dateStr != null && !dateStr.isEmpty())
                    ? LocalDate.parse(dateStr)
                    : LocalDate.now();

            ProgressPhoto saved = progressPhotoRepository.save(
                    ProgressPhoto.builder()
                            .user(me)
                            .photo(photo)
                            .note(note)
                            .photoDate(date)
                            .build()
            );

            Map<String, Object> result = new HashMap<>();
            result.put("id",        saved.getId());
            result.put("photoDate", saved.getPhotoDate().toString());
            result.put("note",      saved.getNote());
            result.put("uploadedAt",saved.getUploadedAt().toString());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("Failed to upload photo: " + e.getMessage());
        }
    }

    // ── DELETE A PHOTO ──
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deletePhoto(
            @PathVariable Long id,
            Authentication auth) {
        try {
            User me = userRepository.findByEmail(auth.getName())
                    .orElseThrow();
            progressPhotoRepository.deleteByIdAndUser(id, me);
            return ResponseEntity.ok("Photo deleted");
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("Failed to delete photo");
        }
    }
}