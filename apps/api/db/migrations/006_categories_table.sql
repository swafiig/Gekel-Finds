CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    subtitle VARCHAR(150),
    icon VARCHAR(50),
    image_url TEXT,
    color VARCHAR(20)
);

INSERT INTO categories (id, name, subtitle, icon, image_url, color) VALUES
('shoes', 'Shoes', 'Sneakers, sandals & formal', 'footsteps', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', '#FBE3D3'),
('fashion', 'Fashion', 'Clothes for the whole family', 'shirt', 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400', '#F3E3D2'),
('secondhand', 'Second-hand Gems', 'Quality pre-loved finds', 'pricetags', 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400', '#E9E5E0'),
('accessories', 'Bags & Accessories', 'Bags, watches & belts', 'watch', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400', '#E4E8EE'),
('electronics', 'Phones & Gadgets', 'Phones, buds & chargers', 'phone-portrait', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', '#E6E3DE'),
('home', 'Home & Kitchen', 'Kitchenware & household', 'restaurant', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400', '#FDEBC8'),
('furniture', 'Furniture & Decor', 'Home, curtains & décor', 'home', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400', '#F6E7DA'),
('hardware', 'Hardware & Tools', 'Workshop & DIY tools', 'hammer', 'https://images.unsplash.com/photo-1581147036324-c1c83d6d3d47?w=400', '#DDE6EE'),
('wholesale', 'Wholesale Stock', 'Bulk for shops & kiosks', 'cube', 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=400', '#E3F1E4'),
('beauty', 'Beauty & Salon', 'Hair, beauty & barber kit', 'cut', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400', '#FBE4EA'),
('school', 'School Essentials', 'School wear & stationery', 'school', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400', '#E3E8F8'),
('baby', 'Baby & Kids', 'Baby & kids essentials', 'happy', 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400', '#FFF1C9'),
('auto', 'Auto & Motorbike', 'Motorbike & car spares', 'speedometer', 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400', '#E6E6E6'),
('events', 'Events & Weddings', 'Weddings, parties & church', 'sparkles', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400', '#F7E3F5'),
('farm', 'Farm Inputs', 'Seeds, feeds & farm tools', 'leaf', 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400', '#E3F1D9')
ON CONFLICT (id) DO NOTHING;