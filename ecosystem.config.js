module.exports = {
    apps: [
        {
            name: 'shopdev-api',
            script: './server.js', // File chính của ứng dụng
            instances: 1, // Số lượng instance
            autorestart: true, // Tự động restart nếu ứng dụng crash
            watch: false, // Có theo dõi file để restart khi có thay đổi không
            max_memory_restart: '1G', // Giới hạn bộ nhớ trước khi restart
            env: {
                NODE_ENV: 'production', // Biến môi trường
            },
            error_file: "/home/ubuntu/logs/shopdev-api-error.log",
            out_file: "/home/ubuntu/logs/shopdev-api-out.log"
        }
    ],
};
