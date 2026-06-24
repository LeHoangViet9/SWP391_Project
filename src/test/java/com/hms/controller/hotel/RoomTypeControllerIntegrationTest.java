package com.hms.controller.hotel;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hms.common.enums.AccountStatus; // 🛠️ Import enum trạng thái hệ thống của bạn
import com.hms.dto.roomtype.request.RoomTypeRequest;
import com.hms.entity.hotel.RoomType;
import com.hms.repository.hotel.RoomTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Locale;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@org.springframework.security.test.context.support.WithMockUser(roles = "ADMIN")
public class RoomTypeControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private com.hms.repository.booking.InvoiceRepository invoiceRepository;

    @Autowired
    private com.hms.repository.booking.BookingRepository bookingRepository;

    @Autowired
    private com.hms.repository.hotel.RoomRepository roomRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private RoomType testRoomType1;
    private RoomType testRoomType2;

    @BeforeEach
    void setUp() {
        invoiceRepository.deleteAll();
        bookingRepository.deleteAll();
        roomRepository.deleteAll();
        roomTypeRepository.deleteAll();

        // 🛠️ Cập nhật: Thêm trạng thái ACTIVE để phù hợp với hàm findByIdAndStatus và các bộ lọc tìm kiếm
        testRoomType1 = RoomType.builder()
                .typeName("Deluxe Room")
                .description("Luxury room with sea view")
                .basePrice(150)
                .maxGuests(2)
                .status(AccountStatus.ACTIVE)
                .build();

        testRoomType2 = RoomType.builder()
                .typeName("Standard Room")
                .description("Cozy city view room")
                .basePrice(80)
                .maxGuests(1)
                .status(AccountStatus.ACTIVE)
                .build();

        testRoomType1 = roomTypeRepository.save(testRoomType1);
        testRoomType2 = roomTypeRepository.save(testRoomType2);
    }

    @Test
    void getAllRoomType_Success() throws Exception {
        mockMvc.perform(get("/api/v1/room-types")
                        .locale(Locale.ENGLISH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(2)));
    }

    @Test
    void getAllRoomType_Success_Vietnamese() throws Exception {
        mockMvc.perform(get("/api/v1/room-types")
                        .header("Accept-Language", "vi") // 🛠️ Dùng Header chuẩn thay vì cookie/param để đồng bộ Postman
                        .locale(Locale.forLanguageTag("vi")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    void getRoomTypeById_Success() throws Exception {
        mockMvc.perform(get("/api/v1/room-types/" + testRoomType1.getId())
                        .locale(Locale.ENGLISH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.typeName", is("Deluxe Room")));
    }

    @Test
    void getRoomTypeById_NotFound() throws Exception {
        mockMvc.perform(get("/api/v1/room-types/99999")
                        .locale(Locale.ENGLISH))
                .andExpect(status().isNotFound()); // 🛠️ SỬA LỖI: Exception NotFound phải trả về 404
    }

    @Test
    void getRoomTypeById_NotFound_Vietnamese() throws Exception {
        mockMvc.perform(get("/api/v1/room-types/99999")
                        .header("Accept-Language", "vi")
                        .locale(Locale.forLanguageTag("vi")))
                .andExpect(status().isNotFound()) // 🛠️ SỬA LỖI: Trả về 404 thay vì 400
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Không tìm thấy Loại phòng!"))); // Khớp 100% file properties
    }

    @Test
    void createRoomType_Success() throws Exception {
        RoomTypeRequest request = new RoomTypeRequest();
        request.setTypeName("Suite Room");
        request.setDescription("Ultra luxury president suite");
        request.setBasePrice(500);
        request.setMaxGuests(4);

        mockMvc.perform(post("/api/v1/room-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", notNullValue()))
                .andExpect(jsonPath("$.data.typeName", is("Suite Room")));
    }

    @Test
    void createRoomType_ValidationFailure_Vietnamese() throws Exception {
        RoomTypeRequest request = new RoomTypeRequest();
        request.setTypeName("");
        request.setBasePrice(-10);
        request.setMaxGuests(0);

        mockMvc.perform(post("/api/v1/room-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .header("Accept-Language", "vi")
                        .locale(Locale.forLanguageTag("vi")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Dữ liệu nhập vào không hợp lệ! Vui lòng kiểm tra lại."))) // Khớp error.validation.failed
                .andExpect(jsonPath("$.data.basePrice", is("Giá cơ bản phải là số dương!"))); // Khớp roomtype.baseprice.positive
    }

    @Test
    void createRoomType_DuplicateName() throws Exception {
        RoomTypeRequest request = new RoomTypeRequest();
        request.setTypeName("Deluxe Room"); // Tên đã tồn tại ở hàm setUp
        request.setDescription("Duplicate deluxe");
        request.setBasePrice(200);
        request.setMaxGuests(2);

        mockMvc.perform(post("/api/v1/room-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .header("Accept-Language", "vi") // Dùng tiếng Việt kiểm tra lỗi trùng
                        .locale(Locale.forLanguageTag("vi")))
                .andExpect(status().isConflict()) // 🛠️ SỬA LỖI: Lỗi Conflict trùng lặp phải trả về HTTP 409
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Tên Loại phòng đã tồn tại!"))); // Khớp error.roomtype.exists
    }

    @Test
    void updateRoomType_Success() throws Exception {
        RoomTypeRequest request = new RoomTypeRequest();
        request.setTypeName("Deluxe Room Updated");
        request.setDescription("Updated deluxe room description");
        request.setBasePrice(175);
        request.setMaxGuests(3);

        mockMvc.perform(put("/api/v1/room-types/" + testRoomType1.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.typeName", is("Deluxe Room Updated")));
    }

    @Test
    void updateRoomType_DuplicateName() throws Exception {
        RoomTypeRequest request = new RoomTypeRequest();
        request.setTypeName("Standard Room"); // Trùng với tên của testRoomType2
        request.setDescription("Try to conflict name");
        request.setBasePrice(120);
        request.setMaxGuests(2);

        mockMvc.perform(put("/api/v1/room-types/" + testRoomType1.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .header("Accept-Language", "vi")
                        .locale(Locale.forLanguageTag("vi")))
                .andExpect(status().isConflict()) // 🛠️ SỬA LỖI: Trả về lỗi 409 Conflict trùng lặp dữ liệu
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Tên Loại phòng đã tồn tại!")));
    }

    @Test
    void deleteRoomType_Success() throws Exception {
        mockMvc.perform(delete("/api/v1/room-types/" + testRoomType1.getId())
                        .locale(Locale.ENGLISH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // 🛠️ KIỂM TRA LOGIC SOFT DELETE: Sau khi xóa mềm, tìm kiếm bằng ID phải báo lỗi 404 lập tức
        mockMvc.perform(get("/api/v1/room-types/" + testRoomType1.getId()))
                .andExpect(status().isNotFound());
    }
}