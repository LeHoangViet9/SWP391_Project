package com.hms.controller.hotel;

import com.hms.dto.roomtype.RoomTypeRequest;
import com.hms.entity.hotel.RoomType;
import com.hms.repository.hotel.RoomTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;
import jakarta.servlet.http.Cookie;

import java.math.BigDecimal;
import java.util.Locale;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class RoomTypeControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private JsonMapper.Builder jsonMapperBuilder;

    private JsonMapper jsonMapper;
    private RoomType testRoomType1;
    private RoomType testRoomType2;

    @BeforeEach
    void setUp() {
        jsonMapper = jsonMapperBuilder.build();
        roomTypeRepository.deleteAll();

        testRoomType1 = RoomType.builder()
                .typeName("Deluxe Room")
                .description("Luxury room with sea view")
                .basePrice(new BigDecimal("150.00"))
                .maxGuests(2)
                .build();

        testRoomType2 = RoomType.builder()
                .typeName("Standard Room")
                .description("Cozy city view room")
                .basePrice(new BigDecimal("80.00"))
                .maxGuests(1)
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
                .andExpect(jsonPath("$.message", is("Room Types retrieved successfully!")))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].typeName", is("Deluxe Room")))
                .andExpect(jsonPath("$.data[1].typeName", is("Standard Room")));
    }

    @Test
    void getAllRoomType_Success_Vietnamese() throws Exception {
        mockMvc.perform(get("/api/v1/room-types")
                        .cookie(new Cookie("hms_lang", "vi"))
                        .param("lang", "vi")
                        .locale(Locale.forLanguageTag("vi")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Lấy danh sách loại phòng thành công!")));
    }

    @Test
    void getRoomTypeById_Success() throws Exception {
        mockMvc.perform(get("/api/v1/room-types/" + testRoomType1.getId())
                        .locale(Locale.ENGLISH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Room Type retrieved successfully!")))
                .andExpect(jsonPath("$.data.typeName", is("Deluxe Room")))
                .andExpect(jsonPath("$.data.basePrice", closeTo(150.00, 0.01)));
    }

    @Test
    void getRoomTypeById_NotFound() throws Exception {
        mockMvc.perform(get("/api/v1/room-types/99999")
                        .locale(Locale.ENGLISH))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Room Type not found!")));
    }

    @Test
    void getRoomTypeById_NotFound_Vietnamese() throws Exception {
        mockMvc.perform(get("/api/v1/room-types/99999")
                        .cookie(new Cookie("hms_lang", "vi"))
                        .param("lang", "vi")
                        .locale(Locale.forLanguageTag("vi")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Không tìm thấy Loại phòng!")));
    }

    @Test
    void createRoomType_Success() throws Exception {
        RoomTypeRequest request = new RoomTypeRequest();
        request.setTypeName("Suite Room");
        request.setDescription("Ultra luxury president suite");
        request.setBasePrice(new BigDecimal("500.00"));
        request.setMaxGuests(4);

        mockMvc.perform(post("/api/v1/room-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Room Type created successfully!")))
                .andExpect(jsonPath("$.data.id", notNullValue()))
                .andExpect(jsonPath("$.data.typeName", is("Suite Room")))
                .andExpect(jsonPath("$.data.maxGuests", is(4)));
    }

    @Test
    void createRoomType_ValidationFailure() throws Exception {
        RoomTypeRequest request = new RoomTypeRequest();
        request.setTypeName(""); // Blank
        request.setBasePrice(new BigDecimal("-10.00")); // Positive check fail
        request.setMaxGuests(0); // Min(1) check fail

        mockMvc.perform(post("/api/v1/room-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Validation failed! Please check your input data.")))
                .andExpect(jsonPath("$.data.typeName", is("Room Type name cannot be blank!")))
                .andExpect(jsonPath("$.data.basePrice", is("Base price must be a positive number!")))
                .andExpect(jsonPath("$.data.maxGuests", is("Maximum guests number must be at least 1!")));
    }

    @Test
    void createRoomType_ValidationFailure_Vietnamese() throws Exception {
        RoomTypeRequest request = new RoomTypeRequest();
        request.setTypeName(""); // Blank
        request.setBasePrice(new BigDecimal("-10.00")); // Positive check fail
        request.setMaxGuests(0); // Min(1) check fail

        mockMvc.perform(post("/api/v1/room-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request))
                        .cookie(new Cookie("hms_lang", "vi"))
                        .param("lang", "vi")
                        .locale(Locale.forLanguageTag("vi")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Dữ liệu nhập vào không hợp lệ! Vui lòng kiểm tra lại.")))
                .andExpect(jsonPath("$.data.typeName", is("Tên loại phòng không được để trống!")))
                .andExpect(jsonPath("$.data.basePrice", is("Giá cơ bản phải là số dương!")))
                .andExpect(jsonPath("$.data.maxGuests", is("Số lượng khách tối đa phải ít nhất là 1!")));
    }

    @Test
    void createRoomType_DuplicateName() throws Exception {
        RoomTypeRequest request = new RoomTypeRequest();
        request.setTypeName("Deluxe Room"); // Already exists
        request.setDescription("Duplicate deluxe");
        request.setBasePrice(new BigDecimal("200.00"));
        request.setMaxGuests(2);

        mockMvc.perform(post("/api/v1/room-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Room Type name already exists!")));
    }

    @Test
    void updateRoomType_Success() throws Exception {
        RoomTypeRequest request = new RoomTypeRequest();
        request.setTypeName("Deluxe Room Updated");
        request.setDescription("Updated deluxe room description");
        request.setBasePrice(new BigDecimal("175.00"));
        request.setMaxGuests(3);

        mockMvc.perform(put("/api/v1/room-types/" + testRoomType1.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Room Type updated successfully!")))
                .andExpect(jsonPath("$.data.typeName", is("Deluxe Room Updated")))
                .andExpect(jsonPath("$.data.basePrice", closeTo(175.00, 0.01)))
                .andExpect(jsonPath("$.data.maxGuests", is(3)));
    }

    @Test
    void updateRoomType_DuplicateName() throws Exception {
        RoomTypeRequest request = new RoomTypeRequest();
        request.setTypeName("Standard Room"); // Name of another room type
        request.setDescription("Try to conflict name");
        request.setBasePrice(new BigDecimal("120.00"));
        request.setMaxGuests(2);

        mockMvc.perform(put("/api/v1/room-types/" + testRoomType1.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Room Type name already exists!")));
    }

    @Test
    void updateRoomType_NotFound() throws Exception {
        RoomTypeRequest request = new RoomTypeRequest();
        request.setTypeName("New Room Type");
        request.setDescription("Updated");
        request.setBasePrice(new BigDecimal("100.00"));
        request.setMaxGuests(2);

        mockMvc.perform(put("/api/v1/room-types/99999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Room Type not found!")));
    }

    @Test
    void deleteRoomType_Success() throws Exception {
        mockMvc.perform(delete("/api/v1/room-types/" + testRoomType1.getId())
                        .locale(Locale.ENGLISH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Room Type deleted successfully!")));
    }

    @Test
    void deleteRoomType_NotFound() throws Exception {
        mockMvc.perform(delete("/api/v1/room-types/99999")
                        .locale(Locale.ENGLISH))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Room Type not found!")));
    }
}
