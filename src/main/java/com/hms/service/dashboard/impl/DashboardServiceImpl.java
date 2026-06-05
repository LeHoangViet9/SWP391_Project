package com.hms.service.dashboard.impl;

import com.hms.common.enums.BookingStatus;
import com.hms.dto.dashboard.response.AdminDashboardResponse;
import com.hms.dto.dashboard.response.ReceptionistDashboardResponse;
import com.hms.repository.booking.BookingRepository;
import com.hms.repository.booking.InvoiceRepository;
import com.hms.repository.hotel.RoomRepository;
import com.hms.service.dashboard.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final BookingRepository bookingRepository;
    private final InvoiceRepository invoiceRepository;
    private final RoomRepository roomRepository;

    @Override
    public AdminDashboardResponse getAdminDashboard() {
        LocalDate today = LocalDate.now();

        LocalDateTime startOfToday = today.atStartOfDay();
        LocalDateTime startOfTomorrow = today.plusDays(1).atStartOfDay();

        LocalDateTime startOfMonth = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime startOfNextMonth = today.plusMonths(1).withDayOfMonth(1).atStartOfDay();

        BigDecimal totalRevenueAllTime = nullToZero(invoiceRepository.calculateTotalRevenueAllTime());
        BigDecimal todayRevenue = nullToZero(invoiceRepository.calculateRevenueBetween(startOfToday, startOfTomorrow));
        BigDecimal thisMonthRevenue = nullToZero(invoiceRepository.calculateRevenueBetween(startOfMonth, startOfNextMonth));

        long totalSuccessfulBookings = bookingRepository.countBookingByBookingStatus(BookingStatus.CHECKED_OUT);

        Map<String, Long> bookingsCountByRoomType = convertRoomTypeStats(
                bookingRepository.countBookingsGroupedByRoomType()
        );

        Map<String, BigDecimal> revenueByPaymentMethod = convertRevenueByPaymentMethod(
                invoiceRepository.getRevenueGroupedByPaymentMethod()
        );

        List<AdminDashboardResponse.RevenueChartPoint> revenueTrend = buildSevenDayRevenueTrend(today);

        return AdminDashboardResponse.builder()
                .totalRevenueAllTime(totalRevenueAllTime)
                .todayRevenue(todayRevenue)
                .thisMonthRevenue(thisMonthRevenue)
                .totalSuccessfulBookings(totalSuccessfulBookings)
                .bookingsCountByRoomType(bookingsCountByRoomType)
                .revenueByPaymentMethod(revenueByPaymentMethod)
                .revenueTrend(revenueTrend)
                .build();
    }

    @Override
    public ReceptionistDashboardResponse getReceptionistDashboard() {
        LocalDate today = LocalDate.now();

        LocalDateTime startOfToday = today.atStartOfDay();
        LocalDateTime startOfTomorrow = today.plusDays(1).atStartOfDay();

        long expectedCheckIns = bookingRepository.countByBookingStatusAndCheckInDateBetween(
                BookingStatus.CONFIRMED,
                startOfToday,
                startOfTomorrow
        );

        long expectedCheckOuts = bookingRepository.countByBookingStatusAndCheckOutDateBetween(
                BookingStatus.CHECKED_IN,
                startOfToday,
                startOfTomorrow
        );

        long actualCheckIns = bookingRepository.countByBookingStatusAndCheckInDateBetween(
                BookingStatus.CHECKED_IN,
                startOfToday,
                startOfTomorrow
        );

        long actualCheckOuts = bookingRepository.countByBookingStatusAndCheckOutDateBetween(
                BookingStatus.CHECKED_OUT,
                startOfToday,
                startOfTomorrow
        );

        long pendingBookings = bookingRepository.countBookingByBookingStatus(BookingStatus.PENDING);

        Map<String, Long> roomStatusOverview = convertRoomStatusStats(
                roomRepository.countRoomsGroupedByStatus()
        );

        return ReceptionistDashboardResponse.builder()
                .expectedCheckIns(expectedCheckIns)
                .expectedCheckOuts(expectedCheckOuts)
                .actualCheckIns(actualCheckIns)
                .actualCheckOuts(actualCheckOuts)
                .pendingBookings(pendingBookings)
                .roomStatusOverview(roomStatusOverview)
                .build();
    }

    private List<AdminDashboardResponse.RevenueChartPoint> buildSevenDayRevenueTrend(LocalDate today) {
        return today.minusDays(6)
                .datesUntil(today.plusDays(1))
                .map(date -> {
                    LocalDateTime start = date.atStartOfDay();
                    LocalDateTime end = date.plusDays(1).atStartOfDay();

                    BigDecimal revenue = nullToZero(invoiceRepository.calculateRevenueBetween(start, end));

                    return new AdminDashboardResponse.RevenueChartPoint(
                            date.toString(),
                            revenue
                    );
                })
                .toList();
    }

    private Map<String, Long> convertRoomTypeStats(List<Object[]> rows) {
        Map<String, Long> result = new LinkedHashMap<>();

        for (Object[] row : rows) {
            String roomTypeName = String.valueOf(row[0]);
            Long count = (Long) row[1];
            result.put(roomTypeName, count);
        }

        return result;
    }

    private Map<String, BigDecimal> convertRevenueByPaymentMethod(List<Object[]> rows) {
        Map<String, BigDecimal> result = new LinkedHashMap<>();

        for (Object[] row : rows) {
            String paymentMethod = String.valueOf(row[0]);
            BigDecimal revenue = (BigDecimal) row[1];
            result.put(paymentMethod, nullToZero(revenue));
        }

        return result;
    }

    private Map<String, Long> convertRoomStatusStats(List<Object[]> rows) {
        Map<String, Long> result = new LinkedHashMap<>();

        for (Object[] row : rows) {
            String roomStatus = String.valueOf(row[0]);
            Long count = (Long) row[1];
            result.put(roomStatus, count);
        }

        return result;
    }

    private BigDecimal nullToZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}