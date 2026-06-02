package com.hms.controller.equipment;

import com.hms.common.dto.ApiResponse;
import com.hms.dto.equipment.request.EquipmentCreateDTO;
import com.hms.dto.equipment.response.EquipmentResponse;
import com.hms.service.equipment.EquipmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/equipments")
@RequiredArgsConstructor
public class EquipmentController {
    private final EquipmentService equipmentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<EquipmentResponse>>> findAll() {
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                "equipment.getall.success",
                equipmentService.getEquipments(),
                HttpStatus.OK
        ), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EquipmentResponse>> findById(@PathVariable Long id) {
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                "equipment.getbyid.success",
                equipmentService.findById(id),
                HttpStatus.OK
        ), HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EquipmentResponse>> createEquipment(
            @Valid @RequestBody EquipmentCreateDTO dto) {
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                "equipment.add.success",
                equipmentService.createEquipment(dto),
                HttpStatus.CREATED
        ), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EquipmentResponse>> updateEquipment(
            @Valid @RequestBody EquipmentCreateDTO dto,
            @PathVariable Long id) {
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                "equipment.update.success",
                equipmentService.updateEquipment(id, dto),
                HttpStatus.OK
        ), HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEquipment(@PathVariable Long id) {
        equipmentService.deleteEquipment(id);
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                "equipment.delete.success",
                null,
                HttpStatus.NO_CONTENT
        ), HttpStatus.NO_CONTENT);
    }
}
