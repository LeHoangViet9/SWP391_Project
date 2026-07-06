package com.hms.controller.housekeeping;

import com.hms.common.dto.ApiResponse;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.common.enums.TaskStatus;
import com.hms.dto.housekeeping.request.HouseKeepingTaskRequest;
import com.hms.dto.housekeeping.request.HouseKeepingTaskUpdateRequest;
import com.hms.dto.housekeeping.request.ReportRoomIssueRequest;
import com.hms.dto.housekeeping.request.MinibarReportRequest;
import com.hms.dto.housekeeping.response.HouseKeepingTaskResponse;
import com.hms.dto.housekeeping.response.RoomStateHistoryResponse;
import com.hms.service.housekeeping.IHouseKeepingTaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/v1/housekeeping-tasks")
@RequiredArgsConstructor
public class HouseKeepingTaskController {

    private final IHouseKeepingTaskService taskService;
    private final MessageSource messageSource;

    @GetMapping("/search")
    @PreAuthorize("hasAuthority('HOUSEKEEPING_VIEW')")
    public ResponseEntity<ApiResponse<Page<HouseKeepingTaskResponse>>> searchTasks(
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) Long assignedToId,
            @RequestParam(required = false) Long assignedById,
            @RequestParam(required = false) Long roomId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "ID") SortField sortBy,
            @RequestParam(defaultValue = "ASC") SortDirection direction

    ) {

        Locale locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage("success.task.getall", null, locale);

        ApiResponse<Page<HouseKeepingTaskResponse>> response = ApiResponse.<Page<HouseKeepingTaskResponse>>builder()
                .success(true)
                .message(message)
                .data(taskService.searchTasks(status, assignedToId, assignedById, roomId, page, size,sortBy,direction))
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('HOUSEKEEPING_VIEW')")
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

    @GetMapping("/pending/room/{roomId}")
    @PreAuthorize("hasAuthority('HOUSEKEEPING_VIEW')")
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

    @GetMapping("/uncompleted/user/{userId}")
    @PreAuthorize("hasAuthority('HOUSEKEEPING_VIEW')")
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


    @GetMapping("/rooms/{roomId}/state-history")
    @PreAuthorize("hasAuthority('HOUSEKEEPING_VIEW')")
    public ResponseEntity<ApiResponse<Page<RoomStateHistoryResponse>>> getRoomStateHistory(
            @PathVariable Long roomId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "ID") SortField sortBy,
            @RequestParam(defaultValue = "ASC") SortDirection direction) {
        Locale locale = LocaleContextHolder.getLocale();

        return new ResponseEntity<>(new ApiResponse<>(
                true,
                messageSource.getMessage("success.task.byId",null,locale),
                taskService.getRoomStateHistory(roomId, page, size, sortBy, direction),
                HttpStatus.OK
        ),HttpStatus.OK);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('HOUSEKEEPING_CREATE')")
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

    @PutMapping("/updateTask/{id}")
    @PreAuthorize("hasAuthority('HOUSEKEEPING_UPDATE')")
    public ResponseEntity<ApiResponse<HouseKeepingTaskResponse>> updateTask(
            @PathVariable Long id,
            @RequestBody HouseKeepingTaskUpdateRequest request) {
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

    @DeleteMapping("/deleteTask/{id}")
    @PreAuthorize("hasAuthority('HOUSEKEEPING_DELETE')")
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
    @PostMapping("/rooms/{roomId}/report-issue")
    @PreAuthorize("hasAuthority('HOUSEKEEPING_UPDATE')")
    public ResponseEntity<ApiResponse<Void>> reportRoomIssue(
            @PathVariable Long roomId,
            @RequestBody @Valid ReportRoomIssueRequest request) {

        taskService.reportRoomIssue(roomId, request);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message("Room issue reported successfully")
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PostMapping("/{id}/report-minibar")
    public ResponseEntity<ApiResponse<Void>> reportMinibar(
            @PathVariable Long id,
            @RequestBody @Valid MinibarReportRequest request) {

        taskService.reportMinibar(id, request);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message("Đã gửi báo cáo minibar buồng phòng thành công")
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}