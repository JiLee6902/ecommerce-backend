// Chuyển sang database 'admin'
db = db.getSiblingDB('admin');

// Kiểm tra và tạo người dùng 'admin' nếu chưa tồn tại
if (!db.getUsers().some(user => user.user === 'admin' && user.db === 'admin')) {
    db.createUser({
        user: 'admin',
        pwd: 'password',
        roles: [
            { role: 'userAdminAnyDatabase', db: 'admin' },
            { role: 'dbAdminAnyDatabase', db: 'admin' },
            { role: 'readWriteAnyDatabase', db: 'admin' }
        ]
    });
}

// Chuyển sang database 'shopDEV'
db = db.getSiblingDB('shopDEV');

// Kiểm tra và tạo người dùng 'admin' cho 'shopDEV' nếu chưa tồn tại
if (!db.getUsers().some(user => user.user === 'admin' && user.db === 'shopDEV')) {
    db.createUser({
        user: 'admin',
        pwd: 'password',
        roles: [
            { role: 'dbOwner', db: 'shopDEV' },
            { role: 'readWrite', db: 'shopDEV' }
        ]
    });
}
