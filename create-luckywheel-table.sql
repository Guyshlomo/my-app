-- יצירת טבלת luckywheel_coupons (אם לא קיימת)
CREATE TABLE IF NOT EXISTS luckywheel_coupons (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    coins INTEGER,
    icon TEXT,
    color TEXT,
    order_index INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- מחיקת נתונים קיימים (אם יש)
DELETE FROM luckywheel_coupons;

-- הכנסת כל הקופונים והשוברים שהיו בעבר
INSERT INTO luckywheel_coupons (title, coins, icon, color, order_index) VALUES
('כרטיס להופעה בדורות', null, '🎫', '#F6B6E6', 0),
('2 אספרסו בקפה צ׳לה', null, '☕', '#FFB084', 1),
('סיבוב נוסף', null, '🔄', '#FFD700', 2),
('חומוס חינם', null, '🥙', '#FFA500', 3),
('1500 מטבעות', 1500, '🪙', '#FF69B4', 4),
('ארוחה בדפקא', null, '🍔', '#90CDF4', 5),
('פיצה אישית בשמרלינג', null, '🍕', '#FF9B9B', 6),
('ארוחת בוקר באוריוס', null, '🍪', '#9FD9B3', 7),
('סרט בקולנוע', null, '🎬', '#FFD700', 8),
('גלידה בטעמים', null, '🍦', '#FF69B4', 9),
('קפה אצל דן דן', null, '☕', '#9FD9B3', 10),
('מאפה בקפה צ׳לה', null, '🍩', '#FF9B9B', 11),
('צ׳יפס במתנה', null, '🍟', '#FFB084', 12),
('מאפה לבחירה', null, '🥨', '#90CDF4', 13),
('שתייה במתנה', null, '🥤', '#F6B6E6', 14);

-- הוספת אינדקסים לביצועים טובים יותר
CREATE INDEX IF NOT EXISTS idx_luckywheel_order ON luckywheel_coupons(order_index);
CREATE INDEX IF NOT EXISTS idx_luckywheel_coins ON luckywheel_coupons(coins); 