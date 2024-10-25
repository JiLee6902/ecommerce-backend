class PresenceService {
    static async updatePresence(userId, userType, status) {
        const key = `presence-${userType}:${userId}`;
        const timestamp = Date.now();
        
        await redisClient.hset(key, {
            status,
            lastActive: timestamp,
            lastStatusChange: timestamp
        });

        // 7 days
        await redisClient.expire(key, 24 * 7 * 60 * 60); 
    }

    static async getPresence(userId, userType) {
        const key = `presence-${userType}:${userId}`;
        const presence = await redisClient.hgetall(key);

        if (!presence || !presence.lastActive) {
            return {
                status: 'offline',
                lastActive: null,
                formattedLastActive: 'Tạm dừng hoạt động'
            };
        }

        const lastActive = parseInt(presence.lastActive);
        const now = Date.now();
        const diffSeconds = Math.floor((now - lastActive) / 1000);

        if (presence.status === 'online' || diffSeconds < 30) {
            return {
                status: 'online',
                lastActive: null,
                formattedLastActive: 'Đang hoạt động'
            };
        }

        // thời gian offline
        let formattedLastActive = '';
        if (diffSeconds < 60) {
            formattedLastActive = 'Vừa mới truy cập';
        } else if (diffSeconds < 3600) {
            const minutes = Math.floor(diffSeconds / 60);
            formattedLastActive = `Hoạt động ${minutes} phút trước`;
        } else if (diffSeconds < 86400) {
            const hours = Math.floor(diffSeconds / 3600);
            formattedLastActive = `Hoạt động ${hours} giờ trước`;
        } else {
            const days = Math.floor(diffSeconds / 86400);
            formattedLastActive = `Hoạt động ${days} ngày trước`;
        }

        return {
            status: 'offline',
            lastActive,
            formattedLastActive
        };
    }
}

module.exports = PresenceService;
