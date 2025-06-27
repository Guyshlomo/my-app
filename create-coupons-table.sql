-- יצירת טבלת coupons
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    coins INTEGER NOT NULL,
    color VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- הכנסת דוגמאות קופונים
INSERT INTO coupons (title, description, coins, color) VALUES
('🍩 מאפה בקפה צ׳לה', 'בקניית קפה', 170, '#FF9B9B'),
('🍟 צ׳יפס במתנה בחומוס של טחינה', 'בקניית מנת חומוס', 150, '#FFB084'),
('🥨 מאפה לבחירה באוריוס', 'בקניית קפה', 200, '#90CDF4'),
('🥤 שתייה במתנה בדפקא', 'בקניית ארוחת המבורגר', 180, '#F6B6E6'),
('☕ קפה אצל דן דן', 'בקניית כריך או מאפה', 160, '#9FD9B3'),
('🍕 פיצה אישית בשמרלינג', 'פיצה אישית בשמרלינג', 350, '#FF9B9B'),
('🍔 ארוחה בדפקא', 'ארוחה מלאה בדפקא', 450, '#90CDF4'),
('🎫 כרטיס להופעה בדורות', 'כרטיס להופעה בדורות', 500, '#F6B6E6'); 