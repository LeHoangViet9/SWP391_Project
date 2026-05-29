package com.hms.controller.equipment;
import com.hms.dto.equipment.request.EquipmentCreateDTO;
import com.hms.dto.equipment.response.EquipmentResponse;
import com.hms.service.equipment.EquipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipments")
@RequiredArgsConstructor
public class EquipmentController {
    private final EquipmentService equipmentService;

    @PostMapping
    public EquipmentResponse createEquipment(
            @RequestBody EquipmentCreateDTO dto) {
        return equipmentService.createEquipment(dto);
    }

    @GetMapping
    public List<EquipmentResponse> getEquipments() {
        return equipmentService.getEquipments();
    }

    @GetMapping("/{id}")
    public EquipmentResponse getEquipmentById(
            @PathVariable Long id) {
        return equipmentService.findById(id);
    }

    @PutMapping("/{id}")
    public EquipmentResponse updateEquipment(
            @PathVariable Long id,
            @RequestBody EquipmentCreateDTO dto) {
        return equipmentService.updateEquipment(id, dto);
    }

    @DeleteMapping("/{id}")
    public void deleteEquipment(
            @PathVariable Long id) {
        equipmentService.deleteEquipment(id);
    }
}
