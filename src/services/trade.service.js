import { tradeRepo, collectionRepo } from '../database/repositories.js';

const TRADE_TIMEOUT_MS = 60 * 1000; // 1 phút
const MAX_ITEMS_PER_SIDE = 3;

export const tradeService = {
    /**
     * Tạo trade request mới
     */
    createTradeRequest(initiatorId, targetId, messageId, channelId) {
        // Kiểm tra không trade với chính mình
        if (initiatorId === targetId) {
            return { success: false, error: 'self_trade' };
        }

        // Kiểm tra user đang có trade pending không
        const pendingInit = tradeRepo.getPendingTrade(initiatorId);
        if (pendingInit) {
            return { success: false, error: 'initiator_busy' };
        }

        const pendingTarget = tradeRepo.getPendingTrade(targetId);
        if (pendingTarget) {
            return { success: false, error: 'target_busy' };
        }

        const expiresAt = new Date(Date.now() + TRADE_TIMEOUT_MS).toISOString();
        const result = tradeRepo.createTrade(initiatorId, targetId, messageId, channelId, expiresAt);

        return { success: true, tradeId: result.lastInsertRowid };
    },

    /**
     * Chấp nhận trade request
     */
    acceptTrade(tradeId, userId) {
        const trade = tradeRepo.getById(tradeId);
        if (!trade) return { success: false, error: 'not_found' };
        if (trade.target_id !== userId) return { success: false, error: 'not_target' };
        if (trade.status !== 'pending') return { success: false, error: 'invalid_status' };

        tradeRepo.updateStatus(tradeId, 'selecting');
        return { success: true };
    },

    /**
     * Từ chối trade request
     */
    declineTrade(tradeId, userId) {
        const trade = tradeRepo.getById(tradeId);
        if (!trade) return { success: false, error: 'not_found' };
        if (trade.target_id !== userId && trade.initiator_id !== userId) {
            return { success: false, error: 'not_participant' };
        }

        tradeRepo.cancelTrade(tradeId);
        return { success: true };
    },

    /**
     * Chọn nhân vật để trade
     */
    selectItems(tradeId, userId, characterIds) {
        const trade = tradeRepo.getById(tradeId);
        if (!trade) return { success: false, error: 'not_found' };
        if (trade.status !== 'selecting') return { success: false, error: 'invalid_status' };
        if (trade.initiator_id !== userId && trade.target_id !== userId) {
            return { success: false, error: 'not_participant' };
        }

        // Validate số lượng
        if (characterIds.length > MAX_ITEMS_PER_SIDE) {
            return { success: false, error: 'too_many_items' };
        }

        // Validate ownership
        for (const charId of characterIds) {
            if (!collectionRepo.userOwnsCharacter(userId, charId)) {
                return { success: false, error: 'not_owned' };
            }
        }

        // Clear old selections và add new
        tradeRepo.clearUserItems(tradeId, userId);
        for (const charId of characterIds) {
            tradeRepo.addTradeItem(tradeId, userId, charId);
        }

        // Kiểm tra cả 2 bên đã chọn chưa
        const initiatorItems = tradeRepo.getUserItems(tradeId, trade.initiator_id);
        const targetItems = tradeRepo.getUserItems(tradeId, trade.target_id);

        // Nếu cả 2 đã chọn (hoặc chọn 0 = gift), chuyển sang confirming
        // Note: Chúng ta cần track ai đã submit selection
        return { success: true, bothSelected: false };
    },

    /**
     * Xác nhận trade
     */
    confirmTrade(tradeId, userId) {
        const trade = tradeRepo.getById(tradeId);
        if (!trade) return { success: false, error: 'not_found' };
        if (trade.status !== 'confirming') return { success: false, error: 'invalid_status' };

        tradeRepo.setConfirmation(tradeId, userId, true);

        // Reload trade để check confirmations
        const updated = tradeRepo.getById(tradeId);

        if (updated.initiator_confirmed && updated.target_confirmed) {
            // Cả 2 đã confirm - thực hiện trade
            const success = tradeRepo.executeTrade(tradeId);
            return { success: true, completed: true };
        }

        return { success: true, completed: false };
    },

    /**
     * Hủy trade
     */
    cancelTrade(tradeId, userId) {
        const trade = tradeRepo.getById(tradeId);
        if (!trade) return { success: false, error: 'not_found' };
        if (trade.initiator_id !== userId && trade.target_id !== userId) {
            return { success: false, error: 'not_participant' };
        }

        tradeRepo.cancelTrade(tradeId);
        return { success: true };
    },

    /**
     * Lấy thông tin trade
     */
    getTradeInfo(tradeId) {
        const trade = tradeRepo.getById(tradeId);
        if (!trade) return null;

        const initiatorItems = tradeRepo.getUserItems(tradeId, trade.initiator_id);
        const targetItems = tradeRepo.getUserItems(tradeId, trade.target_id);

        return {
            ...trade,
            initiatorItems,
            targetItems
        };
    },

    /**
     * Chuyển sang phase confirming
     */
    moveToConfirming(tradeId) {
        tradeRepo.updateStatus(tradeId, 'confirming');
    },

    /**
     * Lấy collection của user để hiển thị trong select menu
     */
    getUserCollectionForTrade(userId) {
        const data = collectionRepo.getUserCollection(userId, 1, 25); // Max 25 for select menu
        return data.characters;
    }
};

export function getTradeErrorMessage(error) {
    const messages = {
        'self_trade': '❌ Bạn không thể trade với chính mình!',
        'initiator_busy': '❌ Bạn đang có một trade đang chờ!',
        'target_busy': '❌ Người này đang có một trade đang chờ!',
        'not_found': '❌ Trade không tồn tại hoặc đã hết hạn!',
        'not_target': '❌ Bạn không phải người được mời trade!',
        'not_participant': '❌ Bạn không tham gia trade này!',
        'invalid_status': '❌ Trade không ở trạng thái phù hợp!',
        'too_many_items': `❌ Tối đa ${MAX_ITEMS_PER_SIDE} nhân vật mỗi bên!`,
        'not_owned': '❌ Bạn không sở hữu một trong các nhân vật đã chọn!'
    };
    return messages[error] || '❌ Có lỗi xảy ra!';
}
