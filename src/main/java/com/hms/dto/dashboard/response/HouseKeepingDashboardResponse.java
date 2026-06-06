package com.hms.dto.dashboard.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class HouseKeepingDashboardResponse {
    private long dirtyRoomsCount;       // Số lượng phòng đang ở trạng thái bẩn (DIRTY) cần dọn gấp
    private long cleaningRoomsCount;    // Số lượng phòng đang được dọn (IN_PROGRESS)
    private long availableRoomsCount;   // Số lượng phòng đã dọn xong sạch sẽ (AVAILABLE)
    private long myAssignedTasksCount;  // Số lượng task dọn phòng được giao riêng cho user này hôm nay

}
