package com.hms.controller.booking;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hms.common.enums.AccountStatus;
import com.hms.common.enums.BookingStatus;
import com.hms.common.enums.IdType;
import com.hms.common.enums.PaymentStatus;
import com.hms.common.enums.RoomStatus;
import com.hms.dto.booking.request.BookingRequest;
import com.hms.entity.booking.Booking;
import com.hms.entity.customer.Customer;
import com.hms.entity.hotel.Room;
import com.hms.entity.hotel.RoomType;
import com.hms.repository.booking.BookingRepository;
import com.hms.repository.booking.InvoiceRepository;
import com.hms.repository.customer.CustomerRepository;
import com.hms.repository.hotel.RoomRepository;
import com.hms.repository.hotel.RoomTypeRepository;
import com.hms.service.booking.BookingHoldScheduler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@WithMockUser(authorities = {
        "BOOKING_VIEW",
        "BOOKING_CREATE",
        "BOOKING_UPDATE",
        "BOOKING_DELETE",
        "INVOICE_VIEW",
        "INVOICE_UPDATE"
})
class BookingChecklistIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private BookingHoldScheduler bookingHoldScheduler;

    private Customer customer;
    private RoomType roomType;
    private Room room;

    @BeforeEach
    void setUp() {
        customer = customerRepository.save(Customer.builder()
                .fullName("Checklist Customer")
                .email("checklist.customer@hms-test.com")
                .phone("0987654321")
                .idType(IdType.CCCD)
                .idNumberCard("123456789012")
                .nationality("Vietnam")
                .status(AccountStatus.ACTIVE)
                .build());

        roomType = roomTypeRepository.save(RoomType.builder()
                .typeName("CHECKLIST-ROOM-TYPE")
                .description("Booking checklist room type")
                .basePrice(500000)
                .maxGuests(2)
                .status(AccountStatus.ACTIVE)
                .build());

        room = roomRepository.save(Room.builder()
                .roomNumber("CHECKLIST-101")
                .floorNumber(1)
                .roomType(roomType)
                .roomStatus(RoomStatus.AVAILABLE)
                .description("Booking checklist room")
                .build());
    }

    @Test
    void requiredFieldsAndInvalidDatesAreRejected() throws Exception {
        mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());

        BookingRequest pastRequest = bookingRequest(LocalDateTime.now().minusDays(1),
                LocalDateTime.now().plusDays(1));
        mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pastRequest)))
                .andExpect(status().isConflict());

        LocalDateTime equalDate = LocalDateTime.now().plusDays(2);
        BookingRequest equalDatesRequest = bookingRequest(equalDate, equalDate);
        mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(equalDatesRequest)))
                .andExpect(status().isConflict());
    }

    @Test
    void bookingForOtherRejectsInvalidGuestPhoneAndEmail() throws Exception {
        BookingRequest invalidPhone = bookingRequest(LocalDateTime.now().plusDays(2),
                LocalDateTime.now().plusDays(3));
        invalidPhone.setBookingForOther(true);
        invalidPhone.setGuestFullName("Guest One");
        invalidPhone.setGuestPhone("not-a-phone");
        invalidPhone.setGuestEmail("guest@example.com");
        invalidPhone.setGuestIdType("PASSPORT");
        invalidPhone.setGuestIdNumberCard("P123456");

        mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidPhone)))
                .andExpect(status().isBadRequest());

        BookingRequest invalidEmail = bookingRequest(LocalDateTime.now().plusDays(4),
                LocalDateTime.now().plusDays(5));
        invalidEmail.setBookingForOther(true);
        invalidEmail.setGuestFullName("Guest Two");
        invalidEmail.setGuestPhone("0912345678");
        invalidEmail.setGuestEmail("invalid-email");
        invalidEmail.setGuestIdType("PASSPORT");
        invalidEmail.setGuestIdNumberCard("P123457");

        mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidEmail)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void checkoutAtSameTimeAsNextCheckinIsAllowed() throws Exception {
        LocalDateTime firstCheckIn = LocalDateTime.now().plusDays(2);
        LocalDateTime boundary = LocalDateTime.now().plusDays(3);

        createBooking(bookingRequest(firstCheckIn, boundary));
        mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookingRequest(boundary,
                                boundary.plusDays(1)))))
                .andExpect(status().isCreated());
    }

    @Test
    void cancelPendingBookingReleasesRoomAndCancelsInvoice() throws Exception {
        JsonNode bookingJson = objectMapper.readTree(createBooking(bookingRequest(
                LocalDateTime.now().plusDays(2), LocalDateTime.now().plusDays(3))));
        Long bookingId = bookingJson.path("data").path("id").asLong();

        mockMvc.perform(delete("/api/v1/bookings/" + bookingId))
                .andExpect(status().isOk());

        Booking cancelled = bookingRepository.findById(bookingId).orElseThrow();
        assertEquals(BookingStatus.CANCELLED, cancelled.getBookingStatus());
        assertEquals(PaymentStatus.CANCELLED, cancelled.getInvoice().getPaymentStatus());
        assertEquals(RoomStatus.AVAILABLE, roomRepository.findById(room.getId()).orElseThrow().getRoomStatus());
    }

    @Test
    void expiredHoldIsCancelledAndPaymentAfterExpiryIsRejected() throws Exception {
        JsonNode bookingJson = objectMapper.readTree(createBooking(bookingRequest(
                LocalDateTime.now().plusDays(2), LocalDateTime.now().plusDays(3))));
        Long bookingId = bookingJson.path("data").path("id").asLong();

        Booking booking = bookingRepository.findById(bookingId).orElseThrow();
        booking.setHoldExpiresAt(LocalDateTime.now().minusMinutes(1));
        bookingRepository.save(booking);

        bookingHoldScheduler.cancelExpiredHolds();

        Booking expired = bookingRepository.findById(bookingId).orElseThrow();
        assertEquals(BookingStatus.CANCELLED, expired.getBookingStatus());
        assertEquals(PaymentStatus.CANCELLED, expired.getInvoice().getPaymentStatus());
        assertEquals(RoomStatus.AVAILABLE, roomRepository.findById(room.getId()).orElseThrow().getRoomStatus());

        mockMvc.perform(post("/api/v1/invoices/webhook/payment-success/" + bookingId))
                .andExpect(status().isConflict());
    }

    @Test
    void noShowMovesBookingToNoShowAndRoomToDirty() throws Exception {
        JsonNode bookingJson = objectMapper.readTree(createBooking(bookingRequest(
                LocalDateTime.now().plusDays(2), LocalDateTime.now().plusDays(3))));
        Long bookingId = bookingJson.path("data").path("id").asLong();

        mockMvc.perform(post("/api/v1/invoices/webhook/payment-success/" + bookingId))
                .andExpect(status().isOk());
        mockMvc.perform(patch("/api/v1/bookings/" + bookingId + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"NO_SHOW\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.bookingStatus", is("NO_SHOW")));

        assertEquals(RoomStatus.DIRTY, roomRepository.findById(room.getId()).orElseThrow().getRoomStatus());
    }

    @Test
    void checkedInBookingCannotBeCancelled() throws Exception {
        JsonNode bookingJson = objectMapper.readTree(createBooking(bookingRequest(
                LocalDateTime.now().plusDays(2), LocalDateTime.now().plusDays(3))));
        Long bookingId = bookingJson.path("data").path("id").asLong();

        mockMvc.perform(post("/api/v1/invoices/webhook/payment-success/" + bookingId))
                .andExpect(status().isOk());
        mockMvc.perform(patch("/api/v1/bookings/" + bookingId + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CHECKED_IN\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/v1/bookings/" + bookingId))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = { "INVOICE_VIEW" })
    void invoiceViewerCannotCancelAnotherCustomersBooking() {
        Booking booking = bookingRepository.save(Booking.builder()
                .customer(customer)
                .roomType(roomType)
                .room(room)
                .quantity(1)
                .pricePerNight(java.math.BigDecimal.valueOf(500000))
                .checkInDate(LocalDateTime.now().plusDays(2))
                .checkOutDate(LocalDateTime.now().plusDays(3))
                .bookingStatus(BookingStatus.PENDING_PAYMENT)
                .holdExpiresAt(LocalDateTime.now().plusMinutes(1))
                .totalPrice(java.math.BigDecimal.valueOf(500000))
                .build());

        org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request =
                delete("/api/v1/bookings/" + booking.getId());
        try {
            mockMvc.perform(request).andExpect(status().isForbidden());
        } catch (Exception exception) {
            throw new AssertionError(exception);
        }
    }

    @Test
    void changingBookingQuantityReservesAllRequestedRooms() throws Exception {
        Room secondRoom = roomRepository.save(Room.builder()
                .roomNumber("CHECKLIST-102")
                .floorNumber(1)
                .roomType(roomType)
                .roomStatus(RoomStatus.AVAILABLE)
                .description("Second checklist room")
                .build());

        BookingRequest createRequest = bookingRequest(LocalDateTime.now().plusDays(2),
                LocalDateTime.now().plusDays(3));
        JsonNode bookingJson = objectMapper.readTree(createBooking(createRequest));
        Long bookingId = bookingJson.path("data").path("id").asLong();

        BookingRequest updateRequest = bookingRequest(createRequest.getCheckInDate(), createRequest.getCheckOutDate());
        updateRequest.setQuantity(2);
        mockMvc.perform(put("/api/v1/bookings/" + bookingId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.quantity", is(2)))
                .andExpect(jsonPath("$.data.roomIds", hasSize(2)));

        assertEquals(RoomStatus.RESERVED, roomRepository.findById(room.getId()).orElseThrow().getRoomStatus());
        assertEquals(RoomStatus.RESERVED, roomRepository.findById(secondRoom.getId()).orElseThrow().getRoomStatus());
    }

    @Test
    void bookingSearchSupportsCurrentStatusAndCustomerFilters() throws Exception {
        JsonNode bookingJson = objectMapper.readTree(createBooking(bookingRequest(
                LocalDateTime.now().plusDays(2), LocalDateTime.now().plusDays(3))));
        Long bookingId = bookingJson.path("data").path("id").asLong();

        mockMvc.perform(get("/api/v1/bookings/search")
                        .param("customerId", customer.getId().toString())
                        .param("status", "PENDING_PAYMENT")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].id", is(bookingId.intValue())));

        mockMvc.perform(get("/api/v1/bookings/search")
                        .param("customerId", "999999")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(0)));
    }

    @Test
    void bookingHistoryRepositoryAppliesKeywordStatusAndDateFilters() throws Exception {
        LocalDateTime firstCheckIn = LocalDateTime.now().plusDays(2);
        LocalDateTime secondCheckIn = LocalDateTime.now().plusDays(4);

        createBooking(bookingRequest(firstCheckIn, firstCheckIn.plusDays(1)));
        Long secondId = objectMapper.readTree(createBooking(bookingRequest(
                secondCheckIn, secondCheckIn.plusDays(1)))).path("data").path("id").asLong();

        Booking secondBooking = bookingRepository.findById(secondId).orElseThrow();
        secondBooking.setBookingStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(secondBooking);

        Page<Booking> result = bookingRepository.searchHistoryByCustomerId(
                customer.getId(),
                String.valueOf(secondId),
                BookingStatus.CONFIRMED,
                secondCheckIn.toLocalDate().atStartOfDay(),
                secondCheckIn.toLocalDate().plusDays(1).atStartOfDay(),
                PageRequest.of(0, 10));

        assertEquals(1, result.getTotalElements());
        assertEquals(secondId, result.getContent().get(0).getId());
        assertEquals(BookingStatus.CONFIRMED, result.getContent().get(0).getBookingStatus());
    }

    private String createBooking(BookingRequest request) throws Exception {
        return mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.holdExpiresAt", notNullValue()))
                .andReturn().getResponse().getContentAsString();
    }

    private BookingRequest bookingRequest(LocalDateTime checkIn, LocalDateTime checkOut) {
        BookingRequest request = new BookingRequest();
        request.setCustomerId(customer.getId());
        request.setRoomTypeId(roomType.getId());
        request.setCheckInDate(checkIn);
        request.setCheckOutDate(checkOut);
        request.setQuantity(1);
        return request;
    }
}
