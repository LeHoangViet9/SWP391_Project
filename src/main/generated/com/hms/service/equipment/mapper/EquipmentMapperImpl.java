package com.hms.service.equipment.mapper;

import com.hms.dto.equipment.request.EquipmentCreateDTO;
import com.hms.dto.equipment.response.EquipmentResponse;
import com.hms.entity.equipment.Equipment;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-06T22:23:44+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.9 (Oracle Corporation)"
)
@Component
public class EquipmentMapperImpl implements EquipmentMapper {

    @Override
    public Equipment toEntity(EquipmentCreateDTO dto) {
        if ( dto == null ) {
            return null;
        }

        Equipment.EquipmentBuilder equipment = Equipment.builder();

        equipment.equipmentName( dto.getEquipmentName() );
        equipment.equipmentCode( dto.getEquipmentCode() );
        equipment.location( dto.getLocation() );
        equipment.description( dto.getDescription() );
        equipment.imageUrl( dto.getImageUrl() );

        return equipment.build();
    }

    @Override
    public EquipmentResponse toResponse(Equipment equipment) {
        if ( equipment == null ) {
            return null;
        }

        EquipmentResponse.EquipmentResponseBuilder equipmentResponse = EquipmentResponse.builder();

        equipmentResponse.id( equipment.getId() );
        equipmentResponse.equipmentName( equipment.getEquipmentName() );
        equipmentResponse.equipmentCode( equipment.getEquipmentCode() );
        equipmentResponse.location( equipment.getLocation() );
        equipmentResponse.description( equipment.getDescription() );
        equipmentResponse.imageUrl( equipment.getImageUrl() );
        if ( equipment.getStatus() != null ) {
            equipmentResponse.status( equipment.getStatus().name() );
        }
        equipmentResponse.createdAt( equipment.getCreatedAt() );

        return equipmentResponse.build();
    }

    @Override
    public void updateEquipmentFromDto(EquipmentCreateDTO dto, Equipment equipment) {
        if ( dto == null ) {
            return;
        }

        equipment.setEquipmentName( dto.getEquipmentName() );
        equipment.setEquipmentCode( dto.getEquipmentCode() );
        equipment.setLocation( dto.getLocation() );
        equipment.setDescription( dto.getDescription() );
        equipment.setImageUrl( dto.getImageUrl() );
    }
}
