package com.hms.controller.housekeeping;

import com.hms.common.dto.ApiResponse;
import com.hms.common.enums.TaskStatus;
import com.hms.dto.housekeeping.request.HouseKeepingTaskRequest;
import com.hms.dto.housekeeping.request.HouseKeepingTaskUpdateRequest;
import com.hms.dto.housekeeping.response.HouseKeepingTaskResponse;
import com.hms.service.housekeeping.IHouseKeepingTaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/v1/housekeeping-tasks")
@RequiredArgsConstructor
public class HouseKeepingTaskController {

    private final IHouseKeepingTaskService taskService;
    private final MessageSource messageSource;

    /**
     * Get all housekeeping tasks
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<HouseKeepingTaskResponse>>> getAllTasks(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        Locale locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage("success.task.getall", null, locale);

        ApiResponse<Page<HouseKeepingTaskResponse>> response = ApiResponse.<Page<HouseKeepingTaskResponse>>builder()
                .success(true)
                .message(message)
                .data(taskService.getAllTasks(page, size))
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    /**
     * Get task by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HouseKeepingTaskResponse>> getTaskById(@PathVariable Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        HouseKeepingTaskResponse taskResponse = taskService.getTaskById(id);
        String message = messageSource.getMessage("success.task.getbyid", null, locale);

        ApiResponse<HouseKeepingTaskResponse> response = ApiResponse.<HouseKeepingTaskResponse>builder()
                .success(true)
                .message(message)
                .data(taskResponse)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    /**
     * Create a new housekeeping task
     */
    @PostMapping
    public ResponseEntity<ApiResponse<HouseKeepingTaskResponse>> createTask(
            @RequestBody @Valid HouseKeepingTaskRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        HouseKeepingTaskResponse created = taskService.createTask(request);
        String message = messageSource.getMessage("success.task.create", null, locale);

        ApiResponse<HouseKeepingTaskResponse> response = ApiResponse.<HouseKeepingTaskResponse>builder()
                .success(true)
                .message(message)
                .data(created)
                .status(HttpStatus.CREATED)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Update a housekeeping task
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<HouseKeepingTaskResponse>> updateTask(
            @PathVariable Long id,
            @RequestBody @Valid HouseKeepingTaskUpdateRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        HouseKeepingTaskResponse updated = taskService.updateTask(id, request);
        String message = messageSource.getMessage("success.task.update", null, locale);

        ApiResponse<HouseKeepingTaskResponse> response = ApiResponse.<HouseKeepingTaskResponse>builder()
                .success(true)
                .message(message)
                .data(updated)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    /**
     * Delete a housekeeping task
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        Locale locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage("success.task.delete", null, locale);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message(message)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    /**
     * Get tasks by status
     */
    @GetMapping("/by-status/{status}")
    public ResponseEntity<ApiResponse<Page<HouseKeepingTaskResponse>>> getTasksByStatus(
            @PathVariable TaskStatus status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        Locale locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage("success.task.getbystatus", null, locale);

        ApiResponse<Page<HouseKeepingTaskResponse>> response = ApiResponse.<Page<HouseKeepingTaskResponse>>builder()
                .success(true)
                .message(message)
                .data(taskService.getTasksByStatus(status, page, size))
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    /**
     * Get tasks assigned to a user
     */
    @GetMapping("/assigned-to/{userId}")
    public ResponseEntity<ApiResponse<Page<HouseKeepingTaskResponse>>> getTasksByAssignedTo(
            @PathVariable Long userId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        Locale locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage("success.task.getbyassignedto", null, locale);

        ApiResponse<Page<HouseKeepingTaskResponse>> response = ApiResponse.<Page<HouseKeepingTaskResponse>>builder()
                .success(true)
                .message(message)
                .data(taskService.getTasksByAssignedTo(userId, page, size))
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    /**
     * Get tasks assigned by a user
     */
    @GetMapping("/assigned-by/{userId}")
    public ResponseEntity<ApiResponse<Page<HouseKeepingTaskResponse>>> getTasksByAssignedBy(
            @PathVariable Long userId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        Locale locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage("success.task.getbyassignedby", null, locale);

        ApiResponse<Page<HouseKeepingTaskResponse>> response = ApiResponse.<Page<HouseKeepingTaskResponse>>builder()
                .success(true)
                .message(message)
                .data(taskService.getTasksByAssignedBy(userId, page, size))
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    /**
     * Get tasks for a room
     */
    @GetMapping("/by-room/{roomId}")
    public ResponseEntity<ApiResponse<Page<HouseKeepingTaskResponse>>> getTasksByRoom(
            @PathVariable Long roomId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        Locale locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage("success.task.getbyroom", null, locale);

        ApiResponse<Page<HouseKeepingTaskResponse>> response = ApiResponse.<Page<HouseKeepingTaskResponse>>builder()
                .success(true)
                .message(message)
                .data(taskService.getTasksByRoom(roomId, page, size))
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    /**
     * Get tasks by status and assigned user
     */
    @GetMapping("/by-status-and-user/{status}/{userId}")
    public ResponseEntity<ApiResponse<Page<HouseKeepingTaskResponse>>> getTasksByStatusAndAssignedTo(
            @PathVariable TaskStatus status,
            @PathVariable Long userId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        Locale locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage("success.task.getbystatusanduser", null, locale);

        ApiResponse<Page<HouseKeepingTaskResponse>> response = ApiResponse.<Page<HouseKeepingTaskResponse>>builder()
                .success(true)
                .message(message)
                .data(taskService.getTasksByStatusAndAssignedTo(status, userId, page, size))
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    /**
     * Get tasks by status and room
     */
    @GetMapping("/by-status-and-room/{status}/{roomId}")
    public ResponseEntity<ApiResponse<Page<HouseKeepingTaskResponse>>> getTasksByStatusAndRoom(
            @PathVariable TaskStatus status,
            @PathVariable Long roomId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        Locale locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage("success.task.getbystatusandroom", null, locale);

        ApiResponse<Page<HouseKeepingTaskResponse>> response = ApiResponse.<Page<HouseKeepingTaskResponse>>builder()
                .success(true)
                .message(message)
                .data(taskService.getTasksByStatusAndRoom(status, roomId, page, size))
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    /**
     * Start a task (change status to IN_PROGRESS)
     */
    @PatchMapping("/{id}/start")
    public ResponseEntity<ApiResponse<Void>> startTask(@PathVariable Long id) {
        taskService.startTask(id);
        Locale locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage("success.task.start", null, locale);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message(message)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    /**
     * Complete a task (change status to COMPLETED)
     */
    @PatchMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<Void>> completeTask(@PathVariable Long id) {
        taskService.completeTask(id);
        Locale locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage("success.task.complete", null, locale);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message(message)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    /**
     * Cancel a task (change status to CANCELLED)
     */
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelTask(@PathVariable Long id) {
        taskService.cancelTask(id);
        Locale locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage("success.task.cancel", null, locale);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message(message)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    /**
     * Skip a task (change status to SKIPPED)
     */
    @PatchMapping("/{id}/skip")
    public ResponseEntity<ApiResponse<Void>> skipTask(@PathVariable Long id) {
        taskService.skipTask(id);
        Locale locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage("success.task.skip", null, locale);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message(message)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    /**
     * Get pending tasks for a room
     */
    @GetMapping("/pending/room/{roomId}")
    public ResponseEntity<ApiResponse<List<HouseKeepingTaskResponse>>> getPendingTasksByRoom(
            @PathVariable Long roomId) {

        Locale locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage("success.task.getpending", null, locale);

        ApiResponse<List<HouseKeepingTaskResponse>> response = ApiResponse.<List<HouseKeepingTaskResponse>>builder()
                .success(true)
                .message(message)
                .data(taskService.getPendingTasksByRoom(roomId))
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    /**
     * Get uncompleted tasks for a user
     */
    @GetMapping("/uncompleted/user/{userId}")
    public ResponseEntity<ApiResponse<List<HouseKeepingTaskResponse>>> getUncompletedTasksByUser(
            @PathVariable Long userId) {

        Locale locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage("success.task.getuncompleted", null, locale);

        ApiResponse<List<HouseKeepingTaskResponse>> response = ApiResponse.<List<HouseKeepingTaskResponse>>builder()
                .success(true)
                .message(message)
                .data(taskService.getUncompletedTasksByUser(userId))
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}

