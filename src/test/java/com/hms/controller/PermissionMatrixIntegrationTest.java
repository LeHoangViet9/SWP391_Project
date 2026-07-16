package com.hms.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PermissionMatrixIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void publicRoomTypeAndAvailabilityReadsDoNotRequireLogin() throws Exception {
        mockMvc.perform(get("/api/v1/room-types"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/bookings/check-availability")
                        .param("roomTypeId", "1")
                        .param("checkInDate", "2030-01-01T14:00:00")
                        .param("checkOutDate", "2030-01-03T12:00:00"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/bookings/available-rooms")
                        .param("roomTypeId", "1")
                        .param("checkInDate", "2030-01-01T14:00:00")
                        .param("checkOutDate", "2030-01-03T12:00:00"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminRoleInheritsBookingAndRoomTypeWritePermissions() throws Exception {
        mockMvc.perform(get("/api/v1/bookings"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validBookingJson()))
                .andExpect(result -> assertNotForbidden(result.getResponse().getStatus()));

        mockMvc.perform(post("/api/v1/room-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRoomTypeJson()))
                .andExpect(status().isCreated());

        mockMvc.perform(put("/api/v1/room-types/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRoomTypeJson()))
                .andExpect(result -> assertNotForbidden(result.getResponse().getStatus()));
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void managerCanManageBookingsButCannotWriteRoomTypes() throws Exception {
        mockMvc.perform(get("/api/v1/bookings"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validBookingJson()))
                .andExpect(result -> assertNotForbidden(result.getResponse().getStatus()));

        mockMvc.perform(patch("/api/v1/bookings/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CONFIRMED\"}"))
                .andExpect(result -> assertNotForbidden(result.getResponse().getStatus()));

        mockMvc.perform(post("/api/v1/room-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRoomTypeJson()))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/v1/room-types/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRoomTypeJson()))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/v1/room-types/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "RECEPTIONIST")
    void receptionistCanCreateAndUpdateBookingsButCannotDeleteOrWriteRoomTypes() throws Exception {
        mockMvc.perform(get("/api/v1/bookings"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validBookingJson()))
                .andExpect(result -> assertNotForbidden(result.getResponse().getStatus()));

        mockMvc.perform(patch("/api/v1/bookings/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CONFIRMED\"}"))
                .andExpect(result -> assertNotForbidden(result.getResponse().getStatus()));

        mockMvc.perform(delete("/api/v1/bookings/1"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/room-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRoomTypeJson()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void customerCanCreateBookingsButCannotReadAllBookingsOrManageRoomTypes() throws Exception {
        mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validBookingJson()))
                .andExpect(result -> assertNotForbidden(result.getResponse().getStatus()));

        mockMvc.perform(get("/api/v1/bookings"))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/v1/bookings/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CONFIRMED\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/room-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRoomTypeJson()))
                .andExpect(status().isForbidden());
    }

    private static void assertNotForbidden(int actualStatus) {
        assertNotEquals(HttpStatus.FORBIDDEN.value(), actualStatus);
    }

    private static String validBookingJson() {
        return "{\"customerId\":1,\"roomTypeId\":1,\"checkInDate\":\"2030-01-01T14:00:00\","
                + "\"checkOutDate\":\"2030-01-03T12:00:00\",\"quantity\":1}";
    }

    private static String validRoomTypeJson() {
        return "{\"typeName\":\"Permission Matrix Room\",\"basePrice\":100,\"maxGuests\":2}";
    }
}
