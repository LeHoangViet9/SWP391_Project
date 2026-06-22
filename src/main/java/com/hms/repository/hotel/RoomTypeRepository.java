package com.hms.repository.hotel;

import com.hms.common.enums.AccountStatus;
import com.hms.entity.hotel.RoomType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoomTypeRepository extends JpaRepository<RoomType, Long> {

        boolean existsByTypeNameAndStatus(String typeName, AccountStatus status);

        long countByStatus(AccountStatus status);

        boolean existsByTypeNameAndIdNotAndStatus(String typeName, Long id, AccountStatus status);

        Optional<RoomType> findByIdAndStatus(Long id, AccountStatus status);

        Page<RoomType> findByTypeNameContainingIgnoreCaseAndStatus(String keywords, AccountStatus status,
                        Pageable pageable);

        Page<RoomType> findByTypeNameContainingIgnoreCaseAndMaxGuestsGreaterThanEqualAndStatus(
                        String keywords,
                        Integer maxGuests,
                        AccountStatus status,
                        Pageable pageable);


        java.util.List<RoomType> findAllByStatus(AccountStatus status);

        @Query("""
SELECT rt
FROM RoomType rt
WHERE rt.status = com.hms.common.enums.AccountStatus.ACTIVE
AND (
    CAST(:keyword AS string) IS NULL
    OR CAST(rt.id AS string) LIKE CONCAT('%', CAST(:keyword AS string), '%')
    OR LOWER(rt.typeName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
    OR CAST(rt.basePrice AS string) LIKE CONCAT('%', CAST(:keyword AS string), '%')
    OR CAST(rt.maxGuests AS string) LIKE CONCAT('%', CAST(:keyword AS string), '%')
)
""")
        Page<RoomType> searchRoomTypes(
                @Param("keyword") String keyword,
                Pageable pageable
        );
}