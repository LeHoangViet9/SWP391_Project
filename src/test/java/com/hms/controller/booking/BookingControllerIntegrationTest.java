package com.hms.controller.booking;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hms.common.enums.BookingStatus;
import com.hms.common.enums.PaymentStatus;
import com.hms.common.enums.RoomStatus;
import com.hms.common.enums.AccountStatus;
import com.hms.dto.booking.request.BookingRequest;
import com.hms.dto.booking.request.BookingRoomAssignRequest;
import com.hms.dto.booking.request.BookingStatusRequest;
import com.hms.entity.booking.Invoice;
import com.hms.entity.customer.Customer;
import com.hms.entity.hotel.Room;
import com.hms.entity.hotel.RoomType;
import com.hms.repository.booking.BookingRepository;
import com.hms.repository.booking.InvoiceRepository;
import com.hms.repository.customer.CustomerRepository;
import com.hms.repository.hotel.RoomRepository;
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
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@org.springframework.security.test.context.support.WithMockUser(authorities = {
        "BOOKING_VIEW",
        "BOOKING_CREATE",
        "BOOKING_UPDATE",
        "BOOKING_DELETE",
        "INVOICE_UPDATE"
})
public class BookingControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private Customer testCustomer;
    private RoomType testRoomType;
    private Room testRoom;

    @BeforeEach
    void setUp() {
        // 1. Tạo Customer
        testCustomer = Customer.builder()
                .fullName("John Doe Test")
                .email("test.john.doe@hms-test.com")
                .phone("0999999999")
                .idNumberCard("999999999999")
                .idType(com.hms.common.enums.IdType.CCCD)
                .nationality("Vietnam")
                .status(AccountStatus.ACTIVE)
                .build();
        testCustomer = customerRepository.save(testCustomer);

        // 2. Tạo RoomType
        testRoomType = RoomType.builder()
                .typeName("TEST-Standard")
                .basePrice(500000)
                .maxGuests(2)
                .description("Cozy single bed room")
                .status(AccountStatus.ACTIVE)
                .build();
        testRoomType = roomTypeRepository.save(testRoomType);

        // 3. Tạo Room vật lý
        testRoom = Room.builder()
                .roomNumber("TEST-101")
                .floorNumber(1)
                .roomType(testRoomType)
                .roomStatus(RoomStatus.AVAILABLE)
                .description("First floor room")
                .build();
        testRoom = roomRepository.save(testRoom);
    }

    @Test
    void createBooking_MultipleRooms_AutoAssignsPhysicalRooms() throws Exception {
        Room secondRoom = roomRepository.save(Room.builder()
                .roomNumber("TEST-102")
                .floorNumber(1)
                .roomType(testRoomType)
                .roomStatus(RoomStatus.AVAILABLE)
                .description("Second room")
                .build());

        BookingRequest request = new BookingRequest();
        request.setCustomerId(testCustomer.getId());
        request.setRoomTypeId(testRoomType.getId());
        request.setCheckInDate(LocalDateTime.now().plusDays(5));
        request.setCheckOutDate(LocalDateTime.now().plusDays(7));
        request.setQuantity(2);

        mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.quantity", is(2)))
                .andExpect(jsonPath("$.data.roomIds", hasSize(2)))
                .andExpect(jsonPath("$.data.roomNumbers", containsInAnyOrder("TEST-101", "TEST-102")));

        assertEquals(RoomStatus.RESERVED, roomRepository.findById(testRoom.getId()).orElseThrow().getRoomStatus());
        assertEquals(RoomStatus.RESERVED, roomRepository.findById(secondRoom.getId()).orElseThrow().getRoomStatus());
    }

    @Test
    void testBookingLifecycleFlow_Success() throws Exception {
        // --- 1. Thêm một phòng cụ thể vào giỏ (status = PENDING_PAYMENT) ---
        BookingRequest createReq = new BookingRequest();
        createReq.setCustomerId(testCustomer.getId());
        createReq.setRoomTypeId(testRoomType.getId());
        createReq.setRoomId(testRoom.getId());
        createReq.setCheckInDate(LocalDateTime.now().plusDays(2));
        createReq.setCheckOutDate(LocalDateTime.now().plusDays(4));
        createReq.setQuantity(1);

        String createRes = mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.bookingStatus", is("PENDING_PAYMENT")))
                .andExpect(jsonPath("$.data.roomId", is(testRoom.getId().intValue())))
                .andExpect(jsonPath("$.data.holdExpiresAt", notNullValue()))
                .andReturn().getResponse().getContentAsString();

        Long bookingId = objectMapper.readTree(createRes).path("data").path("id").asLong();
        assertNotNull(bookingId);

        // Hóa đơn được tạo ngay cùng mục giỏ hàng.
        List<Invoice> invoices = invoiceRepository.findAll();
        Invoice bookingInvoice = invoices.stream()
                .filter(i -> i.getBooking().getId().equals(bookingId))
                .findFirst()
                .orElse(null);
        assertNotNull(bookingInvoice, "Invoice should be automatically generated for the booking");
        assertEquals(PaymentStatus.PENDING, bookingInvoice.getPaymentStatus());

        // --- 2. Thanh toán thành công -> tự động chờ check-in ---
        mockMvc.perform(post("/api/v1/invoices/webhook/payment-success/" + bookingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.paymentStatus", is("PAID")));

        assertEquals(BookingStatus.PENDING_CHECK_IN,
                bookingInvoice.getBooking().getBookingStatus());

        // Kiểm tra trạng thái phòng vật lý đổi sang RESERVED
        Room updatedRoom = roomRepository.findById(testRoom.getId()).orElseThrow();
        assertEquals(RoomStatus.RESERVED, updatedRoom.getRoomStatus());

        // --- 3. Khách check-in (PENDING_CHECK_IN -> CHECKED_IN) ---
        BookingStatusRequest checkinReq = new BookingStatusRequest();
        checkinReq.setStatus(BookingStatus.CHECKED_IN);

        mockMvc.perform(patch("/api/v1/bookings/" + bookingId + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkinReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.bookingStatus", is("CHECKED_IN")));

        // Kiểm tra trạng thái phòng vật lý đổi sang OCCUPIED sau khi check-in
        Room occupiedRoom = roomRepository.findById(testRoom.getId()).orElseThrow();
        assertEquals(RoomStatus.OCCUPIED, occupiedRoom.getRoomStatus());

        // --- 5. Khách check-out (CHECKED_IN -> CHECKED_OUT) ---
        BookingStatusRequest checkoutReq = new BookingStatusRequest();
        checkoutReq.setStatus(BookingStatus.CHECKED_OUT);

        mockMvc.perform(patch("/api/v1/bookings/" + bookingId + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.bookingStatus", is("CHECKED_OUT")));

        // Kiểm tra trạng thái phòng vật lý chuyển sang DIRTY
        Room finalRoom = roomRepository.findById(testRoom.getId()).orElseThrow();
        assertEquals(RoomStatus.DIRTY, finalRoom.getRoomStatus());
    }

    @Test
    void testInvalidStatusTransition_BadRequest() throws Exception {
        // --- 1. Tạo đơn đặt phòng mới (status = PENDING) ---
        BookingRequest createReq = new BookingRequest();
        createReq.setCustomerId(testCustomer.getId());
        createReq.setRoomTypeId(testRoomType.getId());
        createReq.setCheckInDate(LocalDateTime.now().plusDays(2));
        createReq.setCheckOutDate(LocalDateTime.now().plusDays(4));
        createReq.setQuantity(1);

        String createRes = mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andReturn().getResponse().getContentAsString();

        Long bookingId = objectMapper.readTree(createRes).path("data").path("id").asLong();

        // --- 2. Thử chuyển PENDING -> CHECKED_IN trực tiếp (lỗi) ---
        BookingStatusRequest invalidReq = new BookingStatusRequest();
        invalidReq.setStatus(BookingStatus.CHECKED_IN);

        mockMvc.perform(patch("/api/v1/bookings/" + bookingId + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void createBookingWithInvalidBookerCccd_BadRequest() throws Exception {
        testCustomer.setIdNumberCard("12345678901");
        customerRepository.save(testCustomer);

        mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createBookingRequest())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void createBookingForOtherWithInvalidGuestCccd_BadRequest() throws Exception {
        BookingRequest request = createBookingRequest();
        request.setBookingForOther(true);
        request.setGuestFullName("Guest Test");
        request.setGuestPhone("0988888888");
        request.setGuestIdType("CCCD");
        request.setGuestIdNumberCard("12345678901A");

        mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void createBookingForOtherWithDuplicateCccd_BadRequest() throws Exception {
        BookingRequest request = createBookingRequest();
        request.setBookingForOther(true);
        request.setGuestFullName("Guest Test");
        request.setGuestPhone("0988888888");
        request.setGuestIdType("CCCD");
        request.setGuestIdNumberCard(testCustomer.getIdNumberCard());

        mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }

    private BookingRequest createBookingRequest() {
        BookingRequest request = new BookingRequest();
        request.setCustomerId(testCustomer.getId());
        request.setRoomTypeId(testRoomType.getId());
        request.setCheckInDate(LocalDateTime.now().plusDays(2));
        request.setCheckOutDate(LocalDateTime.now().plusDays(4));
        request.setQuantity(1);
        return request;
    }
}
